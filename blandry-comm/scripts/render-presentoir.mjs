// Présentoir Pocket Display A5 : PDF à plat (sans repères), puis contrôle et fichier imprimeur (scripts/presentoir-pdf.py)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { existsSync, createReadStream } from 'node:fs';
import http from 'node:http';
import { resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !existsSync(f)) return r.writeHead(404).end(); r.setHeader('content-type', types[f.slice(f.lastIndexOf('.'))] ?? 'application/octet-stream'); createReadStream(f).pipe(r); }).listen(4573);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
p.on('pageerror', (e) => console.log('ERREUR', e.message));
await p.goto('http://localhost:4573/templates/presentoir.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(800);
await p.pdf({ path: resolve(root, 'livrables/print/presentoir/presentoir-art.pdf'), width: '358.4mm', height: '412.6mm', printBackground: true, pageRanges: '1' });
await b.close(); srv.close();
console.log('presentoir-art.pdf');
