# Mel Ar Bescond

Site vitrine et demande de commande du miel **Mel Ar Bescond**, récolté à Louargat (Côtes-d’Armor) par Nathalie et Frédéric Baltzer.
Astro + GSAP (ScrollTrigger, SplitText) + Lenis. Direction éditoriale sobre : ivoire et encre, photographie, aucune illustration ajoutée en dehors de l’identité (logo, monogramme).

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
| Ouverture | le logo apparaît lettre par lettre, un filet se trace, le rideau se lève |
| Hero | grand logo, puis la photo s’ouvre en plein écran au défilement |
| Promesse | les mots s’éclairent au fil de la lecture |
| La maison | photos dévoilées en rideau, parallaxe douce |
| La récolte | deux saisons en très grand ; au survol, une photo suit le curseur |
| Commander | une ligne par miel, une case par contenance ; le panier se compose avec les photos des pots |
| Le terroir, pied de page | faits du lieu-dit, grand logo |

Défilement doux Lenis aussi au tactile (`syncTouch`). Si l’utilisateur a activé « réduire les animations », Lenis, l’ouverture et les boucles sont désactivés.

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

Il suffit de déposer un fichier dans `src/assets/photos/` avec l’un des noms ci-dessous (jpg, png, webp ou avif) : il remplace automatiquement le recadrage provisoire tiré du brand kit (`src/lib/photos.ts`).

| Nom | Emplacement | Photo du shooting conseillée |
| --- | --- | --- |
| `hero` (ou `duo`) | grande photo d’ouverture | les deux apiculteurs devant la ruche |
| `recolte` | grande photo « La maison » | le couteau dans le cadre de miel |
| `ruche` | petite photo « La maison » et grand bandeau du terroir | gros plan des cadres et des abeilles |
| `fleur` | saison Printemps | abeille sur une fleur de prunier |
| `ete` | saison Été | au choix |
| `terroir` | grand bandeau du terroir (sinon `ruche`) | paysage, ruches |
| `pot-seul` | vignette des pots dans le panier | un pot seul, de face |
| `apiculteurs`, `cuillere`, `filet`, `tamis`, `pot`, `pot2` | recadrages actuels du brand kit | à remplacer si besoin |

Astro génère les versions optimisées au build.

## Identité

`brand/kit/` contient le brand kit d’origine. `npm run brand` régénère :
- `src/assets/svg/` : logo (un tracé par lettre, pour l’animation), emblème, abeille, monogramme, hermine, carte de Bretagne, vectorisés depuis le kit (`scripts/vectorize.mjs`) ;
- `src/assets/photos/` : les recadrages provisoires (`scripts/crops.mjs`).

Polices : Cormorant (titres et texte) et Exo 2 (petites capitales), auto-hébergées via Fontsource.

Le grand bandeau du terroir n’apparaît qu’avec une photo du shooting : les recadrages du brand kit sont trop petits pour ce format.
