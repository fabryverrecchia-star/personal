// @ts-check
import { defineConfig } from 'astro/config';

// Adresse de publication : le site est servi à la racine de benjaminlandry.fr.
// Pour une copie de test dans un sous-dossier : BASE=/lpm/ SITE=https://18h22.com npm run build
export default defineConfig({
  site: process.env.SITE ?? 'https://benjaminlandry.fr',
  base: process.env.BASE ?? '/',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
});
