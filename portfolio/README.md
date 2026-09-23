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
├── public/fonts/          # ← déposer les polices ici (voir le README du dossier)
├── brand/                 # ← logo, couleurs, textes de marque
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

Dans `site.config.ts`, les mots entourés d'`*astérisques*` dans l'accroche s'affichent en **EB Garamond Italic**.
Dans les pages, la balise `<em>` produit le même effet.
