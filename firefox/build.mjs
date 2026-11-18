// Builds the Firefox extension into firefox/dist/. Reuses the Chrome sources in src/ and static/;
// only the manifest and the background script differ (Firefox has no offscreen documents, so
// OCR runs in the background event page). Tesseract's worker, WASM core and Serbian language
// data are bundled so nothing is loaded from a CDN at runtime.
import * as esbuild from 'esbuild';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(here, 'dist');
const nm = join(root, 'node_modules');
const watch = process.argv.includes('--watch');

// Chrome-only files that the Firefox build replaces or doesn't need.
const SKIP_STATIC = new Set(['manifest.json', 'offscreen.html']);

async function copyStatic() {
  await cp(join(root, 'static'), dist, { recursive: true, filter: (src) => !SKIP_STATIC.has(basename(src)) });
  await cp(join(here, 'manifest.json'), join(dist, 'manifest.json'));
}

async function copyLicenses() {
  const dir = join(dist, 'licenses');
  await mkdir(dir, { recursive: true });
  await Promise.all([
    cp(join(root, 'LICENSE'), join(dist, 'LICENSE')),
    cp(join(root, 'THIRD_PARTY_NOTICES.md'), join(dist, 'THIRD_PARTY_NOTICES.md')),
    cp(join(nm, 'tesseract.js', 'LICENSE.md'), join(dir, 'tesseract.js-Apache-2.0.md')),
    cp(join(nm, 'tesseract.js-core', 'LICENSE'), join(dir, 'tesseract.js-core-Apache-2.0.txt')),
  ]);
}

async function copyVendor() {
  const tess = join(dist, 'vendor', 'tesseract');
  const core = join(dist, 'vendor', 'tesseract-core');
  const data = join(dist, 'tessdata');
  await Promise.all([mkdir(tess, { recursive: true }), mkdir(core, { recursive: true }), mkdir(data, { recursive: true })]);

  await cp(join(nm, 'tesseract.js', 'dist', 'worker.min.js'), join(tess, 'worker.min.js'));
  await cp(join(nm, 'tesseract.js', 'dist', 'worker.min.js.LICENSE.txt'), join(tess, 'worker.min.js.LICENSE.txt'));

  const coreDir = join(nm, 'tesseract.js-core');
  for (const f of await readdir(coreDir)) {
    if (/^tesseract-core(-simd|-relaxedsimd)?-lstm\.wasm\.js$/.test(f)) await cp(join(coreDir, f), join(core, f));
  }

  for (const lang of ['srp', 'srp_latn']) {
    const file = `${lang}.traineddata.gz`;
    await cp(join(nm, '@tesseract.js-data', lang, '4.0.0_best_int', file), join(data, file));
  }
}

const options = {
  absWorkingDir: root,
  entryPoints: {
    content: 'src/content/index.ts',
    background: 'firefox/background.ts',
    options: 'src/options/index.ts',
    popup: 'src/popup/index.ts',
  },
  outdir: dist,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'firefox128',
  // Readable output makes add-on review easier.
  minify: false,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all([copyStatic(), copyVendor(), copyLicenses()]);

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{ name: 'static', setup: (b) => b.onEnd(() => copyStatic()) }],
  });
  await ctx.watch();
  console.log('Watching… reload the add-on in about:debugging after changes.');
} else {
  await esbuild.build(options);
}
