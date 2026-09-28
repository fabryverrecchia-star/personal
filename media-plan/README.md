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
- Ouvrir la page avec `&admin` à la fin de l'adresse, ou toucher trois fois « En coulisses » au-dessus des missions.
- Saisir le code équipe (une fois par appareil). On peut alors ajouter une mission en choisissant qui la publie,
  toucher son état pour la faire avancer (À venir → En cours → Livré), supprimer une mission ou un passage, ajouter un passage.
- Changer le code : `php -r 'echo password_hash("nouveau-code", PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`.

Sans PHP (aperçu statique), la page lit `data/suivi.json` et les modifications restent sur l'appareil.
