// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // À remplacer par le domaine final (utile pour les URLs canoniques / Open Graph)
  site: 'https://example.com',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
});
