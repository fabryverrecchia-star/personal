# 18H22 × Client — Media planning

Client actuel : **Jacqueline** (`clients/jacqueline`). Les photos de `media/` sont extraites de la maquette : remplacer par les originaux en gardant les mêmes noms.

Site statique, mobile first, pour présenter le planning des publications à un client.
Aucune compilation : ouvrir `index.html` via un petit serveur (`npx http-server media-plan`).

- `index.html?c=<slug>` charge `clients/<slug>/plan.js` (par défaut `jacqueline`).
- Nouveau client : dupliquer `clients/jacqueline`, remplacer les médias, le logo (`client.logo`) et le texte de `plan.js`.
- Une semaine = 4 publications (`post`, `carousel`, `reel`). Le reel s'ouvre en plein écran avec une animation de zoom.
- Propositions : un `post` avec `options: ['a.jpg', 'b.jpg']` affiche un seul visuel et des vignettes A / B / C pour choisir (un seul sera publié).
- Logo 18H22 : `assets/brand/18h22-mark.svg` (plein) et `18h22-mark-stroke.svg` (tracé, utilisé pour l'animation du préchargement).
