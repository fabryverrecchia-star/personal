// Capture des blocs [data-out] d'un modèle : node scripts/shoot.mjs templates/x.html dossier-sortie
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, existsSync, createReadStream } from 'node:fs';
import http from 'node:http';
import { resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const [tpl, dir] = process.argv.slice(2);
mkdirSync(resolve(root, dir), { recursive: true });
const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !existsSync(f)) return r.writeHead(404).end(); r.setHeader('content-type', types[f.slice(f.lastIndexOf('.'))] ?? 'application/octet-stream'); createReadStream(f).pipe(r); }).listen(4571);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2400, height: 2400 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:4571/' + tpl);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(900);
for (const el of await p.$$('[data-out]')) { const n = await el.getAttribute('data-out'); await el.screenshot({ path: resolve(root, dir, n + '.png') }); console.log(dir + '/' + n + '.png'); }
await b.close(); srv.close();
