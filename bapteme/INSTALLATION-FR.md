# Baptême de Lou — mise en ligne

Site des invités (infos, photos du jour J, livre d'or) + espace privé pour les parents.
Aucun service externe : tout reste sur votre hébergement (PHP 7.2 minimum, PHP 8 recommandé).

## 1. Compléter les infos
Ouvrez `assets/js/infos.js` : horaire et église de la cérémonie, heure du repas, signature.
Une ligne laissée vide n'est pas affichée. Le repas chez **Augustine Bistronomie 1890**
(1 Place des Martyrs de la Résistance, 63200 Riom) est déjà renseigné.

## 2. Envoyer les fichiers
Avec FileZilla (ou le gestionnaire de fichiers de l'hébergeur), créez par ex. le dossier
**`bapteme`** à la racine du site et envoyez-y **le contenu** du dossier `bapteme`
(on doit obtenir `bapteme/index.html`, `bapteme/api/…`, `bapteme/assets/…`, `bapteme/storage/…`).
Pensez aux fichiers cachés `.htaccess` (FileZilla : Serveur › Forcer l'affichage des fichiers cachés).

## 3. Autoriser l'écriture
Clic droit sur `bapteme/storage` › Droits d'accès › **755** (ou **775** si 755 ne suffit pas).

## 4. Mot de passe de l'espace privé
Dans `bapteme/api/config.php` : `'admin_password' => 'votre-mot-de-passe',`

## 5. Vérifier
Ouvrez **https://votre-site/bapteme/check.php** puis « Lancer le test ». Tout doit être vert ;
sinon la correction est écrite sous la ligne rouge.

- Site des invités : `https://votre-site/bapteme/`
- Espace privé : `https://votre-site/bapteme/admin.php`
  - onglet **Livre d'or** › « Exporter en PDF » (un joli livret à imprimer pour Lou)
  - onglet **Photos & vidéos** › « Tout télécharger (ZIP) », un dossier par invité ;
    chaque photo peut être masquée de l'album public ou supprimée.

## Bon à savoir
- **Toujours en https://.**
- Les photos et vidéos sont gardées en **qualité d'origine** (jusqu'à 2 Go par fichier),
  envoyées par petits morceaux avec reprise automatique : ça passe même avec un réseau faible.
- L'album « Souvenirs partagés » se met à jour tout seul toutes les 45 s. Pour garder les photos
  privées (visibles seulement dans l'espace admin) : `'public_gallery' => false` dans `api/config.php`.
- Recevoir chaque message du livre d'or par e-mail : `'notify_email' => 'vous@exemple.fr'`.
- Astuce jour J : imprimez un petit QR code vers le site sur les tables du restaurant.
- Ouvert sans serveur (aperçu, fichier local), la page fonctionne en **démo** : rien n'est envoyé.

## Fichiers
| Chemin | Rôle |
|---|---|
| `index.html` | la page |
| `assets/js/infos.js` | **les infos à modifier** |
| `assets/js/scene.js` | fond WebGL (aquarelle + fleurs qui tombent) |
| `assets/js/app.js` | ouverture animée, compte à rebours, agenda, livre d'or, envoi des photos, album |
| `assets/js/uploader.js` | envoi des fichiers par morceaux |
| `assets/css/style.css` | styles |
| `api/` | réception des messages et des photos |
| `admin.php` | espace privé |
| `check.php` | vérification de l'installation |
| `storage/` | messages, photos et vidéos (protégé, jamais servi directement) |
