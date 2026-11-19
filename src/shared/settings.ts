import { LANG_SETTINGS, type LangSetting } from './i18n.ts';

/** Caption region, in percent of the video frame (0–100). */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Settings {
  /** Master switch. */
  enabled: boolean;
  /** Channel handles (`@Name`) or channel IDs (`UC…`) to work on. Empty list = every video. */
  channels: string[];
  /** Speaker names that trigger the mute. Cyrillic or Latin; matching ignores script and diacritics. */
  speakers: string[];
  /**
   * Parliamentary groups whose every member triggers the mute, as written on the caption's second
   * line ("Александар Вучић - Србија побеђује"). Matching ignores script and diacritics.
   */
  groups: string[];
  /** Where the name caption sits in the frame. */
  region: Region;
  /** A pixel counts as caption text when all of R, G and B are at least this bright (0–255). */
  whiteThreshold: number;
  /** How often a frame is checked, in milliseconds. */
  intervalMs: number;
  /** Minimum OCR confidence (0–100) for a line to count as another speaker's name. */
  minConfidence: number;
  /** Consecutive readings of another name needed before un-muting. */
  otherConfirmations: number;
  /** Also un-mute when no caption has been seen for this many seconds. 0 = never. */
  releaseAfterGoneSec: number;
  /** Tesseract languages, joined with `+`. */
  langs: string;
  /** Show the status pill on the video. */
  showBadge: boolean;
  /** Show the processed caption crop and OCR text under the pill. */
  debug: boolean;
  /** Interface language: follow Chrome, or Serbian Cyrillic / English. */
  language: LangSetting;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  channels: ['@ParlamentSrbija', 'UCghngrfQwzJ4aaPZ-UgNIZQ'],
  speakers: ['Александар Вучић'],
  groups: ['Александар Вучић - Србија побеђује'],
  // Measured on the 17 Nov 2026 broadcast. The caption (name, then parliamentary group) comes
  // in two sizes: small in the lower-left corner (lines at 90–99 % of the height, 2–48 % of the
  // width) and large (lines at 82–94 %, 8–87 %). This region covers both.
  region: { x: 0, y: 80, w: 90, h: 20 },
  whiteThreshold: 225,
  intervalMs: 1500,
  // Real name lines over the busy parliament background read at 27–57 %; pure noise at ~0 %.
  minConfidence: 35,
  otherConfirmations: 3,
  releaseAfterGoneSec: 0,
  langs: 'srp',
  showBadge: true,
  debug: false,
  language: 'auto',
};

export const LANG_CHOICES = ['srp', 'srp+srp_latn', 'srp_latn'] as const;

const clamp = (n: unknown, lo: number, hi: number, fallback: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.min(hi, Math.max(lo, v));
};

/** Earlier default regions; settings saved with one of them get the current default instead. */
const OLD_DEFAULT_REGIONS: Region[] = [{ x: 0, y: 88, w: 70, h: 12 }];

const isOldDefault = (r: Partial<Record<keyof Region, unknown>>): boolean =>
  OLD_DEFAULT_REGIONS.some((o) => o.x === r.x && o.y === r.y && o.w === r.w && o.h === r.h);

const stringList = (v: unknown, fallback: string[]): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.trim() !== '').map((s) => s.trim()) : fallback;

/** Fill in defaults and clamp every value to a sane range. Accepts anything read from storage. */
export function sanitize(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  let reg = (r.region && typeof r.region === 'object' ? r.region : {}) as Partial<Record<keyof Region, unknown>>;
  if (isOldDefault(reg)) reg = {};
  const x = clamp(reg.x, 0, 99, d.region.x);
  const y = clamp(reg.y, 0, 99, d.region.y);
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled,
    channels: stringList(r.channels, d.channels),
    speakers: stringList(r.speakers, d.speakers),
    groups: stringList(r.groups, d.groups),
    region: {
      x,
      y,
      w: clamp(reg.w, 1, 100 - x, d.region.w),
      h: clamp(reg.h, 1, 100 - y, d.region.h),
    },
    whiteThreshold: Math.round(clamp(r.whiteThreshold, 100, 255, d.whiteThreshold)),
    intervalMs: Math.round(clamp(r.intervalMs, 500, 10000, d.intervalMs)),
    minConfidence: Math.round(clamp(r.minConfidence, 0, 100, d.minConfidence)),
    otherConfirmations: Math.round(clamp(r.otherConfirmations, 1, 10, d.otherConfirmations)),
    releaseAfterGoneSec: Math.round(clamp(r.releaseAfterGoneSec, 0, 3600, d.releaseAfterGoneSec)),
    langs: (LANG_CHOICES as readonly string[]).includes(r.langs as string) ? (r.langs as string) : d.langs,
    showBadge: typeof r.showBadge === 'boolean' ? r.showBadge : d.showBadge,
    debug: typeof r.debug === 'boolean' ? r.debug : d.debug,
    language: (LANG_SETTINGS as readonly unknown[]).includes(r.language) ? (r.language as LangSetting) : d.language,
  };
}

const KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const got = await chrome.storage.sync.get(KEY);
  return sanitize(got[KEY]);
}

export async function saveSettings(s: Settings): Promise<void> {
  await chrome.storage.sync.set({ [KEY]: sanitize(s) });
}

/** Calls `cb` with fresh settings whenever they change in storage. */
export function onSettingsChanged(cb: (s: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && KEY in changes) cb(sanitize(changes[KEY]?.newValue));
  });
}
