# 18H22 × Enza Famiglia — Media planning

Site mobile first pour présenter le planning des publications au client.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur.

- `index.html` ouvre Enza Famiglia (`?c=enza-famiglia`).
- Ordre de la page : missions en cours et avancement global, puis le media planning (feed, posts du mois), puis le calendrier des passages.
- Contenu des posts : `clients/enza-famiglia/plan.js` (planning du mois dans `months`, feed déjà en ligne dans `feedExisting`, couleurs, polices).
  Posts en production (`wip: true`) : fac-similé « Visuel bientôt disponible » et pastille « En cours » dans le feed. Remplacer le fichier dans `media/`, le chemin dans `plan.js` et retirer `wip`.
- Commentaires sous chaque post : gardés sur le téléphone du client, envoyés en un récapitulatif (WhatsApp).
- « Enza 8e » s'affiche toujours en vert sauge dans les missions (`suivi.highlight` dans `plan.js`).

## Missions, avancement et jours de passage

Partagés entre tous les visiteurs, stockés dans `clients/enza-famiglia/data/suivi.json`
et modifiés via `clients/enza-famiglia/suivi.php`.

Ce qu'il faut côté hébergement :
- PHP 7.4 ou plus (tout hébergement mutualisé classique convient).
- Le dossier `clients/enza-famiglia/data/` doit être accessible en écriture par PHP (droits 755 ou 775 selon l'hébergeur, fichier `suivi.json` en 664).
- Apache lit `data/.htaccess` qui bloque l'accès direct au fichier. Sur Nginx, ajouter une règle `location ~ /data/ { deny all; }`.

Mode équipe (Fabrizio, Carlotta, Sixte ; couleurs dans `suivi.colors` de `plan.js`) :
- Toucher le bouton flottant « Espace équipe » en bas à droite, puis choisir Tâche (missions), Avancement ou Rendez-vous (calendrier). « Fermer l'espace équipe » dans le même menu.
- Saisir le code équipe (une fois par appareil, le même que pour La Petite Maison).
- Avancement : les boutons 0, 25, 50, 75, 100 % apparaissent sous la barre.
- Missions : le crayon modifie, la croix supprime, toucher l'état fait avancer la mission (À venir → En cours → En attente de retour → Livré).
- Changer le code : `php -r 'echo password_hash("nouveau-code", PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`.

Sans PHP (aperçu statique), la page lit `data/suivi.json` et les modifications restent sur l'appareil.
