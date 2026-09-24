// Vectorise les éléments du brand kit (logo, emblème, abeille, hermine, carte) en SVG.
import sharp from 'sharp';
import potrace from 'potrace';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('src/assets/svg', { recursive: true });
mkdirSync('scratch', { recursive: true });

// mode 'dark' : trace les pixels sombres ; 'light' : trace les pixels clairs
async function trace(name, file, crop, { patch, threshold = 128, mode = 'dark', scale = 3, turdSize = 8, preview = true } = {}) {
  let img = sharp(file).extract(crop)
  // patch : zones à effacer avant le tracé (repère, points décoratifs)
  if (patch) img = sharp(await img.composite([patch].flat().map((p) => ({ input: { create: { width: p.w, height: p.h, channels: 3, background: p.bg ?? '#ece5da' } }, left: p.x, top: p.y }))).png().toBuffer());
  img = img.flatten({ background: '#ffffff' }).greyscale();
  if (mode === 'light') img = img.negate();
  const buf = await img.resize(crop.width * scale, crop.height * scale, { kernel: 'lanczos3' }).png().toBuffer();
  if (preview) await sharp(buf).toFile(`scratch/${name}.png`);
  const svg = await new Promise((res, rej) =>
    potrace.trace(buf, { threshold, turdSize, optTolerance: 0.3, alphaMax: 1, color: 'currentColor', background: 'transparent' }, (e, s) => (e ? rej(e) : res(s))));
  const d = svg.match(/ d="([^"]+)"/)[1];
  const w = crop.width * scale, h = crop.height * scale;
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
  writeFileSync(`src/assets/svg/${name}.svg`, out);
  console.log(name, (out.length / 1024).toFixed(0) + 'kB');
}

await trace('logo', 'brand/kit/4.webp', { left: 1000, top: 365, width: 835, height: 345 }, { threshold: 150 });
await trace('emblem', 'brand/kit/5.png', { left: 195, top: 140, width: 870, height: 690 }, { threshold: 140, scale: 1.6, turdSize: 3 });
await trace('bee', 'brand/kit/5.png', { left: 500, top: 340, width: 250, height: 200 }, { threshold: 140, scale: 2.4, turdSize: 30, patch: [[236, 15], [0, 101], [212, 114], [225, 184]].map(([x, y]) => ({ x, y, w: 16, h: 16, bg: '#ffffff' })) });
await trace('monogram', 'brand/kit/5.png', { left: 575, top: 665, width: 110, height: 105 }, { threshold: 140, scale: 5, turdSize: 3 });
await trace('hermine', 'brand/kit/3.webp', { left: 355, top: 380, width: 385, height: 610 }, { threshold: 70, mode: 'light', scale: 2, turdSize: 400 });
await trace('bretagne', 'brand/kit/1.webp', { left: 395, top: 860, width: 310, height: 185 }, { threshold: 40, mode: 'light', scale: 3, turdSize: 200, patch: { x: 88, y: 28, w: 40, h: 40 } });

// Logo : un <path> par lettre (sous-chemins regroupés par inclusion des boîtes : trous des A, R, O, D)
import { readFileSync } from 'node:fs';
{
  const svg = readFileSync('src/assets/svg/logo.svg', 'utf8');
  const [, vb] = svg.match(/viewBox="([^"]+)"/);
  const d = svg.match(/ d="([^"]+)"/)[1].replace(/(\d+\.\d)\d+/g, '$1');
  const subs = d.split(/(?=M)/).map((s) => {
    const n = s.match(/-?\d+(\.\d+)?/g).map(Number);
    const pts = [];
    for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    const xs = pts.map((p) => p[0]);
    return { s: s.trim(), pts, x0: Math.min(...xs), area: (Math.max(...xs) - Math.min(...xs)) * (Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))) };
  });
  // point dans polygone (approximation par les points de contrôle)
  const contains = (poly, [x, y]) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const parents = (a) => subs.filter((b) => b !== a && contains(b.pts, a.pts[0]));
  const roots = subs.filter((a) => parents(a).length % 2 === 0);
  const groups = roots.map((r) => [r]);
  for (const a of subs.filter((x) => !roots.includes(x))) {
    const p = parents(a).filter((b) => roots.includes(b)).sort((x, y) => x.area - y.area)[0];
    groups[roots.indexOf(p)].push(a);
  }
  const y0 = (g) => Math.min(...g[0].pts.map((p) => p[1]));
  groups.sort((a, b) => (y0(a) > 480) - (y0(b) > 480) || a[0].x0 - b[0].x0);
  const paths = groups.map((g) => `<path class="glyph" d="${g.map((x) => x.s).join(' ')}"/>`).join('');
  writeFileSync('src/assets/svg/logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="currentColor" fill-rule="evenodd">${paths}</svg>`);
  console.log('logo glyphs', groups.length, groups.map((g) => g.length).join(','));
}
