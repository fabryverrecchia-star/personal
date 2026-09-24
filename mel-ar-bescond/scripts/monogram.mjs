// Monogramme NF revectorisé plus finement (agrandi, adouci, puis tracé) pour le préloader.
import sharp from 'sharp';
import potrace from 'potrace';
import { writeFileSync } from 'node:fs';
const crop = { left: 572, top: 662, width: 116, height: 110 };
const scale = 9;
const buf = await sharp('brand/kit/5.png').extract(crop).flatten({ background: '#fff' }).greyscale()
  .resize(crop.width * scale, crop.height * scale, { kernel: 'cubic' }).blur(3.2).png().toBuffer();
const svg = await new Promise((res, rej) => potrace.trace(buf, { threshold: 150, turdSize: 400, optTolerance: 0.6, alphaMax: 1.1, color: 'currentColor' }, (e, s) => (e ? rej(e) : res(s))));
const d = svg.match(/ d="([^"]+)"/)[1].replace(/(\d+\.\d)\d+/g, '$1');
writeFileSync('src/assets/svg/monogram-fine.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${crop.width * scale} ${crop.height * scale}"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`);
console.log('ok', d.length);
