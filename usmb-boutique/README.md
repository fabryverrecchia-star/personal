# La boutique — US Méné-Bré Louargat

Landing page statique (HTML/CSS/JS, sans build) : collection Kappa du club, tarifs adulte / enfant, panier et **demande d'achat envoyée par e-mail**.

## Avant la mise en ligne

Dans `assets/js/main.js`, bloc `CONFIG` :

- `email` : l'adresse du club qui reçoit les demandes (**à remplacer**).

L'envoi passe par le service gratuit [FormSubmit](https://formsubmit.co) (aucun compte à créer) :

1. Mettez le site en ligne avec la bonne adresse.
2. Faites une première demande de test depuis le site.
3. FormSubmit envoie un e-mail **« Activate Form »** à l'adresse du club : cliquez le lien.
4. C'est fini : chaque demande arrive dans la boîte du club, et l'acheteur reçoit une copie de confirmation (`autoReponse`).

Si l'envoi échoue (service indisponible, adresse non configurée), la page affiche le récapitulatif avec un bouton « Copier » et ouvre la messagerie de l'acheteur.

## Catalogue et prix

Tout est dans `PRODUCTS` (début de `assets/js/main.js`) : nom, prix adulte, prix enfant (`null` = adulte uniquement), image. Les tailles sont dans `TAILLES`. La grille et le tableau des tarifs se mettent à jour tout seuls.

## Mettre à jour le site

Augmentez `?v=` dans `index.html` et `VERSION` dans `main.js` à chaque mise à jour (sinon Safari garde l'ancienne version en cache). `#diag` à la fin de l'adresse affiche l'état de la page.
