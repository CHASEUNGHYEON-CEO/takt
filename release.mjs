// Cache-busting for static hosting (GitHub Pages caches files ~10 minutes).
// Run before every deploy:  node release.mjs
// Rewrites every local asset reference to `file.js?v=<stamp>` so HTML, modules and the worker always match.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMM
const files = ['app.html', 'index.html', ...['app', 'pool', 'template', 'validate', 'worker', 'cases', 'charts', 'engine', 'share'].map(f => `assets/js/${f}.js`)];
const pattern = /((?:\.\/|assets\/(?:js|css)\/)[\w-]+\.(?:js|css))(\?v=[\w.-]+)?(?=['"])/g;

let total = 0;
for (const f of files) {
  const p = join(root, f), src = readFileSync(p, 'utf8');
  let n = 0;
  const out = src.replace(pattern, (_, path) => { n++; return `${path}?v=${stamp}`; });
  if (n) { writeFileSync(p, out); total += n; console.log(`${f}: ${n}`); }
}
console.log(`stamped ${total} references with v=${stamp}`);
