# Mel Ar Bescond

Site vitrine et demande de commande du miel **Mel Ar Bescond**, récolté à Louargat (Côtes-d’Armor) par Nathalie et Frédéric Baltzer.
Astro + GSAP (ScrollTrigger, SplitText, MotionPath) + Lenis + OGL (WebGL).

## Démarrer

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # site statique dans dist/
npm run preview:file   # page autonome artifact/mel-ar-bescond.html (aperçu à partager)
```

## Ce qu’il y a dans la page

| Section | Effet |
| --- | --- |
| Ouverture | alvéole qui se remplit de miel, compteur, rideau qui coule vers le haut |
| Hero | miel en WebGL qui coule du haut de l’écran, attiré par le curseur ou le doigt, qui s’allonge au défilement ; logo révélé lettre par lettre ; abeille en vol |
| Bandeau | défilement infini dont la vitesse suit celle du scroll |
| Manifeste | les mots s’éclairent au défilement, photos en pastilles dans le texte |
| La maison | photo en arche dévoilée avec parallaxe, signature |
| Engagements | défilement horizontal épinglé (aussi sur mobile) |
| La récolte | le fond change de teinte selon la saison, gouttes qui s’étirent |
| Cristallisation | section épinglée : le miel passe de liquide à cristallisé |
| Composez votre panier | pots en SVG (teinte, cristallisation) avec inclinaison 3D ; un clic sur une contenance envoie une goutte de miel vers une caisse en bois où le pot tombe ; un clic sur un pot de la caisse le retire |
| Pastille « Ma demande » | apparaît en bas d’écran dès qu’un pot est choisi, hors de la section panier |
| Tarifs, terroir, commande, pied de page | tableau des tarifs, carte de Bretagne, étapes, grand logo |

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
| `duo` | grande photo « La maison » | les deux apiculteurs devant la ruche |
| `ruche` | engagement « Production limitée » | gros plan des cadres et des abeilles |
| `fleur` | engagement « Locale », pastille du manifeste | abeille sur une fleur de prunier |
| `recolte` | engagement « Familiale », pastille du manifeste | le couteau dans le cadre de miel |
| `tarifs` | fond du tableau des tarifs | au choix |
| `apiculteurs`, `cuillere`, `filet`, `tamis`, `pot`, `pot2` | recadrages actuels du brand kit | à remplacer si besoin |

Astro génère les versions optimisées au build.

## Identité

`brand/kit/` contient le brand kit d’origine. `npm run brand` régénère :
- `src/assets/svg/` : logo (un tracé par lettre, pour l’animation), emblème, abeille, monogramme, hermine, carte de Bretagne, vectorisés depuis le kit (`scripts/vectorize.mjs`) ;
- `src/assets/photos/` : les recadrages provisoires (`scripts/crops.mjs`).

Polices : Cormorant (titres et texte), Pinyon Script (touches manuscrites), Exo 2 (petites capitales), toutes auto-hébergées via Fontsource.
