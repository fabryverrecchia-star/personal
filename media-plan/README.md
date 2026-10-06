# 18H22 × Jacqueline — Media planning

Site mobile first pour présenter le planning des publications au client.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur (ex. `18h22.com/jacqueline/`).

- `index.html` ouvre Jacqueline (`?c=jacqueline`).
- Contenu : `clients/jacqueline/plan.js` (planning par mois dans `months`, couleurs, feed actuel du compte).
  Chaque post a un `id` : les modifications faites depuis l'espace équipe y sont rattachées.
- Propositions de visuel : un post avec `options: [...]` montre un seul visuel et des vignettes A / B / C ;
  le client choisit, un seul visuel sera publié.
- Ordre de la page : feed, posts du mois, retours du client, calendrier, missions en cours.
- Commentaires sous chaque post : gardés sur le téléphone du client, envoyés en un récapitulatif (WhatsApp).

## Espace équipe (code JACQ18H22)

Bouton flottant « Espace équipe » en bas à droite, puis le code (une fois par appareil, majuscules ou minuscules indifférentes).
Menu : Publications, Tâches, Inspiration. Équipe : Fabrizio, Manon, Clément.
- « Modifier la publication » sous chaque post, formulaire en parties : date et heure, visuel, texte.
- Visuel, trois formats :
  - Photo : remplacer, ajouter (le post devient un carrousel) ou retirer des photos.
  - Propositions A / B / C : remplacer, ajouter ou retirer une proposition. Une photo existante devient la proposition A.
  - Reel : vidéo MP4 ou MOV et couverture, choisie dans la vidéo ou importée.
  Les photos sont réduites sur le téléphone avant l'envoi.
- Titre et légende (un paragraphe par ligne).
- « Ajouter une publication » en fin de mois, « Supprimer » (deux touchers) ; une publication du planning supprimée
  reste listée en mode équipe avec « Rétablir ». Changer une date, ajouter ou supprimer recharge la page
  pour remettre le planning, le feed et le calendrier dans l'ordre.
- « Revenir à l'original » efface les modifications et les fichiers envoyés pour ce post.
- Tâches (missions en cours) et Inspiration (liens Instagram) : comme Sounds Like Paris.

## Hébergement

Partagé entre tous les visiteurs via `clients/jacqueline/suivi.php`, stocké dans `clients/jacqueline/data/suivi.json`.
- PHP 7.4 ou plus.
- Dossiers accessibles en écriture par PHP (755 ou 775 selon l'hébergeur) : `data/` (fichier `suivi.json` en 664), `uploads/` (photos et vidéos envoyées), `inspi/`.
- `data/.htaccess` bloque l'accès direct aux données ; `uploads/.htaccess` et `inspi/.htaccess` empêchent d'y exécuter un script.
  Sur Nginx : `location ~ /data/ { deny all; }` et pas de PHP dans `uploads/` et `inspi/`.
- Vidéos de reel : l'hébergement doit accepter des fichiers assez lourds (`upload_max_filesize` et `post_max_size`, ex. 128M).
- Vérifier l'installation : `clients/jacqueline/suivi.php?diag` (droits d'écriture, taille maximale d'envoi).
- Changer le code : `php -r 'echo password_hash(strtoupper("nouveau-code"), PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`.

Sans PHP (aperçu statique), les modifications restent sur l'appareil.

## Mettre à jour un site déjà en ligne

Utiliser le zip « mise à jour » : il ne contient ni `data/`, ni `uploads/`, ni `inspi/`, ni `config.php`.
Le décompresser par-dessus le dossier en ligne : le planning modifié, les photos, vidéos et le code équipe restent intacts.
