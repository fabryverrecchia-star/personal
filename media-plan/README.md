# 18H22 × La Petite Maison — Media planning

Site mobile first pour présenter le planning des publications au client.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur.

- `index.html` ouvre La Petite Maison (`?c=la-petite-maison`).
- Contenu des posts : `clients/la-petite-maison/plan.js` (planning du mois dans `months`, feed déjà en ligne dans `feedExisting`, reel, couleurs, polices).
- Commentaires sous chaque post : gardés sur le téléphone du client, envoyés en un récapitulatif (WhatsApp).

## Jours de passage et missions en cours

Partagés entre tous les visiteurs, stockés dans `clients/la-petite-maison/data/suivi.json`
et modifiés via `clients/la-petite-maison/suivi.php`.

Ce qu'il faut côté hébergement :
- PHP 7.4 ou plus (tout hébergement mutualisé classique convient).
- Le dossier `clients/la-petite-maison/data/` doit être accessible en écriture par PHP (droits 755 ou 775 selon l'hébergeur, fichier `suivi.json` en 664).
- Apache lit `data/.htaccess` qui bloque l'accès direct au fichier. Sur Nginx, ajouter une règle `location ~ /data/ { deny all; }`.

Mode équipe (Fabrizio, Jade) :
- Toucher le bouton flottant « Espace équipe » en bas à droite, puis choisir Rendez-vous (calendrier) ou Tâche (missions) : la page descend au formulaire. « Fermer l'espace équipe » dans le même menu.
- Saisir le code équipe (une fois par appareil). Formulaire pour ajouter une mission (publiée par Fabrizio ou Jade) ou un passage ;
  sur chaque ligne, le crayon modifie, la croix supprime, et toucher l'état fait avancer la mission (À venir → En cours → Livré).
- Inspiration du mois : menu Espace équipe → Inspiration, coller un lien Instagram (reel, carrousel ou post). Le bouton bleu « Inspiration du mois » apparaît pour le client dès qu'il y a au moins un lien.
- Changer le code : `php -r 'echo password_hash("nouveau-code", PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`.

Sans PHP (aperçu statique), la page lit `data/suivi.json` et les modifications restent sur l'appareil.
