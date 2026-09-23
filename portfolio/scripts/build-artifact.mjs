// Assemble le site construit (dist/) en une seule page HTML autonome pour l'aperçu en artefact.
// Usage : npm run build && node scripts/build-artifact.mjs
import { build } from 'esbuild';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'artifact', 'portfolio.html');

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });

const pages = {};
const styles = new Set();
for (const file of walk(dist)) {
  const html = readFileSync(file, 'utf8');
  const rel = '/' + relative(dist, file).replace(/(index)?\.html$/, '').replace(/\/$/, '');
  const path = rel === '/' ? '/' : rel;
  pages[path] = {
    title: html.match(/<title>(.*?)<\/title>/s)[1],
    header: html.match(/<header class="header[\s\S]*?<\/header>/)[0],
    main: html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1],
  };
  for (const [, css] of html.matchAll(/<style>([\s\S]*?)<\/style>/g)) styles.add(css);
  for (const [, href] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g))
    styles.add(readFileSync(join(dist, href), 'utf8'));
}

let css = [...styles].join('\n');
css = css.replace(/url\((['"]?)\/fonts\/([^'")]+)\1\)/g, (_, _q, name) => {
  const data = readFileSync(join(dist, 'fonts', name)).toString('base64');
  return `url(data:font/woff2;base64,${data})`;
});

const js = (
  await build({
    entryPoints: [join(root, 'src/scripts/artifact-router.ts')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2020',
    write: false,
  })
).outputFiles[0].text;

const index = readFileSync(join(dist, 'index.html'), 'utf8');
const body = index
  .match(/<body>([\s\S]*)<\/body>/)[1]
  .replace(/<script[\s\S]*?<\/script>/g, '');
const json = JSON.stringify(pages).replace(/</g, '\\u003c');
const safeJs = js.replace(/<\/script/gi, '<\\/script');

mkdirSync(join(root, 'artifact'), { recursive: true });
writeFileSync(
  out,
  `<title>Portfolio Fabry Verrecchia</title>
<style>${css}</style>
${body}
<script type="application/json" id="pages">${json}</script>
<script>${safeJs}</script>
`,
);
console.log(`${relative(root, out)} — ${(statSync(out).size / 1024).toFixed(0)} Ko, ${Object.keys(pages).length} pages`);
