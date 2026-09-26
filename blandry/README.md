# Blandry — site vitrine peintre en bâtiment

Refonte de https://18h22.com/blandry/ : priorité à la **peinture** (pas à la rénovation complète),
ancrage local **Combrailles · Riom · Clermont-Ferrand**, pensé d'abord pour le mobile.

## Lancer

```bash
npm install
npm run dev      # http://localhost:4321/blandry/
npm run build    # site statique dans dist/
```

## À compléter avant la mise en ligne

Tout est dans **`src/data/site.ts`** (lignes marquées `À COMPLÉTER`) :

- téléphone, e-mail, SIRET, nom de l'assureur décennale, nom du gérant ;
- **commune du siège + coordonnées GPS** : c'est le signal local n° 1 pour Google
  (la valeur actuelle, Saint-Gervais-d'Auvergne, est une hypothèse) ;
- relire les textes des secteurs (`zones`) : ils parlent de trajets et d'habitudes
  (« on descend chaque semaine vers Clermont… ») qui doivent être vrais ;
- hébergeur dans `src/pages/mentions-legales.astro` ;
- une image `public/og.png` (1200×630) pour les partages sur les réseaux.

Si le site passe sur son propre domaine, modifier `site` / `base` dans `astro.config.mjs`
et `url` dans `src/data/site.ts`.

## Référencement local

- Une page par secteur : `/peintre-combrailles/`, `/peintre-riom/`, `/peintre-clermont-ferrand/`
  (titre, description, H1, FAQ et liste de communes propres à chaque secteur).
- Données structurées `HousePainter` (adresse, zone desservie, services), `FAQPage`, `BreadcrumbList`.
- `sitemap.xml` et `robots.txt` générés au build.
- Vocabulaire local : pierre de Volvic, Sioule, Limagne, Chaîne des Puys, maisons de bourg…

À faire en dehors du site : fiche **Google Business Profile** avec la même adresse et le même
téléphone qu'ici, catégorie « Peintre en bâtiment », zones desservies = les communes des pages
secteurs, et des photos de chantiers réels.

## Design

- Typo : Instrument Serif (titres) + Inter Tight (texte), auto-hébergées via Fontsource.
- Objet signature : le **nuancier en éventail** (hero), les teintes portent des noms du pays
  (Gris Volvic, Vert Sioule, Ocre Limagne…) et servent de couleurs aux services et secteurs.
- Animations GSAP + Lenis : rideau de peinture entre les pages, trait de pinceau, titres ligne
  à ligne, cartes services empilées, nuancier interactif. Tout est désactivé si l'appareil
  demande moins d'animations (`prefers-reduced-motion`).
- Mobile : barre d'appel fixe (Appeler / Devis), menu plein écran, pas de défilement doux au doigt.

Le formulaire ouvre la messagerie du visiteur avec la demande pré-remplie (aucun serveur).
Pour recevoir les demandes directement, brancher un service type Formspree ou Web3Forms.
