# Analyse — joffreyspitzer.com

> Le site n'était pas accessible depuis l'environnement de travail (réseau restreint).
> Cette analyse s'appuie sur les sources publiques : Codrops (fév. 2026), Awwwards, landing.love.

## Ce qui fait l'identité du site

| Élément | Description |
|---|---|
| Direction | Minimaliste et retenue, avec une pointe brutaliste : mises en page calmes, gestes bruts et directs |
| Typo | Une seule sans-serif (PP Neue Montreal), grands titres serrés, petits libellés discrets |
| Accroche | « Fine-tuned aesthetics, faultless experience — crafted with restraint, engineered with rigor » |
| Loader | Compteur 0 → 100 à l'arrivée |
| Projets | Bascule **grille / liste** animée (GSAP Flip) ; études de cas Merrell, Aerleum, Ambrosia, H. Blanck |
| Mouvement | Révélations de texte ligne par ligne, masques sur les images, transitions de page, défilement fluide |

## Stack d'origine

Astro · GSAP · Lenis · Three.js (WebGL) · Swup (transitions) · Tailwind · Prismic (CMS) · Netlify

## Ce qui a été amélioré dans notre base

| Sujet | Démo | Notre base |
|---|---|---|
| Transitions de page | Swup (librairie supplémentaire) | Routeur natif d'Astro (`ClientRouter`) + GSAP : une dépendance en moins |
| WebGL | Three.js chargé partout (~150 ko gz) | Retiré de la base ; à n'ajouter que si un effet le justifie, et uniquement sur la page concernée |
| CSS | Tailwind | CSS natif avec variables (tokens) : plus léger et plus lisible pour une identité sur mesure |
| Contenu | Prismic (service externe) | Fichiers Markdown typés (content collections) : gratuit, versionné, rapide ; migrable vers un CMS plus tard |
| Images | — | `astro:assets` : AVIF/WebP, `srcset` responsive, lazy-loading, `fetchpriority` pour la première image |
| Polices | Commerciales | EB Garamond Italic variable (1 fichier pour toutes les graisses) + préchargement + `font-display: swap` |
| Accessibilité | — | `prefers-reduced-motion` respecté (pas de Lenis ni d'animations), lien d'évitement, focus visible, `aria-pressed` sur la bascule |
| Sans JavaScript | — | Contenu entièrement visible ; le loader n'existe que si le JS est actif (`@media (scripting: enabled)`) |
| Thème | Clair | Clair + sombre automatique (`prefers-color-scheme`) |

Poids actuel : ~62 ko gz de JS au total (GSAP + Flip + ScrollTrigger + SplitText + Lenis), ~3 ko de HTML par page.

## Pistes pour la suite

- Survol des lignes en vue liste : aperçu de l'image qui suit le curseur
- Effet WebGL léger (déformation d'image au survol) chargé à la demande
- Page projet : galerie, vidéos, crédits
- Version anglaise (i18n Astro)
