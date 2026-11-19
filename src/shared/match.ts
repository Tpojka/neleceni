/**
 * Pure text logic: Serbian transliteration, fuzzy name matching and picking the
 * speaker-name line out of OCR output. No browser APIs here, so it runs under `node --test`.
 */

const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i',
  ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's',
};

/**
 * Lower-case, transliterate Serbian Cyrillic to Latin, drop diacritics and
 * turn everything that is not a letter into a single space.
 * "Александар Вучић" and "Aleksandar Vučić" both become "aleksandar vucic".
 */
export function normalize(text: string): string {
  let out = '';
  for (const ch of text.toLowerCase()) out += CYR_TO_LAT[ch] ?? ch;
  return out
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

/** Plain Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[b.length]!;
}

/**
 * Smallest edit distance between `needle` and any substring of `hay`
 * (Sellers' algorithm). Catches names that OCR glued to a neighbour, e.g. "aleksandarvucic".
 */
export function substringDistance(hay: string, needle: string): number {
  if (!needle.length) return 0;
  let prev = new Array<number>(hay.length + 1).fill(0);
  for (let i = 1; i <= needle.length; i++) {
    const cur = [i];
    for (let j = 1; j <= hay.length; j++) {
      const cost = needle[i - 1] === hay[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return Math.min(...prev);
}

/** How many OCR mistakes a name token of this length may have. */
export function allowedErrors(tokenLength: number): number {
  if (tokenLength >= 8) return 2;
  if (tokenLength >= 4) return 1;
  return 0;
}

/**
 * True when `line` shows `name`.
 *
 * Every word of the name must be found in the line, fuzzily. At least one word must be found
 * whole; the others may also be found as a recognisable piece, because letters over a bright
 * background get lost: the replay read "Александар Вучић" as "А екса · р Вучић", where "екса"
 * is a piece of "Александар". A piece must be at least 3 letters and 40 % of the word; pieces of
 * 6+ letters may have two OCR mistakes ("ексанћр" in a wide shot). A long word (6+ letters) may
 * also be found with up to 40 % of its letters wrong ("АпењСандар", "аксанћр"), but only next to
 * another word found whole, so "Александар Вулин" still does not match "Александар Вучић".
 */
export function lineMatchesName(line: string, name: string): boolean {
  const tokens = normalize(name).split(' ').filter(Boolean);
  if (!tokens.length) return false;
  const words = normalize(line).split(' ').filter(Boolean);
  const compact = words.join('');
  if (!compact.length) return false;

  const whole = (t: string) => substringDistance(compact, t) <= allowedErrors(t.length);
  const piece = (t: string) =>
    words.some(
      (w) => w.length >= Math.max(3, Math.ceil(t.length * 0.4)) && w.length < t.length &&
        substringDistance(t, w) <= (w.length >= 6 ? 2 : allowedErrors(w.length)),
    );

  const loose = (t: string) => t.length >= 6 && substringDistance(compact, t) <= Math.floor(t.length * 0.4);

  const found = tokens.map(whole);
  return found.some(Boolean) && tokens.every((t, i) => found[i] || piece(t) || loose(t));
}

export interface OcrLine {
  text: string;
  /** 0–100 as reported by Tesseract. */
  confidence: number;
  /** Bounding box of the line, in pixels of the OCR image. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Join pieces of the same text row. Tesseract's layout analysis sometimes splits one caption
 * line into several blocks, e.g. ",ександар Ву" and ". у Србија побеђује". Pieces without letters
 * ("—", "„") are dropped first: a tall dash can touch two rows and would glue them together.
 * The rest are one row when their vertical centres are within 40 % of a line height.
 */
export function mergeRows(lines: OcrLine[]): OcrLine[] {
  const rows: OcrLine[][] = [];
  const centre = (l: OcrLine) => (l.y0 + l.y1) / 2;
  const sameRow = (a: OcrLine, b: OcrLine) =>
    Math.abs(centre(a) - centre(b)) <= 0.4 * Math.min(a.y1 - a.y0, b.y1 - b.y0);
  const withLetters = lines.filter((l) => /\p{L}/u.test(l.text));
  for (const l of withLetters.sort((a, b) => centre(a) - centre(b))) {
    const row = rows.find((r) => sameRow(r[0]!, l));
    if (row) row.push(l);
    else rows.push([l]);
  }
  return rows.map((r) => {
    if (r.length === 1) return r[0]!;
    r.sort((a, b) => a.x0 - b.x0);
    const weight = (l: OcrLine) => Math.max(1, l.text.length);
    const total = r.reduce((n, l) => n + weight(l), 0);
    return {
      text: r.map((l) => l.text).join(' '),
      confidence: r.reduce((n, l) => n + l.confidence * weight(l), 0) / total,
      x0: Math.min(...r.map((l) => l.x0)),
      y0: Math.min(...r.map((l) => l.y0)),
      x1: Math.max(...r.map((l) => l.x1)),
      y1: Math.max(...r.map((l) => l.y1)),
    };
  });
}

/** Lines read with less confidence than this are OCR noise and never taken for the name line. */
const JUNK_CONFIDENCE = 10;

/** Parliamentary group lines read like "Александар Вучић - Србија побеђује": a dash with spaces around it. */
const GROUP_DASH = /\s[-–—]\s/;

const trimNoise = (s: string): string => s.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');

/** Readable version of an OCR line for display: words of 2+ letters, edge punctuation removed. */
export function cleanLine(text: string): string {
  return text
    .split(/\s+/)
    .map(trimNoise)
    .filter((w) => (w.match(/\p{L}/gu)?.length ?? 0) >= 2)
    .join(' ');
}

/** Words of at least 3 letters, which is what a real name is made of. */
export const nameWords = (text: string): string[] => normalize(text).split(' ').filter((w) => w.length >= 3);

/** Words of at least 3 letters that start with a capital, as names in the caption do. */
export const capitalisedWords = (text: string): string[] =>
  text.split(/[^\p{L}]+/u).filter((w) => w.length >= 3 && /^\p{Lu}/u.test(w));

/**
 * The parliamentary group line: it has a spaced dash ("Александар Вучић - Србија побеђује"),
 * or, when OCR lost the dash, more words than a name has ("Александар Вучић Србија побеђује").
 */
export function isGroupLine(text: string): boolean {
  return GROUP_DASH.test(text) || nameWords(text).length >= 4;
}

/**
 * OCR lines with junk dropped, split pieces joined and edge punctuation trimmed, top to bottom.
 * Junk goes first, so it can neither be taken for a caption line nor be merged into one.
 */
function readableRows(lines: OcrLine[]): OcrLine[] {
  return mergeRows(lines.filter((l) => l.confidence >= JUNK_CONFIDENCE))
    .map((l) => ({ ...l, text: trimNoise(l.text.trim()) }))
    .filter((l) => nameWords(l.text).length >= 1)
    .sort((a, b) => a.y0 - b.y0);
}

/**
 * True when `line` shows the parliamentary group `group` ("Александар Вучић - Србија побеђује").
 * Either every word matches as for a name, or the whole line, letters only, is within 30 % edits of
 * the group: a group line is long, and OCR often mangles one of its words beyond the per-word
 * rules ("ФЏДдександар Ву Србија побеђује"). A name line alone is far too short to pass.
 */
export function lineMatchesGroup(line: string, group: string): boolean {
  const target = normalize(group).replace(/ /g, '');
  if (target.length < 4) return false;
  if (lineMatchesName(line, group)) return true;
  const compact = normalize(line).replace(/ /g, '');
  return substringDistance(compact, target) <= Math.floor(target.length * 0.3);
}

/**
 * Pick the line that holds the speaker's name.
 *
 * The parliament caption has two lines: the name, then the parliamentary group. The group is
 * often named after a party leader, so the group line must never decide anything. The caption
 * comes in two sizes at different heights, so the name line is found by structure rather than
 * position: it is the line right above the group line. If no line has the group dash or 4+ words,
 * a 3-word line with another line right above it is taken as the group line (OCR lost the dash).
 * Without any group line (a speaker with no group), the top readable line is used.
 */
export function pickSpeakerLine(lines: OcrLine[]): OcrLine | null {
  const sorted = readableRows(lines);

  const above = (i: number) => {
    const l = sorted[i]!;
    const prev = sorted[i - 1];
    return !!prev && l.y0 - prev.y1 <= l.y1 - l.y0;
  };
  let g = sorted.findIndex((l) => isGroupLine(l.text));
  if (g === -1) g = sorted.findIndex((l, i) => nameWords(l.text).length >= 3 && above(i));
  // No group line: the top line.
  if (g === -1) return sorted[0] ?? null;

  const group = sorted[g]!;
  const lineHeight = group.y1 - group.y0;
  // Closest line above the group line, no more than one line height away.
  for (let i = g - 1; i >= 0; i--) {
    const l = sorted[i]!;
    if (isGroupLine(l.text)) continue;
    return group.y0 - l.y1 <= lineHeight ? l : null;
  }
  return null;
}

/**
 * True when real words follow the name, as in a group line whose dash OCR lost
 * ("Александар Вучић Србија"). A name line has at most short noise after the surname.
 */
export function hasWordsAfterName(line: string, name: string): boolean {
  const words = normalize(line).split(' ').filter(Boolean);
  const last = normalize(name).split(' ').filter(Boolean).at(-1);
  if (!last) return false;
  let end = -1;
  words.forEach((w, i) => {
    if (substringDistance(w, last) <= allowedErrors(last.length)) end = i;
  });
  return end >= 0 && words.slice(end + 1).some((w) => w.length >= 4);
}

/** True when the last word of `name` (the surname) is read whole somewhere in `line`. */
export function mentionsSurname(line: string, name: string): boolean {
  const last = normalize(name).split(' ').filter(Boolean).at(-1);
  const compact = normalize(line).replace(/ /g, '');
  return !!last && last.length >= 4 && substringDistance(compact, last) <= allowedErrors(last.length);
}

export type Observation =
  | { kind: 'none' }
  | { kind: 'target'; name: string; line: string }
  | { kind: 'other'; line: string };

/** Turn OCR output into one observation for the mute state machine. */
export function classify(
  lines: OcrLine[],
  speakers: string[],
  minConfidence: number,
  groups: string[] = [],
): Observation {
  const line = pickSpeakerLine(lines);
  // A listed parliamentary group mutes every member, whatever name the line above it shows.
  if (groups.length) {
    const rows = readableRows(lines);
    const group = groups.find((g) => rows.some((r) => lineMatchesGroup(r.text, g)));
    if (group) {
      const name = line && !lineMatchesGroup(line.text, group) ? cleanLine(line.text) : '';
      return { kind: 'target', name: group, line: name || group };
    }
  }
  if (!line) return { kind: 'none' };
  const hit = speakers.find((name) => lineMatchesName(line.text, name));
  if (hit) {
    // A listed name followed by more words is a group line ("Александар Вучић Србија"): it
    // tells us nothing about who is speaking.
    if (hasWordsAfterName(line.text, hit)) return { kind: 'none' };
    // Report the configured spelling, not the (often garbled) OCR text.
    return { kind: 'target', name: hit, line: hit };
  }
  // A garbled reading of a listed name ("Хиоса ћр ву Вучић") must not count as someone else,
  // or it could end the mute while that person is still speaking.
  if (speakers.some((name) => mentionsSurname(line.text, name))) return { kind: 'none' };
  // Another speaker needs a confident, name-shaped line: at least two capitalised words.
  // This keeps background noise from counting towards an un-mute.
  if (line.confidence >= minConfidence && capitalisedWords(line.text).length >= 2) {
    return { kind: 'other', line: cleanLine(line.text) };
  }
  return { kind: 'none' };
}

/**
 * True when two OCR readings are probably the same caption. OCR noise changes a letter or two
 * between frames, while a new speaker's name differs in most letters.
 */
export function similarLines(a: string, b: string): boolean {
  const ca = normalize(a).replace(/ /g, '');
  const cb = normalize(b).replace(/ /g, '');
  const longest = Math.max(ca.length, cb.length);
  if (longest === 0) return true;
  return levenshtein(ca, cb) <= Math.floor(longest * 0.35);
}
