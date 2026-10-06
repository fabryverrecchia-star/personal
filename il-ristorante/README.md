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

| Page | URL |
| --- | --- |
| Accueil | `/` |
| Découvrir | `/decouvrir` |
| Il Ristorante chez vous | `/il-ristorante-chez-vous` |
| Restaurants | `/restaurants` |
| News & Fidélité | `/news-fidelite` · `/nos-engagements` · `/blog` · `/fidelite-unica` |
| Il Ristorante recrute | `/recrute` · `/nos-metiers` · `/grandir-ensemble` · `/s-epanouir` |
| **Devenir franchisé** | `/devenir-franchise` (page phare : chiffres 2025, conditions, accompagnement, candidature) |

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

## À compléter avant mise en ligne

- `src/data/restaurants.ts` : la liste réelle des 23 restaurants (adresses, liens de réservation) ;
- les liens de commande en ligne, cartes cadeaux, offres d’emploi et carte UNICA (`href="#"`) ;
- les articles du blog (titres d’exemple) ;
- le fonctionnement exact du programme UNICA ;
- le formulaire de candidature prépare un e-mail (`mailto:`) au directeur du développement : à brancher sur un CRM si besoin.
