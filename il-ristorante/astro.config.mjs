// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // À remplacer par le domaine final (URLs canoniques / Open Graph)
  site: 'https://www.ilristorante.fr',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
});
