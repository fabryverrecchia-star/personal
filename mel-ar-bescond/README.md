# Mel Ar Bescond

Site vitrine et demande de commande du miel **Mel Ar Bescond**, récolté à Louargat (Côtes-d’Armor) par Nathalie et Frédéric Baltzer.
Astro + GSAP (ScrollTrigger, SplitText) + Lenis + OGL (images en WebGL). Direction éditoriale sobre : ivoire et encre, photographie, aucune illustration ajoutée en dehors de l’identité (logo, monogramme).

## Démarrer

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # site statique dans dist/
npm run preview:file   # page autonome artifact/mel-ar-bescond.html (aperçu à partager)
```

## Ce qu’il y a dans la page

| Section | Mouvement |
| --- | --- |
| Ouverture | sur fond blanc, le monogramme NF se compose au rythme du chargement (contour tracé, puis rempli d’encre), « Mel ar Bescond » apparaît dessous, puis le rideau se lève sur le site |
| Hero | les 4 photos du shooting en plein écran (WebGL, transition liquide, léger suivi de la souris), grand titre révélé ligne par ligne, navigation par barres de progression ; au défilement la photo se resserre en cadre |
| Promesse | les mots s’éclairent au fil de la lecture |
| La maison | photos en WebGL : révélation organique, parallaxe, courbure au défilement, ondulation au survol |
| La récolte | deux saisons en très grand ; au survol, une photo suit le curseur |
| Commander | une ligne par miel, une case par contenance ; le panier se compose avec les photos des pots |
| Le terroir, pied de page | faits du lieu-dit, grand logo |

Toutes les photos (sauf les vignettes du panier) sont redessinées en WebGL par `src/scripts/gl.ts` sur un canvas fixe calé sur les `<figure data-gl>` ; sans WebGL, les images normales s’affichent.

Défilement doux Lenis à la molette ; au doigt, défilement natif du téléphone. Si l’utilisateur a activé « réduire les animations », Lenis, l’ouverture et les boucles sont désactivés.

## Modifier le contenu

- **Coordonnées, e-mail des demandes** : `src/site.config.ts`. ⚠️ `email` est une adresse provisoire : c’est là que partent les demandes.
- **Produits, prix, épuisés** : `src/data/products.ts`. `null` = épuisé.
- **Textes** : dans chaque composant de `src/components/`. Les textes de présentation ont été rédigés à partir du brand kit et sont à relire par Nathalie et Frédéric.

## Demande de commande (pas d’e-commerce)

Pas de paiement ni de compte client : le visiteur compose son panier, laisse son nom et son téléphone, et envoie une **demande**. Nathalie et Frédéric le rappellent pour convenir du retrait.

- Le panier est gardé dans le navigateur (`localStorage`).
- « Envoyer ma demande » ouvre la messagerie du visiteur avec un récapitulatif (pots, estimation, nom, téléphone, mode de retrait) adressé à `site.email`.
- Pour recevoir les demandes sans passer par la messagerie du visiteur, il suffira de brancher le formulaire sur un service (Formspree, Netlify Forms…) dans `src/scripts/cart.ts`.

## Photos

Les photos du shooting sont dans `brand/shooting/` et `src/assets/photos/` : `duo`, `recolte`, `ruche`, `fleur`. Pour en changer, on remplace le fichier en gardant le nom (jpg, png, webp ou avif) ; `src/lib/photos.ts` prend automatiquement la photo du shooting, sinon un recadrage du brand kit.

| Nom | Emplacement |
| --- | --- |
| `duo`, `recolte`, `ruche`, `fleur` | diaporama du hero (dans cet ordre) |
| `duo` / `ruche` | « La maison » (grande / petite photo) |
| `fleur` / `ete` (sinon `recolte`) | saisons Printemps / Été |
| `terroir` (sinon `ruche`) | grand bandeau du terroir |
| `pot-seul` (sinon `pot`) | vignette des pots dans le panier |

Astro génère les versions optimisées au build.

## Identité

`brand/kit/` contient le brand kit d’origine. `npm run brand` régénère :
- `src/assets/svg/` : logo (un tracé par lettre, pour l’animation), emblème, abeille, monogramme, hermine, carte de Bretagne, vectorisés depuis le kit (`scripts/vectorize.mjs`) ;
- `src/assets/photos/` : les recadrages provisoires (`scripts/crops.mjs`).

`node scripts/monogram.mjs` régénère le monogramme NF affiné du préloader (`src/assets/svg/monogram-fine.svg`).

Polices : Cormorant (titres et texte) et Exo 2 (petites capitales), auto-hébergées via Fontsource.

Le grand bandeau du terroir n’apparaît qu’avec une photo du shooting : les recadrages du brand kit sont trop petits pour ce format.
