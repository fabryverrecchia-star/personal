import type { APIRoute } from 'astro';
import { zones } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const paths = ['/', ...zones.map((z) => `/${z.slug}/`), '/mentions-legales/'];
  const today = new Date().toISOString().slice(0, 10);
  const urls = paths
    .map((p) => {
      const loc = new URL(base + p, site).href;
      const prio = p === '/' ? '1.0' : p.includes('mentions') ? '0.2' : '0.9';
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${prio}</priority></url>`;
    })
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
