// Génère les visuels Meta (PNG) et les fichiers d'impression (PDF + aperçus PNG).
// Usage : node scripts/render.mjs   (depuis blandry-comm/)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, existsSync, createReadStream } from 'node:fs';
import http from 'node:http';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = (p) => resolve(root, 'livrables', p);
mkdirSync(out('meta'), { recursive: true });
mkdirSync(out('print'), { recursive: true });
mkdirSync(out('web'), { recursive: true });

// Serveur local : les masques CSS (monogramme) sont bloqués en file://
const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http
  .createServer((q, r) => {
    const f = resolve(root, '.' + decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(root) || !existsSync(f)) return r.writeHead(404).end();
    r.setHeader('content-type', types[f.slice(f.lastIndexOf('.'))] ?? 'application/octet-stream');
    createReadStream(f).pipe(r);
  })
  .listen(4570);
const base = 'http://localhost:4570';

const browser = await chromium.launch();

// Visuels publicitaires et réseaux : capture de chaque bloc à sa taille réelle
const page = await browser.newPage({ viewport: { width: 2000, height: 2000 } });
await page.goto(base + '/templates/creas.html');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
for (const el of await page.$$('[data-out]')) {
  const name = await el.getAttribute('data-out');
  const dir = name.startsWith('web-') ? 'web' : 'meta';
  await el.screenshot({ path: out(`${dir}/${name}.png`) });
  console.log(`${dir}/${name}.png`);
}

// Mises en scène des cartes de visite (rendu 2000 × 1300)
const mk = await browser.newPage({ viewport: { width: 2200, height: 3000 } });
await mk.goto(base + '/templates/mockups.html');
await mk.waitForTimeout(800);
for (const el of await mk.$$('[data-out]')) {
  const name = await el.getAttribute('data-out');
  await el.screenshot({ path: out(`print/${name}.png`) });
  console.log(`print/${name}.png`);
}

// Impression : un PDF par document, au format fini + fonds perdus
const pr = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await pr.goto(base + '/templates/print.html');
await pr.evaluate(() => document.fonts.ready);
await pr.waitForTimeout(500);
const docs = await pr.$$eval('[data-doc]', (a) => a.map((d) => ({ name: d.dataset.doc, w: +d.dataset.w, h: +d.dataset.h })));
for (const d of docs) {
  await pr.evaluate((n) => document.querySelectorAll('[data-doc]').forEach((x) => x.classList.toggle('on', x.dataset.doc === n)), d.name);
  await pr.pdf({ path: out(`print/${d.name}.pdf`), width: `${d.w}mm`, height: `${d.h}mm`, printBackground: true, pageRanges: '1' });
  const el = await pr.$(`[data-doc="${d.name}"]`);
  await el.screenshot({ path: out(`print/${d.name}-apercu.png`) });
  console.log(`print/${d.name}.pdf`);
}
await browser.close();
srv.close();
