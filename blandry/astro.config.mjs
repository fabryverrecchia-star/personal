// @ts-check
import { defineConfig } from 'astro/config';

// Adresse de publication. Si le site passe sur son propre domaine
// (ex. https://www.blandry-peinture.fr), mettre ce domaine dans `site`,
// supprimer `base`, et mettre à jour `url` dans src/data/site.ts.
export default defineConfig({
  site: 'https://18h22.com',
  base: '/blandry',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
});
