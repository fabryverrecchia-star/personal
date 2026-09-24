# Stages d'Automne — US Méné-Bré Louargat

Landing page statique (HTML/CSS/JS, sans build) qui présente les deux stages de la Toussaint 2026 et recueille les inscriptions.

- `index.html` — la page
- `assets/img/logo-usmb.svg` — l'écusson du club vectorisé (SVG, 3 aplats : noir, gris, blanc)
- `assets/css/style.css` — styles
- `assets/js/main.js` — animations (GSAP + ScrollTrigger + Lenis via CDN) et formulaire

## Avant la mise en ligne

Dans `assets/js/main.js`, bloc `CONFIG` :

- `email` : l'adresse du club qui reçoit les inscriptions (**à remplacer**). Le formulaire ouvre la messagerie du parent avec la demande pré-remplie.
- `endpoint` (facultatif) : URL d'un service de formulaire (Formspree, Getform, Make…) qui accepte un POST JSON. S'il est renseigné, l'inscription est envoyée directement.

## Tester en local

```sh
cd usmb-stages && python3 -m http.server 8000
# puis http://localhost:8000
```

Mise en ligne : déposer le dossier tel quel sur n'importe quel hébergement statique (Netlify, GitHub Pages, OVH…).
