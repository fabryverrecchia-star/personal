// Assemble le site construit (dist/) en un seul fichier HTML autonome, pour un aperçu local.
// Usage : npm run build && node scripts/build-preview.mjs  →  preview/il-ristorante-apercu.html
import { build } from 'esbuild';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'preview', 'il-ristorante-apercu.html');

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// Ressources en data URI, référencées une seule fois
const mime = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const assets = {};
for (const file of walk(dist)) {
  const rel = '/' + relative(dist, file);
  if (/^\/(img|brand|fonts)\//.test(rel) || rel === '/favicon.svg') {
    assets[rel] = `data:${mime[extname(file)]};base64,${readFileSync(file).toString('base64')}`;
  }
}

const pages = {};
const styles = new Set();
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  const rel = '/' + relative(dist, file).replace(/(index)?\.html$/, '').replace(/\/$/, '');
  const path = rel === '/' ? '/' : rel === '/404' ? '/404' : rel;
  pages[path] = {
    title: html.match(/<title>(.*?)<\/title>/s)[1],
    main: html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1],
  };
  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) styles.add(css);
  for (const [, href] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) styles.add(readFileSync(join(dist, href), 'utf8'));
}

const css = [...styles].join('\n').replace(/url\((['"]?)(\/fonts\/[^'")]+)\1\)/g, (_, _q, p) => `url(${assets[p]})`);

const js = (await build({
  entryPoints: [join(root, 'src/scripts/preview-router.ts')],
  bundle: true, minify: true, format: 'iife', target: 'es2020', write: false,
})).outputFiles[0].text;

const index = readFileSync(join(dist, 'index.html'), 'utf8');
const inline = (h) => h.replace(/\/(?:img|brand|fonts)\/[^"')\s]+|\/favicon\.svg/g, (m) => assets[m] ?? m);
let body = index.match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
body = inline(body).replace(/href="\/docs\/[^"]+"/g, 'href="#"');
for (const p of Object.values(pages)) p.main = p.main.replace(/href="\/docs\/[^"]+"/g, 'href="#"');

const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
mkdirSync(join(root, 'preview'), { recursive: true });
writeFileSync(out, `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Il Ristorante — aperçu</title>
<link rel="icon" href="${assets['/favicon.svg']}" />
<script>document.documentElement.classList.add('js');</script>
<style>${css}</style>
</head>
<body>
${body}
<script type="application/json" id="pages">${json(pages)}</script>
<script type="application/json" id="assets">${json(assets)}</script>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>
`);
console.log(`${relative(root, out)} — ${(statSync(out).size / 1024 / 1024).toFixed(1)} Mo, ${Object.keys(pages).length} pages`);
