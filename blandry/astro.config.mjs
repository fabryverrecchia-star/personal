// @ts-check
import { defineConfig } from 'astro/config';

// Adresse de publication : le site est servi à la racine de benjaminlandry.fr.
export default defineConfig({
  site: 'https://benjaminlandry.fr',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
});
