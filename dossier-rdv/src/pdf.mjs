// Produit dist/Dossier-Il-Ristorante.pdf depuis dist/index.html (A4 paysage, une page par chapitre).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1123, height: 794 } });
await p.goto('file://' + dist + 'index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.emulateMedia({ media: 'print' });
await p.waitForTimeout(600);
await p.pdf({ path: dist + 'Dossier-Il-Ristorante.pdf', width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true, scale: 0.55 });
await b.close();
console.log('PDF ok');
