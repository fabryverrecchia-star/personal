// Assemble dist/ en une page HTML entièrement autonome : script, images et polices intégrés.
// Le script est recompilé en script classique compatible Safari 13 / anciens Android, pour qu'il tourne
// partout : à la racine ou dans un sous-dossier d'un hébergement, en local, ou comme artefact.
// Usage : npm run preview:file
//   → artifact/mel-ar-bescond.html        (version artefact, sans squelette html/head/body)
//   → artifact/mel-ar-bescond-site/index.html  (site complet à mettre en ligne)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const mime = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// script du site, en IIFE classique (pas de module : aucun chargement de fichier externe)
const js = (
  await build({
    entryPoints: [join(root, 'src/scripts/main.ts')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2019', // Safari 13, anciens Android
    write: false,
    legalComments: 'none',
  })
).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

let html = readFileSync(join(dist, 'index.html'), 'utf8');
html = html.replace(/<script type="module"[^>]*><\/script>/g, '').replace(/<script type="module">[\s\S]*?<\/script>/g, '');
// fonction de remplacement : le code minifié contient des « $' » que replace() interpréterait
html = html.replace('</body>', () => `<script>${js}</script></body>`);
// une seule résolution par image
html = html.replace(/\s(srcset|sizes)="[^"]*"/g, '');
// ressources /_astro/ → data URI (polices latines uniquement : les autres ne sont jamais chargées en français)
html = html.replace(/\/_astro\/[^"')\s]+/g, (url) => {
  const file = join(dist, url);
  const ext = extname(url);
  if (!existsSync(file) || !mime[ext]) return url;
  if (ext === '.woff2' && !/-latin-/.test(url)) return 'data:font/woff2;base64,';
  return `data:${mime[ext]};base64,${readFileSync(file).toString('base64')}`;
});
html = html.replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${readFileSync(join(dist, 'favicon.svg')).toString('base64')}"`);
if (/\/_astro\//.test(html)) console.warn('⚠️  des chemins /_astro/ restent dans la page');

// 1. site complet, prêt à mettre en ligne
const siteDir = join(root, 'artifact', 'mel-ar-bescond-site');
rmSync(join(siteDir, 'site'), { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });
writeFileSync(join(siteDir, 'index.html'), html);

// 2. version artefact : le squelette <html><head><body> est ajouté à la publication ;
//    on garde charset et viewport, indispensables sur téléphone
const artifact = html
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?(html|body)[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<title>[\s\S]*?<\/title>/, '');
writeFileSync(join(root, 'artifact', 'mel-ar-bescond.html'), `<title>Mel Ar Bescond</title>\n${artifact}`);

console.log(`index.html — ${(statSync(join(siteDir, 'index.html')).size / 1024).toFixed(0)} Ko, script ${(js.length / 1024).toFixed(0)} Ko`);
