// Cartes de visite (DA du site) : PDF d'impression, aperçus HD et mise en scène.
// Usage : node scripts/render-cartes.mjs   (depuis blandry-comm/)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { existsSync, createReadStream, mkdirSync } from 'node:fs';
import http from 'node:http';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = (p) => resolve(root, 'livrables/print', p);
mkdirSync(out('cartes'), { recursive: true });
mkdirSync(out('bat'), { recursive: true });
const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http
  .createServer((q, r) => {
    const f = resolve(root, '.' + decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(root) || !existsSync(f)) return r.writeHead(404).end();
    r.setHeader('content-type', types[f.slice(f.lastIndexOf('.'))] ?? 'application/octet-stream');
    createReadStream(f).pipe(r);
  })
  .listen(4572);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2400, height: 2000 }, deviceScaleFactor: 4 });
p.on('pageerror', (e) => console.log('ERREUR', e.message));
await p.goto('http://localhost:4572/templates/cartes.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
const docs = await p.$$eval('[data-doc]', (a) => a.map((d) => ({ name: d.dataset.doc, w: +d.dataset.w, h: +d.dataset.h })));
for (const d of docs) {
  const dir = d.name.startsWith('BAT') ? 'bat/' : 'cartes/';
  await p.evaluate((n) => document.querySelectorAll('[data-doc]').forEach((x) => x.classList.toggle('on', x.dataset.doc === n)), d.name);
  await p.pdf({ path: out(`${dir}${d.name}.pdf`), width: `${d.w}mm`, height: `${d.h}mm`, printBackground: true, pageRanges: '1' });
  await (await p.$(`[data-doc="${d.name}"]`)).screenshot({ path: out(`${dir}${d.name}-apercu.png`), scale: d.name.startsWith('BAT') ? 'css' : 'device' });
  console.log(`print/${dir}${d.name}.pdf`);
}
const m = await b.newPage({ viewport: { width: 2200, height: 1800 } });
await m.goto('http://localhost:4572/templates/cartes.html');
await m.evaluate(() => document.fonts.ready);
await m.waitForLoadState('networkidle'); await m.waitForTimeout(800);
for (const el of await m.$$('[data-out]')) {
  const n = await el.getAttribute('data-out');
  await el.screenshot({ path: out(`cartes/${n}.png`) });
  console.log(`print/cartes/${n}.png`);
}
await b.close();
srv.close();
