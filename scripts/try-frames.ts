/**
 * Offline check on real frames: runs the extension's own pipeline (binarize → Tesseract with the
 * same settings as the offscreen document → classify → [invert] → mute state machine) on
 * screenshots of the caption region, in order, as if they were consecutive readings.
 *
 * Each input PNG holds the caption region (left 0–90 %, top 80–100 % of the frame),
 * split in two halves stacked on top of each other, as captured in the browser.
 *
 *   npx tsx scripts/try-frames.ts --mode only --speakers "Јово Бакић" --conf 1 frame1.png ...
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { PNG } from 'pngjs';
import { createWorker, OEM, PSM } from 'tesseract.js';
import { binarize } from '../src/shared/binarize.ts';
import { classify, classifyHearOnly, type OcrLine } from '../src/shared/match.ts';
import { initialState, isMuted, step } from '../src/shared/state.ts';
import { DEFAULT_SETTINGS } from '../src/shared/settings.ts';

const TARGET_HEIGHT = 160;
const PAD = 12;

/**
 * One PNG holds one or more frames. Each frame is the caption region split into a left and a right
 * half, stacked (half height = half width / 4). Returns the frames re-joined into wide strips.
 */
function load(path: string): { w: number; h: number; px: Uint8Array }[] {
  const png = PNG.sync.read(readFileSync(path));
  const hw = png.width;
  const hh = Math.round(hw / 4);
  const frames = [];
  for (let top = 0; top + 2 * hh <= png.height + 1; top += 2 * hh) {
    const w = hw * 2;
    const px = new Uint8Array(w * hh * 4);
    for (let y = 0; y < hh; y++) {
      for (let half = 0; half < 2; half++) {
        const row = Math.min(png.height - 1, top + y + half * hh);
        const src = row * hw * 4;
        px.set(png.data.subarray(src, src + hw * 4), (y * w + half * hw) * 4);
      }
    }
    frames.push({ w, h: hh, px });
  }
  return frames;
}

function resize(src: Uint8Array, sw: number, sh: number, dw: number, dh: number): Uint8Array {
  const out = new Uint8Array(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(sh - 1, ((y + 0.5) * sh) / dh - 0.5);
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = Math.max(0, fy - y0);
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(sw - 1, ((x + 0.5) * sw) / dw - 0.5);
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = Math.max(0, fx - x0);
      for (let c = 0; c < 4; c++) {
        const a = src[(y0 * sw + x0) * 4 + c]! * (1 - tx) + src[(y0 * sw + x1) * 4 + c]! * tx;
        const b = src[(y1 * sw + x0) * 4 + c]! * (1 - tx) + src[(y1 * sw + x1) * 4 + c]! * tx;
        out[(y * dw + x) * 4 + c] = Math.round(a * (1 - ty) + b * ty);
      }
    }
  }
  return out;
}

const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const [, v] = args.splice(i, 2);
  return v;
};
const mode = opt('mode') ?? 'mute';
const speakers = opt('speakers')?.split(',').map((x) => x.trim()) ?? DEFAULT_SETTINGS.speakers;
const conf = Number(opt('conf') ?? DEFAULT_SETTINGS.otherConfirmations);
const s = { ...DEFAULT_SETTINGS, mode, speakers, otherConfirmations: conf };
console.log(`mode=${mode} speakers=${speakers.join(', ')} confirmations=${conf}`);
const outDir = join(process.cwd(), 'frames-debug');
mkdirSync(outDir, { recursive: true });

const worker = await createWorker(s.langs.split('+'), OEM.LSTM_ONLY, {
  langPath: join(process.cwd(), 'dist', 'tessdata'),
  cacheMethod: 'none',
  gzip: true,
});
await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });

let state = initialState();
let now = 0;
/**
 * `--bin` input: the extension's own OCR image (output of captureCaption, already binarised and
 * padded), cut into three pieces of 584×240: `A.png+B.png` where A holds pieces 1–2 stacked and B
 * holds piece 3. Returns the re-joined black-and-white PNG.
 */
