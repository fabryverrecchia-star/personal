# 18H22 × La Petite Maison — Media planning

Site mobile first pour présenter le planning des publications au client.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur (en ligne : `18h22.com/lpm/`).

- `index.html` ouvre La Petite Maison (`?c=la-petite-maison`).
- Contenu : `clients/la-petite-maison/plan.js` (planning du mois dans `months`, feed actuel de @lapetitemaison_paris dans `feedExisting`, couleurs, polices).
  Chaque post a un `id` : les modifications faites depuis l'espace équipe y sont rattachées.
- Jours de passage (calendrier + liste) et missions en cours, partagés entre tous les visiteurs.
- Commentaires sous chaque post : gardés sur le téléphone du client, envoyés en un récapitulatif (WhatsApp).
- Bouton « Inspiration du mois » : reels et carrousels Instagram ajoutés par l'équipe.

## Espace équipe (code riviera-9655)

Bouton flottant « Espace équipe » en bas à droite, puis le code (une fois par appareil, majuscules ou minuscules indifférentes).
Menu : Rendez-vous (calendrier des passages), Publications, Tâches, Inspiration.
- Formulaire « Modifier » en parties numérotées : date, visuel, texte.
- Équipe : Fabrizio (couleurs 18H22), Jade (couleurs La Petite Maison).
- Planning : en mode équipe, « Ajouter une publication » (fin du mois) crée le post et ouvre son formulaire. Changer une date, ajouter ou supprimer recharge la page (sans l'ouverture 18H22)
  pour remettre le planning, le feed et le calendrier dans l'ordre. Une publication du planning supprimée
  reste listée en mode équipe avec « Rétablir » ; une publication ajoutée puis supprimée est effacée.
- Photos et légendes : un bouton « Modifier » apparaît sous chaque post.
  - Posts : date et heure de publication.
  - Remplacer, ajouter (le post devient un carrousel) ou retirer des photos. La photo est réduite sur le téléphone avant l'envoi.
  - Format : n'importe quel post peut passer en « Vidéo (reel) », et revenir en photo (la vidéo reste gardée).
  - « Télécharger la vidéo » (mode équipe) sous chaque reel qui a une vidéo : le fichier envoyé, tel quel.
  - Reels : vidéo (MP4 ou MOV) et couverture. Après l'envoi, une image du début de la vidéo sert de couverture ;
    le curseur permet d'en choisir une autre (« Utiliser cette image »), ou « Importer une photo ».
    La couverture est l'image affichée dans le feed et sur le post avant lecture.
  - Titre et légende (un paragraphe par ligne).
  - « Revenir à l'original » efface les modifications et les fichiers envoyés. « Supprimer » (deux touchers) retire du planning.
- Rendez-vous : jours de passage (calendrier et liste), à ajouter, modifier ou supprimer.
- Tâche : missions en cours, publiées par Fabrizio ou Jade (crayon pour modifier, croix pour supprimer, toucher l'état pour avancer).
- Inspiration : ouvrir directement `…/?inspi`, coller un lien Instagram (reel, carrousel ou post). Le site récupère l'image, le compte
  et la légende (`insta.php`) et copie l'image dans `inspi/`. Si Instagram ne répond pas, le lecteur Instagram s'affiche à la place.

## Hébergement

Partagé entre tous les visiteurs via `clients/la-petite-maison/suivi.php`, stocké dans `clients/la-petite-maison/data/suivi.json`.
- PHP 7.4 ou plus.
- Dossiers accessibles en écriture par PHP (755 ou 775 selon l'hébergeur) : `data/` (fichier `suivi.json` en 664), `uploads/` (photos et vidéos envoyées), `inspi/`.
- `data/.htaccess` bloque l'accès direct aux données ; `uploads/.htaccess` et `inspi/.htaccess` empêchent d'y exécuter un script.
  Sur Nginx : `location ~ /data/ { deny all; }` et pas de PHP dans `uploads/` et `inspi/`.
- Taille des envois : les photos partent réduites (moins de 2 Mo). Pour les vidéos de reel, l'hébergement doit accepter des fichiers
  assez lourds (`upload_max_filesize` et `post_max_size` dans php.ini ou `.user.ini`, ex. 128M). La limite actuelle s'affiche dans le diagnostic.
- Vérifier l'installation : `clients/la-petite-maison/suivi.php?diag` (droits d'écriture, taille maximale d'envoi, curl).
- Changer le code : `php -r 'echo password_hash(strtoupper("nouveau-code"), PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`
  (le code actuel, haché en minuscules, reste accepté).

Sans PHP (aperçu statique), la page lit `data/suivi.json` et les modifications restent sur l'appareil (une vidéo n'y est gardée que le temps de la visite).
L'hébergement doit accepter les requêtes partielles (Range, standard sur Apache et Nginx) pour lire les vidéos sur iPhone et choisir la couverture.

## Mettre à jour un site déjà en ligne

Utiliser le zip « mise à jour » : il ne contient ni `data/`, ni `uploads/`, ni les images de `inspi/`, ni `config.php`
(seulement les `.htaccess` de protection de `uploads/` et `inspi/`).
Le décompresser par-dessus le dossier en ligne : le planning modifié, les photos, vidéos et le code équipe restent intacts.
