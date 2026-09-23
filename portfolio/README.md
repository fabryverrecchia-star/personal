# Portfolio

Portfolio personnel — Astro + GSAP + Lenis. Base inspirée de [joffreyspitzer.com](https://joffreyspitzer.com/), analysée dans [`demo/ANALYSE.md`](demo/ANALYSE.md).

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # site statique dans dist/
npm run check    # vérification des types
```

## Structure

```
portfolio/
├── brand/fonts/           # polices sources (.ttf)
├── public/fonts/          # polices web générées (.woff2)
├── scripts/build-fonts.py # conversion et allègement des polices
├── demo/ANALYSE.md        # analyse du site de référence
└── src/
    ├── site.config.ts     # nom, rôle, accroche, e-mail, réseaux, navigation
    ├── content/projects/  # un fichier .md par projet
    ├── assets/images/     # images des projets (optimisées au build)
    ├── styles/global.css  # tokens (couleurs, typo, grille) + @font-face
    ├── scripts/app.ts     # loader, Lenis, révélations, Flip grille/liste, transitions
    ├── components/        # Header, Footer, Loader, WorkIndex, ProjectMedia, Rich
    ├── layouts/Base.astro
    └── pages/             # accueil, à propos, work/[slug], 404
```

## Ajouter un projet

Créer `src/content/projects/mon-projet.md` :

```md
---
title: Mon projet
client: Client
year: 2026
category: Site vitrine
role: [Design, Développement]
order: 1
cover: ../../assets/images/mon-projet.jpg   # optionnel
url: https://…                               # optionnel
---

Texte de l'étude de cas.
```

## Typographie

Tout le site repose sur la famille Garamond :

- **EB Garamond** (romain) pour le texte et les titres ;
- **EB Garamond Italic** pour les mots mis en valeur : `*astérisques*` dans `site.config.ts`, `<em>` dans les pages.
  Les capitales en italique prennent automatiquement les formes ornées d'**Adobe Garamond Italic Alternate** ;
- **Adobe Garamond Semibold Italic**, chiffres elzéviriens, pour les chiffres (classe `.figures`) ;
- le fleuron (classe `.ornament`, caractère `1`) comme élément décoratif.

Pour modifier les polices : remplacer les fichiers de `brand/fonts/` puis lancer `python3 scripts/build-fonts.py`.
