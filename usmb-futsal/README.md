# Tournoi futsal U17 — US Méné-Bré Louargat

Landing page statique du tournoi du mercredi 28 octobre 2026 (gymnase de Louargat, RDV 16h30, coup d'envoi 17h30), avec un formulaire d'inscription d'équipe.

## Envoi des inscriptions

Le formulaire envoie un e-mail à **usmenebre.ecoledefoot@gmail.com** via le service gratuit [FormSubmit](https://formsubmit.co) (`CONFIG.email` dans `assets/js/main.js`).

**Une seule fois** : après la mise en ligne, faites une inscription de test. FormSubmit envoie un e-mail « Activate Form » à cette adresse (vérifiez les spams) : cliquez le lien. Ensuite, chaque inscription arrive directement, et le responsable d'équipe reçoit une confirmation automatique.

Si l'envoi échoue, la page affiche le récapitulatif avec un bouton « Copier » et ouvre la messagerie.

## Mise à jour

Augmentez `?v=` dans `index.html` et `VERSION` dans `main.js`. `#diag` à la fin de l'adresse affiche l'état de la page.
