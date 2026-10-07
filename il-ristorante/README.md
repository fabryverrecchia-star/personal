# Il Ristorante — site vitrine (concept)

Refonte du site Il Ristorante, pensée d’abord pour les **futurs franchisés**. Astro, three.js (WebGL), GSAP et Lenis.
Même arborescence que le site actuel, en multi-pages, avec des transitions fluides (ClientRouter d’Astro) et une couche WebGL persistante d’une page à l’autre.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # site statique dans dist/
npm run check    # vérification des types
```

## Arborescence

Mêmes pages et mêmes URL que www.ilristorante.fr (les liens et le référencement restent valables) :

| Menu | URL |
| --- | --- |
| Découvrir | `/notre-cuisine-italienne` · `/idees-cadeaux` · `/notre-cuisine-italienne/notre-signature` · `/notre-carte` · `/notre-cave` · `/nos-produits-italiens` |
| Il Ristorante chez vous | `/il-ristorante-chez-vous` · `/notre-cuisine-italienne/vente-a-emporter` · `/oenoteca` · `/notre-cuisine-italienne/notre-boutique` · `/notre-offre-traiteur-italien` |
| Restaurants (méga-menu par région) | `/restaurants` (carte) + 23 pages, ex. `/il-ristorante-le-restaurant-italien-de-lille` |
| News & Fidélité | `/nos-engagements` · `/actualite` · `/la-carte-de-fidelite-unica` |
| Il Ristorante recrute | `/il-ristorante-recrute` · `/nos-metiers` + 8 fiches métier · `/grandir-ensemble` · `/sepanouir` |
| **Devenir franchisé** | `/devenir-franchise-il-ristorante` |
| Pied de page | `/contact` · `/reserver` · `/mentions-legales` |

Les données (restaurants, horaires, réservation Zenchef, chefs, métiers, produits, mentions légales) viennent du site actuel : `src/data/*.json`, `src/content-md/`.

## Structure

```
il-ristorante/
├── brand/fonts/              # polices de la charte (Inter, Mea Culpa) en .ttf
├── public/
│   ├── brand/                # stickers et monogrammes de la charte (SVG)
│   ├── docs/                 # brochure franchise 2026 (téléchargeable)
│   ├── fonts/                # polices web générées (.woff2)
│   └── img/                  # photos optimisées (WebP)
├── scripts/build-fonts.py    # conversion et allègement des polices
└── src/
    ├── data/site.ts          # navigation, chiffres clés, conditions, contact
    ├── data/restaurants.ts   # liste des restaurants (À COMPLÉTER)
    ├── styles/global.css     # tokens (palette giardino, chianti, pomodoro…), composants
    ├── scripts/main.ts       # Lenis, transitions, révélations, compteurs, formulaires
    ├── scripts/gl/           # WebGL : plans synchronisés au DOM, flowmap, image au survol
    ├── components/           # Header, Footer, PageHero, Rows, Stats, Gallery, Sticker…
    ├── layouts/Base.astro
    └── pages/
```

## WebGL

Chaque `<img data-gl>` devient un plan three.js calé sur sa position à l’écran :

- **révélation** organique par le bas, avec un liseré aux couleurs de la marque ;
- **courbure** des images selon la vitesse de défilement ;
- **ondulation et relief** au survol, autour du pointeur ;
- les arrondis CSS (arches, coins) sont reproduits dans le shader ;
- **hero** : déformation liquide qui suit le pointeur (flowmap), parallaxe au défilement ;
- **listes** (`[data-follow]` + `data-img`) : une image suit le pointeur, inclinée selon sa vitesse.

Sans WebGL, ou avec `prefers-reduced-motion`, les images DOM restent affichées normalement.

## Ton éditorial

Les textes suivent la charte rédactionnelle 2026 : on vouvoie, on reste concret (produits, gestes, lieux), on mobilise les sens, on use des italianismes avec parcimonie et on évite les clichés.

## Carte de France animée

`src/components/FranceMap.astro` : contour de la France métropolitaine (world-atlas, projection de Lambert) généré au build. Au défilement, la section s’épingle, le contour se dessine, puis les points apparaissent du nord au sud avec un compteur synchronisé.

- page Restaurants : les restaurants de `src/data/restaurants.ts` qui ont des coordonnées (`lat`, `lng`) ;
- page Devenir franchisé : restaurants + agglomérations de 70 000 habitants et plus (`src/data/agglomerations.ts`, liste indicative).

## Aperçu autonome

`npm run apercu` génère `preview/il-ristorante-apercu.html` : tout le site dans un seul fichier, navigable hors ligne.

## À compléter avant mise en ligne

- les articles du blog pointent vers leurs URL d’origine (`/AAAA/MM/JJ/slug/`) : à migrer avec le contenu ;
- les formulaires (candidature franchise, contact) préparent un e-mail (`mailto:`) : à brancher sur un CRM si besoin ;
- statut franchise / succursale de chaque restaurant (non publié sur le site actuel) ;
- la licence d’usage web de la police Salo Paolo est à confirmer avec son auteur.
