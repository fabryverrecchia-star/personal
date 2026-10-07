// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // À remplacer par le domaine final (URLs canoniques / Open Graph)
  site: 'https://www.ilristorante.fr',
  // Anciennes URL de la maquette vers l’arborescence du site actuel
  redirects: {
    '/decouvrir': '/notre-cuisine-italienne',
    '/devenir-franchise': '/devenir-franchise-il-ristorante',
    '/news-fidelite': '/nos-engagements',
    '/news-fidelite/nos-engagements': '/nos-engagements',
    '/news-fidelite/blog': '/actualite',
    '/news-fidelite/fidelite-unica': '/la-carte-de-fidelite-unica',
    '/recrute': '/il-ristorante-recrute',
    '/recrute/nos-metiers': '/il-ristorante-recrute/nos-metiers',
    '/recrute/grandir-ensemble': '/il-ristorante-recrute/grandir-ensemble',
    '/recrute/s-epanouir': '/il-ristorante-recrute/sepanouir',
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
});