function loadBin(spec: string): Buffer {
  if (spec === 'blank') {
    // A frame whose crop had (almost) no caption-white pixels: the extension skips OCR for it.
    const empty = new PNG({ width: 584 * 3, height: 240 });
    empty.data.fill(255);
    return PNG.sync.write(empty);
  }
  const [a, b] = spec.split('+').map((f) => PNG.sync.read(readFileSync(f!)));
  const pw = 584, ph = 240;
  const out = new PNG({ width: pw * 3, height: ph });
  const pick = (img: PNG, x: number, y: number) => img.data[(y * img.width + x) * 4]! < 128;
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw * 3; x++) {
      const piece = Math.floor(x / pw);
      const px = x % pw;
      const black = piece < 2 ? pick(a!, px, y + piece * ph) : pick(b!, px, y);
      const i = (y * out.width + x) * 4;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = black ? 0 : 255;
      out.data[i + 3] = 255;
    }
  return PNG.sync.write(out);
}

const binMode = args[0] === '--bin';
if (binMode) args.shift();
type Frame = { w: number; h: number; px: Uint8Array; name: string; bin?: Buffer };
const frames: Frame[] = binMode
  ? args.map((spec, i) => ({ w: 0, h: 0, px: new Uint8Array(), name: `f${String(i + 1).padStart(2, '0')}`, bin: loadBin(spec) }))
  : args.flatMap((file) => load(file).map((f, i) => ({ ...f, name: `${basename(file, '.png')}#${i}` })));
for (const { w, h, px, name, bin } of frames) {
  let buf: Buffer;
  let inkShare: number;
  if (bin) {
    buf = bin;
    const png = PNG.sync.read(bin);
    let n = 0;
    for (let i = 0; i < png.data.length; i += 4) if (png.data[i] === 0) n++;
    inkShare = n / (png.width * png.height);
  } else {
    const scale = Math.min(3, Math.max(1, TARGET_HEIGHT / h));
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    const img = resize(px, w, h, dw, dh);
    const { mask, ink } = binarize(img, dw, dh, { whiteThreshold: s.whiteThreshold });

    const png = new PNG({ width: dw + PAD * 2, height: dh + PAD * 2 });
    png.data.fill(255);
    for (let y = 0; y < dh; y++)
      for (let x = 0; x < dw; x++)
        if (mask[y * dw + x]) {
          const i = ((y + PAD) * png.width + x + PAD) * 4;
          png.data[i] = png.data[i + 1] = png.data[i + 2] = 0;
        }
    buf = PNG.sync.write(png);
    inkShare = ink / (dw * dh);
  }
  writeFileSync(join(outDir, `${name.replace('#', '_')}.png`), buf);

  let lines: OcrLine[] = [];
  if (inkShare >= 0.002) {
    const { data } = await worker.recognize(buf, {}, { text: true, blocks: true });
    lines = (data.blocks ?? []).flatMap((b) =>
      b.paragraphs.flatMap((p) =>
        p.lines.map((l) => ({ text: l.text.trim(), confidence: l.confidence, ...l.bbox })),
      ),
    ).filter((l) => l.text);
  }
  const raw = classify(lines, s.speakers, s.minConfidence);
  const obs = mode === 'only' ? classifyHearOnly(lines, s.speakers, s.minConfidence) : raw;
  now += s.intervalMs;
  state = step(state, obs, now, s);
  console.log(`\n${name}`);
  for (const l of lines) console.log(`  ${Math.round(l.confidence).toString().padStart(3)}%  ${l.text}`);
  const label = (o: typeof obs) => `${o.kind}${o.kind !== 'none' ? ` (${o.line})` : ''}`;
  const shown = mode === 'only' ? ({ target: 'drugi', other: 'sa liste', none: 'ništa' } as const)[obs.kind] + (obs.kind !== 'none' ? ` (${obs.line})` : '') : label(obs);
  console.log(`  → ${shown}   ⇒ ${isMuted(state) ? 'UTIŠANO' : 'čuje se'}`);
}
await worker.terminate();
