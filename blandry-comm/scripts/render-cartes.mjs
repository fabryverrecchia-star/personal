// Cartes de visite (DA du site) : PDF d'impression, aperçus HD et mise en scène.
// Usage : node scripts/render-cartes.mjs   (depuis blandry-comm/)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { existsSync, createReadStream } from 'node:fs';
import http from 'node:http';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = (p) => resolve(root, 'livrables/print', p);
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
const p = await b.newPage({ viewport: { width: 2200, height: 1800 }, deviceScaleFactor: 4 });
await p.goto('http://localhost:4572/templates/cartes.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
for (const d of ['carte-visite-recto', 'carte-visite-verso']) {
  await p.evaluate((n) => document.querySelectorAll('[data-doc]').forEach((x) => x.classList.toggle('on', x.dataset.doc === n)), d);
  await p.pdf({ path: out(`${d}.pdf`), width: '91mm', height: '61mm', printBackground: true, pageRanges: '1' });
  await (await p.$(`[data-doc="${d}"]`)).screenshot({ path: out(`${d}-apercu.png`) });
  console.log(`print/${d}.pdf`);
}
const m = await b.newPage({ viewport: { width: 2200, height: 1800 } });
await m.goto('http://localhost:4572/templates/cartes.html');
await m.evaluate(() => document.fonts.ready);
await m.waitForTimeout(500);
await (await m.$('[data-out="mockup-cartes"]')).screenshot({ path: out('mockup-cartes.png') });
console.log('print/mockup-cartes.png');
await b.close();
srv.close();
