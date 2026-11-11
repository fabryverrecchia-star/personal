// Produit dist/Dossier-Il-Ristorante-18h22.pdf depuis dist/index.html : une slide 1440 x 810 par page.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { renameSync } from 'node:fs';
const dist = process.argv[2] || fileURLToPath(new URL('../dist/', import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
await p.goto('file://' + dist + 'index.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
await p.evaluate(() => window.__print());
await p.evaluate(() => window.__mapsFinal && window.__mapsFinal());
// Les écrans interactifs (cartes dans l'interface Il Ristorante) sont figés en image avant l'impression
const vps = await p.$$('.vp:has(.irmap)');
for (const vp of vps) {
  await vp.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const buf = await vp.screenshot({ type: 'jpeg', quality: 88 });
  await vp.evaluate((el, src) => { const img = document.createElement('img'); img.src = src; img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:1'; el.parentElement.appendChild(img); el.style.visibility = 'hidden'; }, 'data:image/jpeg;base64,' + buf.toString('base64'));
}
await p.evaluate(() => scrollTo(0, 0));
await p.waitForTimeout(500);
await p.waitForTimeout(800);
await p.pdf({ path: dist + 'Dossier-Il-Ristorante-18h22.pdf', width: '1440px', height: '810px', printBackground: true, preferCSSPageSize: true });
await b.close();
// Allègement des images (Ghostscript, s'il est installé)
try {
  const f = dist + 'Dossier-Il-Ristorante-18h22.pdf';
  execFileSync('gs', ['-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.6', '-dPDFSETTINGS=/printer', '-dColorImageResolution=180', '-sOutputFile=' + f + '.tmp', f]);
  renameSync(f + '.tmp', f);
} catch (e) { console.log('PDF non allégé :', e.message); }
console.log('PDF ok');
