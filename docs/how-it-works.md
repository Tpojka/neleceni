# How Neleceni works

Technical notes for developers. For installation and everyday use, see the [README](../README.md).

## Pipeline

```
YouTube tab (content script)            Service worker               Offscreen document
─────────────────────────────           ──────────────               ──────────────────
every 1.5 s:
  crop caption area of the frame
  keep only white caption pixels ──────▶ relays OCR request ────────▶ Tesseract.js (WASM)
                                                                       Serbian Cyrillic model
  pick the name line, match names ◀──────────────────────────────────  text lines + positions
  mute / un-mute via Web Audio gain
```

1. **Capture.** The content script draws the caption region of the current video frame onto a canvas.
   YouTube plays through MediaSource (`blob:` URLs), so the canvas is not tainted and pixels can be read.
2. **Clean up** (`src/shared/binarize.ts`, `src/shared/glyphs.ts`).
   - Only bright, grey pixels (the white caption letters) are kept, as black text on white.
   - Every white shape that is too big to be a letter, or is cut off by the top or bottom edge of the crop, is
     removed: desks, papers and shirts behind the caption. The letters have a dark outline, so each one stays a
     separate small shape.
   - While the large caption animates, each letter also has a thin white ring a few pixels around it. At 720p the
     ring blurs away; at 1080p it stays and turns OCR into garbage. When most text runs in the crop are 1–3 px thin,
     a morphological opening (shrink, then grow by 1 px) removes the rings and keeps the 5–7 px letter strokes.
