import { resolveLang, t, type Lang, type LangSetting } from '../shared/i18n.ts';
import { applyTranslations } from '../shared/i18n-dom.ts';
import { DEFAULT_SETTINGS, loadSettings, sanitize, saveSettings, type Settings } from '../shared/settings.ts';

const form = document.getElementById('form') as HTMLFormElement;
const saved = document.getElementById('saved') as HTMLSpanElement;

const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
const checkbox = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const num = (name: string) => Number(input(name).value);

let lang: Lang = resolveLang(DEFAULT_SETTINGS.language);

function translate(setting: LangSetting): void {
  lang = resolveLang(setting);
  applyTranslations(document, lang);
}

function fill(s: Settings): void {
  input('language').value = s.language;
  checkbox('enabled').checked = s.enabled;
  checkbox('showBadge').checked = s.showBadge;
  checkbox('debug').checked = s.debug;
  input('speakers').value = s.speakers.join('\n');
  input('groups').value = s.groups.join('\n');
  input('channels').value = s.channels.join('\n');
  input('region.x').value = String(s.region.x);
  input('region.y').value = String(s.region.y);
  input('region.w').value = String(s.region.w);
  input('region.h').value = String(s.region.h);
  input('intervalMs').value = String(s.intervalMs);
  input('whiteThreshold').value = String(s.whiteThreshold);
  input('langs').value = s.langs;
  input('otherConfirmations').value = String(s.otherConfirmations);
  input('minConfidence').value = String(s.minConfidence);
  input('releaseAfterGoneSec').value = String(s.releaseAfterGoneSec);
  translate(s.language);
}

function read(): Settings {
  return sanitize({
    language: input('language').value as LangSetting,
    enabled: checkbox('enabled').checked,
    showBadge: checkbox('showBadge').checked,
    debug: checkbox('debug').checked,
    speakers: lines(input('speakers').value),
    groups: lines(input('groups').value),
    channels: lines(input('channels').value),
    region: { x: num('region.x'), y: num('region.y'), w: num('region.w'), h: num('region.h') },
    intervalMs: num('intervalMs'),
    whiteThreshold: num('whiteThreshold'),
    langs: input('langs').value,
    otherConfirmations: num('otherConfirmations'),
    minConfidence: num('minConfidence'),
    releaseAfterGoneSec: num('releaseAfterGoneSec'),
  } satisfies Settings);
}

let flashTimer: ReturnType<typeof setTimeout> | undefined;
function flash(text: string): void {
  saved.textContent = text;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => (saved.textContent = ''), 2500);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const s = read();
  await saveSettings(s);
  fill(s); // show the clamped values
  flash(t(lang, 'optSaved'));
});

// Show the page in the chosen language right away; it is stored with Save like everything else.
input('language').addEventListener('change', () => translate(input('language').value as LangSetting));

document.getElementById('reset')!.addEventListener('click', async () => {
  await saveSettings(DEFAULT_SETTINGS);
  fill(DEFAULT_SETTINGS);
  flash(t(lang, 'optDefaultsRestored'));
});

// The link is re-created whenever the page is translated, so listen on the document.
document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element) || !e.target.closest('[data-action="shortcuts"]')) return;
  e.preventDefault();
  void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

translate(DEFAULT_SETTINGS.language);
loadSettings().then(fill, () => fill(DEFAULT_SETTINGS));
