# 18H22 × Sounds Like Paris — Media planning

Site mobile first pour présenter le planning des publications au client.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur (ex. `18h22.com/sounds-like-paris/`).

- `index.html` ouvre Sounds Like Paris (`?c=sounds-like-paris`).
- Contenu : `clients/sounds-like-paris/plan.js` (planning du mois dans `months`, campagnes sponsorisées dans `ads`, couleurs, polices).
  Chaque post et chaque campagne a un `id` : les modifications faites depuis l'espace équipe y sont rattachées.
- Ordre de la page : feed, posts du mois, campagnes sponsorisées, retours du client, calendrier, missions en cours.
- Pas de passage prévu pour ce client (`suivi.passages: false`) : le calendrier montre seulement les publications et les campagnes sponsorisées
  (bande dorée du début à la fin de chaque campagne). Toucher une ligne descend au post ou à la campagne.
- Commentaires sous chaque post : gardés sur le téléphone du client, envoyés en un récapitulatif (WhatsApp).

## Campagnes sponsorisées

Deux campagnes par mois (`ads.campaigns`), budget indicatif mensuel `ads.budget` (380 €), partagé à parts égales
si une campagne n'a pas de `budget`. La barre montre le dépensé (plein), le budget engagé sur les campagnes (doré clair)
et le reste. Tant que l'équipe n'a pas saisi le dépensé réel, il est estimé au prorata des jours de diffusion (mention « estimé »).
L'état (Prévue, En cours, Terminée) suit les dates, sauf s'il est choisi à la main.

## Espace équipe (code MANCLEM)

Bouton flottant « Espace équipe » en bas à droite, puis le code (une fois par appareil, majuscules ou minuscules indifférentes).
- Photos et légendes : un bouton « Modifier » apparaît sous chaque post et chaque campagne.
  - Remplacer, ajouter (le post devient un carrousel) ou retirer des photos. La photo est réduite sur le téléphone avant l'envoi.
  - Format : n'importe quel post peut passer en « Vidéo (reel) », et revenir en photo (la vidéo reste gardée).
  - Reels : vidéo (MP4 ou MOV) et couverture. Après l'envoi, une image du début de la vidéo sert de couverture ;
    le curseur permet d'en choisir une autre (« Utiliser cette image »), ou « Importer une photo ».
    La couverture est l'image affichée dans le feed et sur le post avant lecture.
  - Titre et légende (un paragraphe par ligne).
  - Campagnes : dates, budget, dépensé réel, état.
  - « Revenir à l'original » efface les modifications et les fichiers envoyés.
- Tâche (missions) et Inspiration (liens Instagram) : comme les autres plannings.

## Hébergement

Partagé entre tous les visiteurs via `clients/sounds-like-paris/suivi.php`, stocké dans `clients/sounds-like-paris/data/suivi.json`.
- PHP 7.4 ou plus.
- Dossiers accessibles en écriture par PHP (755 ou 775 selon l'hébergeur) : `data/` (fichier `suivi.json` en 664), `uploads/` (photos et vidéos envoyées), `inspi/`.
- `data/.htaccess` bloque l'accès direct aux données ; `uploads/.htaccess` et `inspi/.htaccess` empêchent d'y exécuter un script.
  Sur Nginx : `location ~ /data/ { deny all; }` et pas de PHP dans `uploads/` et `inspi/`.
- Taille des envois : les photos partent réduites (moins de 2 Mo). Pour les vidéos de reel, l'hébergement doit accepter des fichiers
  assez lourds (`upload_max_filesize` et `post_max_size` dans php.ini ou `.user.ini`, ex. 128M). La limite actuelle s'affiche dans le diagnostic.
- Vérifier l'installation : `clients/sounds-like-paris/suivi.php?diag` (droits d'écriture, taille maximale d'envoi, curl).
- Changer le code : `php -r 'echo password_hash(strtoupper("nouveau-code"), PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`.

Sans PHP (aperçu statique), la page lit `data/suivi.json` et les modifications restent sur l'appareil (une vidéo n'y est gardée que le temps de la visite).
L'hébergement doit accepter les requêtes partielles (Range, standard sur Apache et Nginx) pour lire les vidéos sur iPhone et choisir la couverture.
