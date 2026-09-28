# 18H22 × Client — Media planning

Site statique, mobile first, pour présenter le planning des publications à un client.
Aucune compilation : ouvrir `index.html` via un petit serveur (`npx http-server media-plan`).

- `index.html?c=<slug>` charge `clients/<slug>/plan.js` (par défaut `agata`).
- Nouveau client : dupliquer `clients/agata`, remplacer les médias, le logo (`client.logo`) et le texte de `plan.js`.
- Une semaine = 4 publications (`post`, `carousel`, `reel`). Le reel s'ouvre en plein écran avec une animation de zoom.
- Logo 18H22 : `assets/brand/18h22-mark.svg` (plein) et `18h22-mark-stroke.svg` (tracé, utilisé pour l'animation du préchargement).
