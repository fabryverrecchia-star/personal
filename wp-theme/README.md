# Orbe — thème WordPress portfolio agence (ThemeForest)

Thème portfolio immersif : scènes Three.js, navigation WebGL, grille de projets WebGL,
scroll fluide, curseur, préchargement et transitions — tout réglable dans le Customizer.

```
wp-theme/
├── orbe/                    # le thème (dossier installé dans wp-content/themes)
│   ├── src/js/              # sources JS non minifiées (exigé par Envato)
│   │   ├── main.js          # bundle léger : scroll Lenis, menu, curseur, révélations, transitions
│   │   ├── webgl.js         # bundle Three.js, chargé seulement si un effet WebGL est actif
│   │   └── webgl/           # hero.js (blob, particules, dégradé), nav.js, grid.js
│   ├── assets/js/           # bundles générés (npm run build)
│   ├── assets/css/          # main.css, fonts.css, editor.css
│   ├── inc/                 # options, Customizer, enqueue, menu-images, TGMPA…
│   └── template-parts/      # hero, work-grid, page-header, content…
├── orbe-core/               # plugin compagnon : type « Projet », catégories, champs
├── build.mjs                # esbuild : src/js → assets/js
└── package.mjs              # dist/orbe.zip (+ plugin zippé pour TGMPA)
```

## Commandes

```bash
npm install
npm run build     # compile les JS
npm run watch     # recompile à chaque modification
npm run package   # build + dist/orbe.zip et dist/orbe-core.zip
```

## Options (Apparence → Personnaliser → Orbe Options)

| Section | Réglages |
|---|---|
| Couleurs & typo | schéma clair/sombre, fond, texte, accent, paire de polices |
| Hero (WebGL) | scène (blob liquide, sphère de particules, dégradé fluide, aucune), titre, sous-titre, 2 couleurs, intensité, réaction à la souris |
| Navigation (WebGL) | plein écran WebGL / plein écran simple / menu classique, distorsion (vague, RGB, liquide), intensité |
| Grille de projets | titre, disposition (éparse, grille, liste), nombre, bascule grille/liste, WebGL on/off, intensité |
| Mouvement | scroll fluide, curseur, préchargement, transitions de page |
| Pied de page | appel à l'action, e-mail, réseaux (`Label|URL` par ligne), copyright |

Images du menu WebGL : image à la une de la page/projet lié, ou URL saisie sur l'élément
de menu (Apparence → Menus).

## Points ThemeForest déjà traités

- Contenu « plugin territory » (type Projet, champs) dans **Orbe Core**, proposé via TGMPA.
- Échappement / sanitization partout ; WordPress Coding Standards (PHPCS) passés
  (seules restent les alertes sur les noms `single-orbe_project.php`, imposés par la hiérarchie de templates).
- Prêt pour la traduction : `languages/orbe.pot`, `orbe-core/languages/orbe-core.pot`.
- Pas de dépendance à licence non-GPL (GSAP volontairement évité) ; polices OFL.
- Repli propre sans WebGL, sans JS ou avec « réduire les animations ».

## Reste à faire avant soumission

- [ ] Démo en ligne + import de démo (One Click Demo Import : XML, widgets, Customizer)
- [ ] Documentation HTML acheteur (Envato l'exige)
- [ ] Images de démo libres de droits / visuels de présentation (590×300, 80×80)
- [ ] Traduction FR (.po/.mo), tests navigateurs réels (Safari, Firefox, mobile)
- [ ] Pages modèles supplémentaires (À propos, Contact, Services) et patterns de blocs
