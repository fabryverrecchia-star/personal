// Assemble dist/ en une page HTML autonome (images, polices et script intégrés) pour un aperçu partageable.
// Usage : npm run preview:file
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'artifact', 'mel-ar-bescond.html');
const mime = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

let html = readFileSync(join(dist, 'index.html'), 'utf8');
// script du site intégré
html = html.replace(/<script type="module" src="([^"]+)"><\/script>/g, (_, src) =>
  `<script type="module">${readFileSync(join(dist, src), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`,
);
// une seule résolution par image
html = html.replace(/\s(srcset|sizes)="[^"]*"/g, '');
// ressources /_astro/ → data URI (polices latines uniquement : les autres ne sont jamais chargées en français)
html = html.replace(/\/_astro\/[^"')\s]+/g, (url) => {
  const file = join(dist, url);
  const ext = extname(url);
  if (!existsSync(file) || !mime[ext]) return url;
  if (ext === '.woff2' && !/-latin-/.test(url)) return url;
  return `data:${mime[ext]};base64,${readFileSync(file).toString('base64')}`;
});
html = html.replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${readFileSync(join(dist, 'favicon.svg')).toString('base64')}"`);

// page autonome : on garde les balises charset et viewport (indispensables quand le fichier est ouvert
// directement sur un téléphone), le squelette <html><head><body> est recréé par le navigateur ou l'artefact
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?(html|body)[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<title>[\s\S]*?<\/title>/, '');
html = `<title>Mel Ar Bescond</title>\n${html}`;

mkdirSync(join(root, 'artifact'), { recursive: true });
writeFileSync(out, html);
console.log(`artifact/mel-ar-bescond.html — ${(statSync(out).size / 1024).toFixed(0)} Ko`);
