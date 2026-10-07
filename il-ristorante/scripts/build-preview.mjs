// Assemble le site construit (dist/) en un seul fichier HTML autonome, pour un aperçu local.
// Usage : npm run build && node scripts/build-preview.mjs  →  preview/il-ristorante-apercu.html
import { build } from 'esbuild';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
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
    // Images allégées pour l'aperçu (le site réel garde les originaux)
    const data = extname(file) === '.webp'
      ? await sharp(file).resize({ width: 760, withoutEnlargement: true }).webp({ quality: 55 }).toBuffer()
      : readFileSync(file);
    assets[rel] = `data:${mime[extname(file)]};base64,${data.toString('base64')}`;
  }
}

// Vidéos : une version très légère par vidéo (360 px), partagée par les sources 1080 et 720
const videoDir = join(dist, 'videos');
const cache = join(tmpdir(), 'ilr-preview-videos');
mkdirSync(cache, { recursive: true });
for (const f of readdirSync(videoDir).filter((f) => f.endsWith('-720.mp4'))) {
  const slug = f.replace('-720.mp4', '');
  const out = join(cache, slug + '.mp4');
  try { statSync(out); } catch {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(videoDir, f), '-vf', 'scale=270:-2', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '33', '-maxrate', '260k', '-bufsize', '520k', '-c:a', 'aac', '-ac', '1', '-b:a', '40k', '-movflags', '+faststart', out]);
  }
  const uri = `data:video/mp4;base64,${readFileSync(out).toString('base64')}`;
  assets[`/videos/${slug}-720.mp4`] = uri;
  assets[`/videos/${slug}-poster.webp`] = `data:image/webp;base64,${(await sharp(join(videoDir, slug + '-poster.webp')).resize({ width: 360 }).webp({ quality: 55 }).toBuffer()).toString('base64')}`;
}

const pages = {};
const styles = new Set();
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  if (!/<main[^>]*>/.test(html)) continue; // pages de redirection
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
// Les vidéos ne sont pas incrustées dans le HTML de départ (le routeur les résout au chargement)
const inline = (h, withVideos = true) => h.replace(/\/(?:img|brand|fonts|videos)\/[^"')\s]+|\/favicon\.svg/g, (m) => (!withVideos && m.startsWith('/videos/') ? m : assets[m.replace('-1080.mp4', '-720.mp4')] ?? m));
let body = index.match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
body = inline(body, false).replace(/href="\/docs\/[^"]+"/g, 'href="#"');
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
