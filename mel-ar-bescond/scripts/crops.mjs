// Recadrages provisoires tirés du brand kit, en attendant les photos du shooting.
import sharp from 'sharp';
const crops = {
  apiculteurs: ['4.webp', { left: 52, top: 80, width: 720, height: 890 }],
  cuillere: ['1.webp', { left: 230, top: 375, width: 884, height: 275 }],
  filet: ['1.webp', { left: 330, top: 1110, width: 700, height: 266 }],
  tamis: ['2.webp', { left: 0, top: 0, width: 1082, height: 350 }],
  pot: ['3.webp', { left: 0, top: 165, width: 355, height: 1040 }],
  pot2: ['3.webp', { left: 735, top: 360, width: 355, height: 640 }],
};
for (const [n, [f, c]] of Object.entries(crops)) await sharp('brand/kit/' + f).extract(c).jpeg({ quality: 92 }).toFile(`src/assets/photos/${n}.jpg`);
