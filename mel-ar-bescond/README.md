# Mel Ar Bescond

Site vitrine et demande de commande du miel **Mel Ar Bescond**, récolté à Louargat (Côtes-d’Armor) par Nathalie et Frédéric Baltzer.
Astro + GSAP (ScrollTrigger, SplitText) + Lenis + OGL (images en WebGL). Direction éditoriale sobre : ivoire et encre, photographie, aucune illustration ajoutée en dehors de l’identité (logo, monogramme).

## Démarrer

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # site statique dans dist/
npm run preview:file   # site prêt à mettre en ligne : artifact/mel-ar-bescond-site/ (index.html + videos/ + frames/)
                       # et artifact/mel-ar-bescond.html (version artefact)
```

## Ce qu’il y a dans la page

| Section | Mouvement |
| --- | --- |
| Ouverture | sur fond blanc, le monogramme NF se compose au rythme du chargement (contour tracé, puis rempli d’encre), « Mel ar Bescond » apparaît dessous, puis le rideau se lève sur le site |
| Hero | la vidéo du rucher (slide 1) et 3 photos du shooting, en plein écran (WebGL, transition liquide, léger suivi de la souris), grand titre révélé ligne par ligne, navigation par barres de progression ; au défilement la photo se resserre en cadre |
| Promesse | les mots s’éclairent au fil de la lecture |
| La maison | photos en WebGL : révélation organique, parallaxe, courbure au défilement, ondulation au survol |
| Entre terre et mer | la vague arrive quand on descend et repart quand on remonte (séquence d’images pilotée par le défilement, `public/frames/mer/`), la Côte de Granit Rose toute proche |
| La récolte | deux saisons en très grand ; au survol, une photo suit le curseur |
| Commander | une ligne par miel, une case par contenance ; le panier se compose avec les photos des pots |
| Le terroir, pied de page | vidéo des apiculteurs dans la fumée, faits du lieu-dit, grand logo |

Sur ordinateur, les photos sont redessinées en WebGL par `src/scripts/gl.ts` sur un canvas fixe calé sur les `<figure data-gl>`. Sur téléphone, pas de WebGL : images et vidéos natives, transitions en rideau (fluidité, lecture fiable sur iPhone).

Défilement doux Lenis à la molette ; au doigt, défilement natif du téléphone. Si l’utilisateur a activé « réduire les animations », Lenis, l’ouverture et les boucles sont désactivés.

## Modifier le contenu

- **Coordonnées, e-mail des demandes** : `src/site.config.ts`. ⚠️ `email` est une adresse provisoire : c’est là que partent les demandes.
- **Produits, prix, épuisés** : `src/data/products.ts`. `null` = épuisé.
- **Textes** : dans chaque composant de `src/components/`. Les textes de présentation ont été rédigés à partir du brand kit et sont à relire par Nathalie et Frédéric.

## Demande de commande (pas d’e-commerce)

Pas de paiement ni de compte client : le visiteur compose son panier, laisse son nom et son téléphone, et envoie une **demande**. Nathalie et Frédéric le rappellent pour convenir du retrait.

- Les demandes partent directement à **frederic.baltzer@gmail.com** via [FormSubmit](https://formsubmit.co) (gratuit, sans serveur ni compte). Réglage : `email` et `formEndpoint` dans `src/site.config.ts`.
- ⚠️ **Activation, une seule fois** : au tout premier envoi depuis le site en ligne, FormSubmit envoie à frederic.baltzer@gmail.com un e-mail « Activate Form ». Il faut cliquer sur le lien : les demandes suivantes arrivent ensuite normalement (vérifier aussi les spams).
- En cas d’échec (connexion coupée), le visiteur peut réessayer ou copier le message tout prêt et l’envoyer lui-même.
- Le panier est gardé dans le navigateur (`localStorage`) et vidé après un envoi réussi.

## Photos

Les photos du shooting sont dans `brand/shooting/` et `src/assets/photos/` : `duo`, `rayon`, `ruche`, `fleur`, `abeille`, `texture`. Pour en changer, on remplace le fichier en gardant le nom (jpg, png, webp ou avif) ; `src/lib/photos.ts` prend automatiquement la photo du shooting, sinon un recadrage du brand kit.

| Nom | Emplacement |
| --- | --- |
| vidéo `rucher`, `rayon`, `ruche`, `fleur` | diaporama du hero (dans cet ordre) |
| `duo` / `texture` | « La maison » (grande / petite photo) |
| `fleur` / `abeille` | saisons Printemps / Été |
| `rucher-poster`, `fumee-poster` | images d’attente des vidéos (affichées si le téléphone bloque la lecture automatique) |
| `pot-seul` (sinon `pot`) | vignette des pots dans le panier |

Astro génère les versions optimisées au build.

Vidéos (`public/videos/`, MP4 H.264 + WebM VP9, sans son, sans parallaxe) : `rucher` (slide 1 du hero) et `fumee` (bandeau du terroir). Elles ne se lisent qu’à l’écran ; si le téléphone bloque la lecture automatique (iPhone en économie d’énergie), l’image d’attente reste affichée et la vidéo démarre au premier toucher.

## Identité

`brand/kit/` contient le brand kit d’origine. `npm run brand` régénère :
- `src/assets/svg/` : logo (un tracé par lettre, pour l’animation), emblème, abeille, monogramme, hermine, carte de Bretagne, vectorisés depuis le kit (`scripts/vectorize.mjs`) ;
- `src/assets/photos/` : les recadrages provisoires (`scripts/crops.mjs`).

`node scripts/monogram.mjs` régénère le monogramme NF affiné du préloader (`src/assets/svg/monogram-fine.svg`).

Polices : Cormorant (titres et texte) et Exo 2 (petites capitales), auto-hébergées via Fontsource.

