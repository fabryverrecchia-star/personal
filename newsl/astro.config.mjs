// @ts-check
import { defineConfig } from 'astro/config';

// Publié sur https://18h22.com/newsl
export default defineConfig({
  site: 'https://18h22.com',
  base: '/newsl',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto', assets: 'assets' },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
