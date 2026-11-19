# Neleceni за Firefox · Neleceni for Firefox

[Српски](#српски) · [English](#english)

## Српски

Ова фасцикла садржи верзију проширења за Mozilla Firefox (верзија 128 или новија, на рачунару). Користи исти код као
верзија за Chrome (`src/`, `static/`); разликују се само `manifest.json` и позадинска скрипта `background.ts`. Firefox
нема „offscreen“ документе, па препознавање текста ради у позадинској страници проширења.

### Прављење

Потребан је [Node.js](https://nodejs.org/) 23.6 или новији. Из главне фасцикле пројекта:

```sh
npm install
npm run build:firefox
```

Готово проширење је у `firefox/dist/`. `npm run zip:firefox` прави `neleceni-firefox-<верзија>.zip` за слање на
[addons.mozilla.org](https://addons.mozilla.org/).

### Привремено учитавање

1. У Firefox-у отворите `about:debugging#/runtime/this-firefox`.
2. Кликните **Load Temporary Add-on…** и изаберите `firefox/dist/manifest.json`.
3. Отвориће се подешавања; све остало ради као у верзији за Chrome (видите [главни README](../README.md)).

Привремено учитано проширење нестаје кад затворите Firefox. За трајну инсталацију проширење мора бити потписано
преко addons.mozilla.org.

Пречица **Alt+Shift+M** се у Firefox-у мења у `about:addons` → иконица зупчаника → **Manage Extension Shortcuts**.

## English

This folder holds the Mozilla Firefox version of the extension (Firefox 128 or newer, desktop). It shares the code of
the Chrome version (`src/`, `static/`); only `manifest.json` and the background script `background.ts` differ.
Firefox has no offscreen documents, so text recognition runs in the extension's background page instead.

### Building

Requires [Node.js](https://nodejs.org/) 23.6 or newer. From the project root:

```sh
npm install
npm run build:firefox
```

The extension is built into `firefox/dist/`. `npm run zip:firefox` writes `neleceni-firefox-<version>.zip` for
upload to [addons.mozilla.org](https://addons.mozilla.org/). `npm run watch:firefox` rebuilds on changes.

### Loading it temporarily

1. In Firefox, open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `firefox/dist/manifest.json`.
3. The settings page opens; everything else works as in the Chrome version (see the [main README](../README.md)).

Alternatively, `npx web-ext run -s firefox/dist` starts a fresh Firefox profile with the add-on loaded.

A temporary add-on is removed when Firefox closes. A permanent install needs the add-on signed through
addons.mozilla.org.

The **Alt+Shift+M** shortcut is changed in `about:addons` → gear icon → **Manage Extension Shortcuts**.

### Notes for AMO review

- `web-ext lint` reports no errors. Its warnings are `innerHTML` set from the extension's own translation table
  (`src/shared/i18n-dom.ts`, static strings only) and the `Function` constructor inside Tesseract.js
  (`vendor/tesseract/worker.min.js`, unmodified from the `tesseract.js` npm package, and its bundled copy in
  `background.js`).
- The bundled JavaScript is not minified; the source is this repository, built with `npm run build:firefox`.