3. **OCR.** [Tesseract.js](https://github.com/naptha/tesseract.js) runs in an offscreen document with the Serbian
   model. Content scripts cannot start extension workers inside youtube.com and service workers cannot start
   workers at all, hence the offscreen document. All OCR files ship inside the extension; nothing is downloaded
   at runtime (Manifest V3 forbids remote code).
4. **Name line only** (`pickSpeakerLine` in `src/shared/match.ts`). The caption has two lines: the speaker's name,
   then the parliamentary group. The group line for SNS deputies is *"Александар Вучић - Србија побеђује"*, so
   matching the whole caption would mute every member of that group. The caption comes in two sizes at different
   heights, so the name line is found by structure: it is the line right above the group line.
   - A group line is recognised by its spaced dash, or by having 4+ words (OCR sometimes loses the dash), or as a
     3-word line with another line right above it.
   - Lines under 10 % OCR confidence are dropped first; pieces of one line that OCR split apart are joined.
   - Without a group line, the top line is used.
   - A line with a listed name followed by more words ("Александар Вучић Србија") counts as a group line.
5. **Matching** (`lineMatchesName`). Names are compared after Cyrillic→Latin transliteration, ignoring case and
   diacritics, with a few OCR mistakes allowed. One word of the name must be read whole; the others may be read as
   a clear piece ("А екса · р Вучић") or, for long words, with up to 40 % of the letters wrong ("АпењСандар Вучић").
   A line counts as *another speaker* only if it is confident, has at least two capitalised words and does not
   contain a listed surname, so a garbled reading of the target can never end the mute.
   - **Groups** (`lineMatchesGroup`). A listed parliamentary group ("Александар Вучић - Србија побеђује") is
     looked for on every caption line. When it is found, the stream is muted whatever name is above it, so one
     entry covers every deputy of that group. A group matches when every word matches as for a name, or when the
     whole line is within 30 % edits of it (group lines are long, and OCR often mangles one word). Another
     group's caption counts as another speaker, as before.
6. **Mute** (`src/content/audio.ts`). The video's audio is routed through a Web Audio gain node the first time a
   mute is needed, and the gain is ramped to 0 or 1. YouTube's own volume and mute button are left alone. If the
   element was already connected to Web Audio by another extension, `video.muted` is used instead.

### Mute state machine (`src/shared/state.ts`)

- Mute on the first reading of a listed name.
- Un-mute after another speaker's name has been read 3 times (fresh OCR readings while muted).
- A caption that disappears does not end the mute, because the speech usually goes on.
- Manual toggle (pill click or Alt+Shift+M) holds until a clearly different caption has been read 3 times.
- Seeking in a replay or switching videos resets the state; the caption at the new position decides.

## Caption layouts on @ParlamentSrbija

Measured on the 17 Nov 2026 session, in percent of the video frame:

| Caption | Name line | Group line | Width |
|---|---|---|---|
| Small (lower-left) | 90–95 % | 95.6–99 % | 2–48 % |
| Large | 82–88 % | 89–94 % | 8–87 % |

The default region (left 0 %, top 80 %, width 90 %, height 20 %) covers both.

## Tested on

The replay of the 17 Nov 2026 session (`https://www.youtube.com/watch?v=qkmMyGsHo9o`), live in Chrome and Brave.
The channel made that replay private on the evening of 17 Nov 2026 and started re-publishing the session in parts
("… 17.11.2026. (I)"), so the times below refer to the original 7 h 54 min recording.

| Replay time | Caption (line 1 / line 2) | Result |
|---|---|---|
| 4:01:12 | Large: Александар Вучић / Александар Вучић - Србија побеђује | Muted within a second of the caption, at 720p and 1080p; stays muted through cutaways without a caption |
| 7:22:40 | Small: Миленко Јованов / Александар Вучић - Србија побеђује | Listening: the group line is ignored |
| 7:23:09 | Small: Александар Вучић / Александар Вучић - Србија побеђује | Muted within a second of the caption (Web Audio gain 1 → 0) |
| 7:23:09, target swapped to Јованов | the same change, in reverse | Un-muted about 5 s after the new caption |
| jump back to 7:22:45 | Миленко Јованов | Listening again, gain back to 1 |

An offline check of 29 real frames from this replay (17 at 1080p, 12 at 720p) reads 27 correctly; the other two
are frames where the first name is unreadable, which count as "nothing read" and change nothing.

OCR takes 20–220 ms per frame in the offscreen document (more at 1080p).

Press conferences on the same channel (e.g. `watch?v=Mbh3HdskteQ`, 17 Nov 2026) show no speaker caption at all,
so nothing is muted there; that is expected.

## Development

Written in **TypeScript**, bundled with **esbuild**, no UI framework.

- TypeScript fits because the extension is mostly messages passed between four contexts (YouTube page, service
  worker, offscreen document, popup/options). Typed message shapes and `@types/chrome` catch mistakes at build time.
- esbuild compiles in milliseconds. The output is left unminified, so Chrome Web Store review stays easy.
- Plain DOM code in the content script avoids YouTube's Trusted Types restrictions and keeps the bundle small.

Requires Node.js 23.6 or newer (the tests run TypeScript directly).

```sh
npm install
npm run build       # bundle into dist/
npm run watch       # rebuild on every save
npm run typecheck   # tsc --noEmit
npm test            # node --test
npm run check       # typecheck + test + build
npm run zip         # build and pack dist/ into neleceni-<version>.zip (release asset)
```

After a rebuild, click the reload icon on the extension's card in `chrome://extensions` and reload YouTube tabs.

The interface is in English and Serbian Cyrillic (`src/shared/i18n.ts`, chosen in the settings; `_locales/` only
covers the name, description and shortcut text that Chrome itself shows).

```
src/
  content/      YouTube page: frame capture, audio gate, channel check, status pill, main loop
  background/   service worker: offscreen document, OCR relay, badge, keyboard shortcut
  offscreen/    Tesseract.js worker host
  options/      settings page
  popup/        toolbar popup
  shared/       settings, messages, binarisation, name matching, mute state machine (pure, unit-tested)
static/         manifest, HTML, CSS, icons
scripts/        build script, icon generator
test/           unit tests
docs/           this document
```
