# 18H22 × La Petite Maison — Media planning

Site mobile first pour présenter le planning des publications au client.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur (en ligne : `18h22.com/lpm/`).

- `index.html` ouvre La Petite Maison (`?c=la-petite-maison`).
- Contenu : `clients/la-petite-maison/plan.js` (planning du mois dans `months`, feed actuel de @lapetitemaison_paris dans `feedExisting`, couleurs, polices).
  Chaque post a un `id` : les modifications faites depuis l'espace équipe y sont rattachées.
- Ouverture 18H22 une fois par jour (`introDaily: true`) : aux visites suivantes de la journée, la page s'ouvre directement
  (`?intro` la rejoue).
- Grand opening : compte à rebours jusqu'au 19 novembre (`countdown` dans `plan.js`, heure de Paris), juste après le logo.
- Idées teasing (`teasing` dans `plan.js`) : trois idées, chacune avec ses points « À trancher ». En mode équipe, « Modifier l'idée »
  (titre, texte, points à trancher, « Revenir à la première version ») et « Argumenter » (arguments signés Fabrizio ou Jade, datés).
  Gardé dans `data/suivi.json` (rubrique `edits`, `teasing-<id>`).
  Inspirations : seulement le bouton « Voir dans le coin inspi » (aucun lien vers un compte extérieur).
  Tempo : chaque idée a un jour de tournage (`shoot`), de publication (`publish`) et un rythme facultatif (`rhythm`),
  repris dans « Le tempo » (frise jusqu'au grand opening, J-n) et modifiables dans « Modifier l'idée ».
- Ouverture directe (`intro: false`, `heroCompact: true`, `noScrollAnim: true`) : la page s'ouvre sur les logos 18H22 × La Petite Maison,
  aux couleurs du client, sans préloader, sans logo écrit et sans apparition au défilement.
- Sommaire (`menu: true`) sous le compte à rebours, en plein écran : Idées teasing, Le feed, Publications, Stories, en grand texte
  Helvetica Neue avec icône et nombre, sans photo. Survol ou toucher : le bloc se remplit de la couleur du texte. Accordéon : toucher ouvre la
  partie juste sous son bloc, qui reste collé en haut avec « × Fermer » pendant la lecture ; un bouton « Fermer … » termine
  chaque partie. Une seule partie ouverte à la fois. Lien direct : `?vue=teasing`, `?vue=feed`, `?vue=publications`, `?vue=stories`.
  Barre fixe du bas : Retours, Inspi, Branding, Équipe.
- En ligne automatiquement : une publication dont la date est passée porte « En ligne » sur sa fiche et sur sa vignette du feed (voilée).
- Stories jour par jour (`storiesByDay: true`) : une rangée par jour sous sa date, l'heure sous chaque story.
- Texte d'intro, chiffres clés et légende des formats retirés (`stats: false`).
- Jours de passage, calendrier et missions : retirés le 26 octobre (`suivi.calendar: false`, `suivi.missions: false`).
- Repères sur téléphone : « Mode d'emploi » en 3 étapes sous les chiffres clés, et une barre fixe en bas
  (Planning, Retours avec le nombre d'avis donnés, Inspiration, Branding, Équipe) qui remplace les boutons flottants.
- Feed : toucher une vignette ouvre la publication sur place (visuel, légende, Validé / À revoir, Modifier en mode équipe).
- Commentaires sous chaque post : gardés sur le téléphone du client, envoyés en un récapitulatif (WhatsApp).
  Un post « À revoir » passe en noir et blanc transparent avec une croix, sur le post et dans le feed.
- Bouton « Inspiration du mois » : reels et carrousels Instagram ajoutés par l'équipe.
- Stories (après le planning du mois, onglet « Stories » en haut et dans la barre du bas) : vignettes verticales triées par jour et heure.
  Toucher une story l'ouvre en plein écran comme sur Instagram (barres de progression, toucher à droite / à gauche, maintenir pour la pause,
  texte prévu par-dessus), avec Validé / À revoir et un commentaire en dessous. Une story « À revoir » passe en noir et blanc avec une croix.
  Les avis sur les stories partent dans le même récapitulatif WhatsApp.
- Bouton « Branding » (au-dessus) : playlists Spotify de la marque, typographie, visuels de démo et liens Dropbox des banques d'images.
  Tout se règle dans `plan.js`, rubrique `branding` (`playlists`, `fonts`, `visuals`, `links`).

## Espace équipe (code riviera-9655)

Bouton flottant « Espace équipe » en bas à droite, puis le code (une fois par appareil, majuscules ou minuscules indifférentes).
Menu : Publications, Stories, Idées teasing, Inspiration.
- Formulaire « Modifier » en parties numérotées : date, visuel, texte.
- Équipe : Fabrizio (couleurs 18H22), Jade (couleurs La Petite Maison).
- Planning : en mode équipe, « Ajouter une publication » (fin du mois) crée le post et ouvre son formulaire. Changer une date, ajouter ou supprimer recharge la page (sans l'ouverture 18H22)
  pour remettre le planning, le feed et le calendrier dans l'ordre. Une publication du planning supprimée
  reste listée en mode équipe avec « Rétablir » ; une publication ajoutée puis supprimée est effacée.
- Photos et légendes : un bouton « Modifier » apparaît sous chaque post.
  - Posts : date et heure de publication.
  - Remplacer, ajouter (le post devient un carrousel) ou retirer des photos ; les flèches de chaque visuel changent l'ordre du carrousel. La photo est réduite sur le téléphone avant l'envoi.
  - Carrousel : « Ajouter une vidéo » glisse une vidéo (MP4 ou MOV) parmi les photos ; elle est recadrée au format des photos (4:5)
    et lue en boucle sans le son quand la slide est à l'écran. Une vidéo seule dans un post photo en fait un carrousel.
  - Grosses vidéos : au-delà de 8 Mo, l'envoi part en morceaux de 8 Mo (reconstitués dans `data/parts/`), ce qui contourne la limite
    d'envoi de l'hébergement (128 Mo chez 18h22.com). Maximum 1 Go par vidéo.
  - Format : n'importe quel post peut passer en « Vidéo (reel) », et revenir en photo (la vidéo reste gardée).
  - « Télécharger la vidéo » (mode équipe) sous chaque reel qui a une vidéo : le fichier envoyé, tel quel.
  - Reels : vidéo (MP4 ou MOV) et couverture. Après l'envoi, une image du début de la vidéo sert de couverture ;
    le curseur permet d'en choisir une autre (« Utiliser cette image »), ou « Importer une photo ».
    La couverture est l'image affichée dans le feed et sur le post avant lecture.
  - Titre et légende (un paragraphe par ligne).
  - « Revenir à l'original » efface les modifications et les fichiers envoyés. « Supprimer » (deux touchers) retire du planning.
- Stories : « Ajouter une story » (au bout de la rangée des stories) ouvre la fiche « Programmer » : photo ou vidéo (9:16),
  jour, heure, et le texte, sticker ou lien prévu. « Prévisualiser » enregistre puis montre la story en plein écran ;
  « Modifier cette story » dans la visionneuse rouvre la fiche ; « Supprimer cette story » l'efface avec ses fichiers.
  Les stories sont gardées dans `data/suivi.json` (rubrique `edits`, `added: "story"`) et leurs fichiers dans `uploads/`.
- Partager une publication : « Partager le lien » sous chaque post (mode équipe). Sur téléphone, la feuille de partage s'ouvre ;
  sur ordinateur, le lien est copié. Le lien (`share.php?p=<id>`) montre en aperçu (WhatsApp, iMessage…) le visuel, jusqu'à 3 photos
  côte à côte pour un carrousel, ou la couverture et la vidéo d'un reel ; il ouvre ensuite le planning sur la publication.
  L'aperçu lit `data/suivi.json` : il concerne les publications ajoutées ou modifiées depuis l'espace équipe.
- Rendez-vous : jours de passage (calendrier et liste), à ajouter, modifier ou supprimer.
- Tâche : missions en cours, publiées par Fabrizio ou Jade (crayon pour modifier, croix pour supprimer, toucher l'état pour avancer).
- Inspiration : ouvrir directement `…/?inspi`, coller un lien Instagram (reel, carrousel ou post). Le site récupère l'image, le compte
  (`insta.php`) et copie l'image dans `inspi/`, et pour un reel la vidéo, lue directement dans le panneau.
  Si Instagram ne donne pas la vidéo, le lecteur Instagram s'affiche à la place. Le texte du post n'est pas affiché, seulement le lien.
  Le client valide ou met « À revoir » et commente chaque inspiration ; ses retours partent dans le même récapitulatif WhatsApp
  (bouton « Envoyer mes retours » en bas du panneau).

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
