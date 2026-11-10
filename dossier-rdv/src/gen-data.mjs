// Génère les données de la démo (contour de France projeté, restaurants, villes) depuis le projet du site.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../../il-ristorante/package.json', import.meta.url));
const { geoConicConformal, geoPath } = require('d3-geo');
const { feature } = require('topojson-client');
const world = require('world-atlas/countries-10m.json');
const site = new URL('../../il-ristorante/src/data/', import.meta.url);
const restos = JSON.parse(readFileSync(new URL('restaurants.json', site)));
const agglo = readFileSync(new URL('agglomerations.ts', site), 'utf8');
const cities = [...agglo.matchAll(/name: '([^']+)', lat: ([\d.]+), lng: (-?[\d.]+)/g)].map((m) => ({ name: m[1], lat: +m[2], lng: +m[3] }));
const fr = feature(world, world.objects.countries).features.find((f) => f.id === '250');
const metro = { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: fr.geometry.coordinates.filter((p) => { const [x, y] = p[0][0]; return x > -6 && x < 10 && y > 41 && y < 52; }) } };
const W = 600, H = 576;
const proj = geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitExtent([[12, 12], [W - 12, H - 12]], metro);
const path = geoPath(proj).digits(1)(metro);
const pt = (lng, lat) => proj([lng, lat]).map((v) => Math.round(v * 10) / 10);
const data = {
  W, H, path,
  restaurants: restos.map((r) => ({ name: r.name, region: r.region, city: r.city, street: r.street, cp: r.postalCode, phone: r.phone, hours: r.hours.slice(0, 2), booking: r.booking, lat: r.lat, lng: r.lng, xy: pt(r.lng, r.lat), chef: r.chef ? r.chef.name : null, slug: r.slug })),
  cities: cities.map((c) => ({ ...c, xy: pt(c.lng, c.lat) })).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
};
writeFileSync(new URL('data.json', import.meta.url), JSON.stringify(data));
console.log(data.restaurants.length, 'restaurants,', data.cities.length, 'villes, chemin', (path.length / 1024).toFixed(0), 'Ko');
