// Génère public/media/map-dots.json : la carte du monde en points pour la
// section « Sounds like … » (dézoom Paris → monde).
//
// Trois niveaux de détail, uniquement sur les terres (Natural Earth via
// world-atlas). Les niveaux « ville » (Paris) sont générés côté client.
//
// Format : { "dots": base64 } d'un tampon binaire little-endian :
// Uint32[3] (nombre de points par niveau), puis pour chaque point
// Int16 lon×100, Int16 lat×100.
//
// Usage : node scripts/build-map.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { geoBounds, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

const load = (file) => {
  const topo = JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${file}`, import.meta.url)));
  const land = feature(topo, topo.objects.land);
  const geom = land.features ? land.features[0].geometry : land.geometry;
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  return polys.map((coordinates) => {
    const f = { type: 'Feature', geometry: { type: 'Polygon', coordinates } };
    return { f, b: geoBounds(f) };
  });
};

const land110 = load('land-110m.json');
const land50 = load('land-50m.json');

// Boîte englobante (gère les polygones qui traversent l'antiméridien, ex. Eurasie)
const inBox = (b, lon, lat) =>
  lat >= b[0][1] && lat <= b[1][1] && (b[0][0] <= b[1][0] ? lon >= b[0][0] && lon <= b[1][0] : lon >= b[0][0] || lon <= b[1][0]);
const onLand = (polys, lon, lat) => polys.some(({ f, b }) => inBox(b, lon, lat) && geoContains(f, [lon, lat]));

/** Grille en quinconce (une ligne sur deux décalée d'un demi-pas) */
function grid(polys, step, [lon0, lon1], [lat0, lat1]) {
  const out = [];
  let row = 0;
  for (let lat = lat0; lat <= lat1; lat += step * 0.866, row++) {
    for (let lon = lon0 + (row % 2) * step * 0.5; lon <= lon1; lon += step) {
      if (onLand(polys, lon, lat)) out.push(lon, lat);
    }
  }
  return out;
}

const levels = [
  grid(land110, 1.6, [-180, 180], [-56, 78]), // monde
  grid(land50, 0.42, [-12, 62], [22, 62]), // Europe, Méditerranée, Golfe
  grid(land50, 0.11, [-5.5, 19], [36, 51.6]), // France, Italie, Sicile
];

const total = levels.reduce((n, l) => n + l.length / 2, 0);
const buf = Buffer.alloc(12 + total * 4);
levels.forEach((l, i) => buf.writeUInt32LE(l.length / 2, i * 4));
let o = 12;
for (const l of levels) {
  for (const v of l) {
    buf.writeInt16LE(Math.round(v * 100), o);
    o += 2;
  }
}
writeFileSync(new URL('../public/media/map-dots.json', import.meta.url), JSON.stringify({ dots: buf.toString('base64') }));
console.log('points par niveau :', levels.map((l) => l.length / 2).join(' / '), `— ${(buf.length / 1024).toFixed(0)} Ko`);
