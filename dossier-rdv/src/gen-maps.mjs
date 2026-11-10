// Données des cartes animées : France (réseau, franchise), Italie (produits), Italie + France (flux).
// Usage : node src/gen-maps.mjs  → src/maps.json
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../../il-ristorante/package.json', import.meta.url));
const { geoConicConformal, geoMercator, geoPath } = require('d3-geo');
const { feature } = require('topojson-client');
const w10 = require('world-atlas/countries-10m.json');
const w50 = require('world-atlas/countries-50m.json');
const site = new URL('../../il-ristorante/src/data/', import.meta.url);
const restos = JSON.parse(readFileSync(new URL('restaurants.json', site)));
const agglo = readFileSync(new URL('agglomerations.ts', site), 'utf8');
const cities = [...agglo.matchAll(/name: '([^']+)', lat: ([\d.]+), lng: (-?[\d.]+)/g)].map((m) => ({ name: m[1], lat: +m[2], lng: +m[3] }));

const country = (w, id) => feature(w, w.objects.countries).features.find((f) => f.id === id);
const metro = (f) => ({ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates.filter((p) => { const [x, y] = p[0][0]; return x > -6 && x < 10 && y > 41 && y < 52; }) } });
const round = (a) => a.map((v) => Math.round(v * 10) / 10);
const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

// Producteurs : l'Émilie-Romagne est tournée, le Piémont et les Pouilles sont des exemples.
const origins = [
  { id: 'parmigiano', product: 'Parmigiano Reggiano DOP', place: 'Reggio Emilia', region: 'Émilie-Romagne', status: 'tourne', lat: 44.698, lng: 10.631 },
  { id: 'prosciutto', product: 'Prosciutto di Parma DOP', place: 'Langhirano, Parme', region: 'Émilie-Romagne', status: 'tourne', lat: 44.614, lng: 10.268 },
  { id: 'gorgonzola', product: 'Gorgonzola DOP', place: 'Novare', region: 'Piémont', status: 'exemple', lat: 45.446, lng: 8.622 },
  { id: 'nocciola', product: 'Nocciola Piemonte IGP', place: 'Alba, Langhe', region: 'Piémont', status: 'exemple', lat: 44.7, lng: 8.035 },
  { id: 'burrata', product: 'Burrata di Andria IGP', place: 'Andria', region: 'Pouilles', status: 'exemple', lat: 41.227, lng: 16.296 },
  { id: 'olio', product: 'Huile d’olive extra vierge', place: 'Bitonto, Terra di Bari', region: 'Pouilles', status: 'exemple', lat: 41.108, lng: 16.691 },
];

// France seule (détail 10m), même projection que la démo du store locator
const fr10 = metro(country(w10, '250'));
const FW = 600, FH = 576;
const fp = geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitExtent([[12, 12], [FW - 12, FH - 12]], fr10);
const frPath = geoPath(fp).digits(1)(fr10);
const r = restos.map((x) => ({ name: x.name, region: x.region, lat: x.lat, lng: x.lng, xy: round(fp([x.lng, x.lat])) }));
// Opportunités : agglomérations de la liste indicative sans restaurant à moins de 35 km
const opps = cities.filter((c) => c.lng > -5 && c.lat > 42.3 && restos.every((x) => km(c, x) > 35)).map((c) => { const near = restos.map((x) => ({ n: x.name, d: km(c, x) })).sort((a, b) => a.d - b.d)[0]; return { name: c.name, xy: round(fp([c.lng, c.lat])), near: near.n, km: Math.round(near.d) }; });
const regions = [...new Set(r.map((x) => x.region))].map((name) => {
  const l = r.filter((x) => x.region === name);
  return { name, n: l.length, xy: [Math.round(l.reduce((s, x) => s + x.xy[0], 0) / l.length), Math.round(l.reduce((s, x) => s + x.xy[1], 0) / l.length)] };
});

// Italie seule (50m)
const it50 = country(w50, '380');
const IW = 560, IH = 640;
const ip = geoConicConformal().parallels([38, 44]).rotate([-12.5, 0]).fitExtent([[16, 16], [IW - 16, IH - 16]], it50);
const itPath = geoPath(ip).digits(1)(it50);
const io = origins.map((o) => ({ ...o, xy: round(ip([o.lng, o.lat])) }));
const zoomBox = (() => { const a = round(ip([9.6, 45.1])), b = round(ip([11.4, 44.2])); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; })();

// Italie et France ensemble (50m)
const fr50 = metro(country(w50, '250'));
const both = { type: 'FeatureCollection', features: [fr50, it50] };
const DW = 1000, DH = 640;
const dp = geoConicConformal().parallels([40, 48]).rotate([-7, 0]).fitExtent([[20, 20], [DW - 20, DH - 20]], both);
const g = geoPath(dp).digits(1);
const duo = {
  W: DW, H: DH, fr: g(fr50), it: g(it50),
  restos: r.map((x) => ({ name: x.name, xy: round(dp([x.lng, x.lat])) })),
  origins: origins.map((o) => ({ id: o.id, product: o.product, status: o.status, xy: round(dp([o.lng, o.lat])) })),
};
const parma = { lat: 44.801, lng: 10.328 };
const dist = r.map((x) => km(parma, x));

const out = {
  fr: { W: FW, H: FH, path: frPath, restos: restos.map((x, i) => ({ name: x.name, region: x.region, xy: r[i].xy, street: x.street, cp: x.postalCode, city: x.city, phone: x.phone, hours: (x.hours || []).slice(0, 2), slug: x.slug })), opps, regions },
  it: { W: IW, H: IH, path: itPath, origins: io, zoom: zoomBox },
  duo,
  stats: { minKm: Math.round(Math.min(...dist) / 10) * 10, maxKm: Math.round(Math.max(...dist) / 10) * 10, opps: opps.length },
};
writeFileSync(new URL('maps.json', import.meta.url), JSON.stringify(out));
console.log('restos', r.length, 'opps', opps.length, 'km', out.stats.minKm, out.stats.maxKm, 'size', (JSON.stringify(out).length / 1024).toFixed(0), 'Ko');
