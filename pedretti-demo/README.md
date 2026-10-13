# Démo WebGL · Stefano Pedretti

Page unique en Three.js : au défilement, des particules composent le logo
(visage pixel art, « STEFANO PEDRETTI », « COMEDY DIRECTOR & MORE »), puis le
logo éclate et la caméra traverse un couloir d'images de projets en perspective.
À la fin, le logo se recompose.

## Lancer

Les images sont chargées en WebGL, il faut donc un petit serveur local :

```sh
cd pedretti-demo
python3 -m http.server 8000
# puis http://localhost:8000
```

## Remplacer les visuels

Les images de `images/` sont des visuels de remplacement générés par
`scripts/make-placeholders.py`. Pour mettre les vrais projets :

1. Déposer les images dans `images/` (format 16:10 conseillé, ~1200 px de large).
2. Modifier le tableau `PROJECTS` en haut du script de `index.html`
   (fichier, titre, type, année). Le nombre de projets est libre.

## Réglages

- `T` dans `index.html` : chronologie du défilement (composition, éclatement,
  couloir, recomposition), en fraction de la page.
- `#scroll { height: 900vh }` : longueur totale du défilement.
- En portrait (mobile), le logo est réorganisé : visage en haut, nom et métier
  empilés dessous.
- La souris repousse les particules du logo et met en couleur l'image survolée.
