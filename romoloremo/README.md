# Romolo & Remo — landing page

Landing page de présentation du branding **Romolo & Remo** (Osteria Dinamica, Paris 6e).
Art direction **Fabrizio Verrecchia × Abysse Lab Paris**.

## Lancer

Aucun build : servir le dossier en HTTP (les textures WebGL exigent une origine http).

```bash
cd romoloremo && python3 -m http.server 8000
# → http://localhost:8000
```

En `file://`, la page reste fonctionnelle : les photos repassent en images DOM (révélation CSS).

## Séquence

| # | Section | Animation |
|---|---------|-----------|
| 00 | Intro / hero | Crédit « Art direction Fabrizio Verrecchia × Abysse Lab » → les particules WebGL composent le pictogramme (échantillonné depuis ses tracés SVG) → le logotype se dessine au trait. Au scroll, le pictogramme se disperse. |
| 01 | Héritage romain | Mots qui s'allument au scroll, parallaxe |
| 02 | La louve, sans le cliché | Révélation « encre » du pictogramme |
| 03 | ADN | Pin : Mouvement, Hospitalité, Désirabilité |
| 04 | Un lieu traversant | Pin : **la louve marche** du 12 rue Dauphine au 9 rue de Nevers — pattes articulées en shader, pilotées par le scroll |
| 05 | Couleurs | Nuancier qui se déploie |
| 06 | Logotype & symbole | Tracés dessinés puis remplis |
| 07 | Romolo / Remo | Pin : les deux noms se rejoignent autour de la clé |
| 08 | Art direction | Galerie horizontale épinglée, images WebGL courbées selon la vitesse |
| 09 | Processus | Brouillons |
| — | Grazie / Merci | Crédits & contact |

Mêmes animations sur desktop et mobile.

### Smooth scroll

- Lenis (`js/main.js`, objet `SCROLL`) : molette amortie (`lerp` 0.072, molette à 0.85), inertie tactile longue (`syncTouch`), actif même avec « Réduire les animations ».
- Clavier : flèches, espace, Page ↑/↓, Début/Fin glissent avec un easing expo.
- L'indicateur « Scroll » du hero amène en douceur à la section 01.
- Toutes les animations liées au scroll ont un `scrub` avec inertie (0.8 à 1.2 s) : elles suivent le défilement sans à-coups.

## Structure

- `index.html`, `css/style.css`
- `js/gl.js` — moteur WebGL sans dépendance (particules, louve, plans image)
- `js/main.js` — Lenis + GSAP ScrollTrigger / SplitText
- `js/paths.js` — tracés vectoriels extraits du brandbook (généré par `scripts/svg-to-js.py` depuis `assets/*.svg`)
- `vendor/` — GSAP 3.15, Lenis 1.3 (copies locales)
