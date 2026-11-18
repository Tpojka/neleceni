/**
 * Service worker: owns the offscreen document that runs OCR, relays OCR requests to it,
 * keeps the toolbar badge up to date and forwards the keyboard shortcut to the active tab.
 */
import type { OcrResponse, OffscreenOcrRequest, ToBackground, ToggleMessage } from '../shared/messages.ts';

const OFFSCREEN_URL = 'offscreen.html';
let creating: Promise<void> | null = null;

async function ensureOffscreen(): Promise<void> {
  const url = chrome.runtime.getURL(OFFSCREEN_URL);
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [url],
  });
  if (existing.length) return;
  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: 'Runs the Tesseract OCR web worker that reads the speaker name caption.',
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

async function runOcr(image: string, langs: string): Promise<OcrResponse> {
  const local = (globalThis as { neleceniRecognize?: (image: string, langs: string) => Promise<OcrResponse> })
    .neleceniRecognize;
  if (local) return local(image, langs); // Firefox: OCR runs in this background page
  await ensureOffscreen();
  const req: OffscreenOcrRequest = { target: 'offscreen', type: 'offscreen-ocr', image, langs };
  const res = (await chrome.runtime.sendMessage(req)) as OcrResponse | undefined;
  return res ?? { ok: false, error: 'OCR document did not answer' };
}

function setBadge(tabId: number, active: boolean, muted: boolean, text: string): void {
  void chrome.action.setBadgeText({ tabId, text: active ? text : '' });
  if (active) void chrome.action.setBadgeBackgroundColor({ tabId, color: muted ? '#b02020' : '#2f7d4a' });
}

chrome.runtime.onMessage.addListener((msg: ToBackground | OffscreenOcrRequest, sender, sendResponse) => {
  if ('target' in msg) return false; // meant for the offscreen document
  switch (msg.type) {
    case 'ocr':
      runOcr(msg.image, msg.langs).then(sendResponse, (err: unknown) =>
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
