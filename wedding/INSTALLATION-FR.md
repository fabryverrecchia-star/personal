# Mise en ligne sur https://18h22.com/mariage/

## 1. Envoyer les fichiers
1. Décompressez `wedding-site.zip`.
2. Avec votre logiciel FTP (FileZilla…) ou le gestionnaire de fichiers de l'hébergeur,
   créez le dossier **`mariage`** à la racine du site (là où se trouve la page d'accueil de 18h22.com).
3. Envoyez **le contenu** du dossier `wedding` dans `mariage`
   (on doit obtenir `mariage/index.html`, `mariage/api/…`, `mariage/assets/…`, `mariage/storage/…`).
   Pensez aux fichiers cachés `.htaccess` (FileZilla : Serveur › Forcer l'affichage des fichiers cachés).

## 2. Autoriser l'écriture
Clic droit sur le dossier `mariage/storage` › Droits d'accès › **755** (ou **775** si 755 ne suffit pas).

## 3. Mot de passe de l'espace privé
Ouvrez `mariage/api/config.php` et écrivez votre mot de passe :
`'admin_password' => 'votre-mot-de-passe',`

## 4. Vérifier
Ouvrez **https://18h22.com/mariage/check.php** puis « Lancer le test ».
Tout doit être vert. Si une ligne est rouge, la correction est écrite dessous ;
sinon copiez le résultat du test et envoyez-le.

- Site des invités : https://18h22.com/mariage/
- Espace privé (messages, photos, vidéos, vocaux) : https://18h22.com/mariage/admin.php
  (onglet Guestbook › « Exporter en PDF » pour le livre d’or complet)

## Important
- **Toujours en https://** : sans HTTPS, les téléphones bloquent le micro.
- L'aperçu Claude (claude.ai/artifact/…) est une **démo** : il n'a pas de serveur,
  rien n'y est envoyé. Les vrais envois ne marchent que sur 18h22.com.
- PHP 7.2 minimum (PHP 8 recommandé), à choisir dans le panneau de l'hébergeur.
