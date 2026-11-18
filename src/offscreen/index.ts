/**
 * Offscreen document: hosts the Tesseract.js worker. Content scripts can't start extension
 * workers inside youtube.com, and service workers can't start workers at all, so OCR runs here.
 * Every Tesseract file is bundled with the extension; nothing is fetched from a CDN.
 */
import { createWorker, OEM, PSM, type Worker } from 'tesseract.js';
import type { OcrLine } from '../shared/match.ts';
import type { OcrResponse, OffscreenOcrRequest } from '../shared/messages.ts';

let worker: Promise<Worker> | null = null;
let workerLangs = '';

function getWorker(langs: string): Promise<Worker> {
  if (worker && workerLangs === langs) return worker;
  const old = worker;
  workerLangs = langs;
  const created = (async () => {
    if (old) await old.then((w) => w.terminate()).catch(() => {});
    const w = await createWorker(langs.split('+'), OEM.LSTM_ONLY, {
      workerPath: chrome.runtime.getURL('vendor/tesseract/worker.min.js'),
      corePath: chrome.runtime.getURL('vendor/tesseract-core/'),
      langPath: chrome.runtime.getURL('tessdata'),
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
    });
    // Automatic layout analysis separates the caption from leftover background specks better
    // than "single block" did on real broadcast frames.
    await w.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    return w;
  })();
  worker = created;
  // A failed start is retried on the next request.
  created.catch(() => {
    if (worker === created) worker = null;
  });
  return created;
}

async function recognize(image: string, langs: string): Promise<OcrResponse> {
  const started = performance.now();
  const w = await getWorker(langs);
  const { data } = await w.recognize(image, {}, { text: true, blocks: true });
  const lines: OcrLine[] = (data.blocks ?? []).flatMap((b) =>
    b.paragraphs.flatMap((p) =>
      p.lines.map((l) => ({
        text: l.text.trim(),
        confidence: l.confidence,
        x0: l.bbox.x0,
        y0: l.bbox.y0,
        x1: l.bbox.x1,
        y1: l.bbox.y1,
      })),
    ),
  );
  return { ok: true, lines: lines.filter((l) => l.text), ms: Math.round(performance.now() - started) };
}

// Firefox has no offscreen documents but its background page can start workers, so the
// Firefox build loads this file into the background page and calls recognize() directly.
(globalThis as { neleceniRecognize?: typeof recognize }).neleceniRecognize = recognize;

chrome.runtime.onMessage.addListener((msg: OffscreenOcrRequest, _sender, sendResponse) => {
  if (msg?.target !== 'offscreen' || msg.type !== 'offscreen-ocr') return false;
  recognize(msg.image, msg.langs).then(sendResponse, (err: unknown) =>
    sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) } satisfies OcrResponse),
  );
  return true;
});
