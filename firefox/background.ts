/**
 * Firefox background (event page). Firefox has no offscreen documents, but unlike Chrome's
 * service worker its background page can start web workers, so the Tesseract.js worker runs
 * right here. Otherwise this does what src/background/index.ts does in Chrome: keeps the
 * toolbar badge up to date and forwards the keyboard shortcut to the active tab.
 * Every Tesseract file is bundled with the extension; nothing is fetched from a CDN.
 */
import { createWorker, OEM, PSM, type Worker } from 'tesseract.js';
import type { OcrLine } from '../src/shared/match.ts';
import type { OcrResponse, ToBackground, ToggleMessage } from '../src/shared/messages.ts';

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

function setBadge(tabId: number, active: boolean, muted: boolean, text: string): void {
  void chrome.action.setBadgeText({ tabId, text: active ? text : '' });
  if (active) void chrome.action.setBadgeBackgroundColor({ tabId, color: muted ? '#b02020' : '#2f7d4a' });
}

chrome.runtime.onMessage.addListener((msg: ToBackground, sender, sendResponse) => {
  switch (msg?.type) {
    case 'ocr':
      recognize(msg.image, msg.langs).then(sendResponse, (err: unknown) =>
        sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) } satisfies OcrResponse),
      );
      return true; // async response
    case 'status':
      if (sender.tab?.id !== undefined) setBadge(sender.tab.id, msg.active, msg.muted, msg.badge);
      return false;
  }
  return false;
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-mute') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return;
  const msg: ToggleMessage = { type: 'toggle' };
  chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') void chrome.runtime.openOptionsPage();
});
