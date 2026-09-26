// Aperçu autonome (polices et scripts intégrés, liens relatifs à plat) pour un artefact claude.ai.
// Usage : npx astro build --base / --outDir .preview-dist && node scripts/build-preview.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, '.preview-dist');
const out = join(root, 'preview');
mkdirSync(out, { recursive: true });

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pages = walk(dist).filter((f) => f.endsWith('.html') && !f.endsWith('404.html'));
const flat = (p) => {
  const clean = p.replace(/\/$/, '');
  return clean === '' ? 'accueil.html' : clean.slice(1).replace(/\//g, '-') + '.html';
};

for (const file of pages) {
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<script type="module" src="(\/_astro\/[^"]+)"><\/script>/g, (_, src) =>
    `<script type="module">${readFileSync(join(dist, src), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`,
  );
  html = html.replace(/url\((\/_astro\/[^)]+\.woff2)\)/g, (_, src) =>
    src.includes('latin') && !/cyrillic|greek|vietnamese/.test(src)
      ? `url(data:font/woff2;base64,${readFileSync(join(dist, src)).toString('base64')})`
      : 'url(data:,)',
  );
  html = html.replace(/href="(\/[^"#]*)(#[^"]*)?"/g, (m, path, hash = '') => {
    if (path.startsWith('/_astro') || path.endsWith('.svg') || path.endsWith('.xml')) return m;
    return `href="${flat(path)}${hash}"`;
  });
  const rel = '/' + relative(dist, file).replace(/index\.html$/, '');
  writeFileSync(join(out, flat(rel)), html);
  console.log(flat(rel), Math.round(html.length / 1024) + ' KB');
}
