# Jacqueline, site officiel (v2)

Site statique : envoyer **tout le contenu de ce dossier** à la racine de l'hébergement (y compris le fichier caché `.htaccess`).

## Contenu

- `index.html` : le site (une page).
- `mentions-legales.html`, `confidentialite.html` : pages légales, liées depuis le pied de page.
- `404.html` : page « introuvable ».
- `assets/` : images, polices, vidéo, carte PDF.
- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` : icônes (onglet, écran d'accueil iPhone et Android).
- `robots.txt`, `sitemap.xml` : pour Google.
- `.htaccess` : redirection HTTPS, page 404, sécurité, cache (adapté à l'hébergement OVH).

## Avant la mise en ligne : à compléter

Les champs à remplir apparaissent en bourgogne, entre crochets, dans `mentions-legales.html` et `confidentialite.html` :

1. Capital social, SIREN (RCS Paris) et n° de TVA de la SARL Jacqueline Gustave Migdal (sur le Kbis).
2. Téléphone du restaurant.
3. Médiateur de la consommation auquel l'établissement adhère (obligatoire pour un professionnel qui reçoit des particuliers ; le comptable le connaît).

Déjà renseignés : SARL Jacqueline Gustave Migdal, siège 14 rue Charles V, 75004 Paris ; directeurs de la publication Gustave Migdal et Fabrizio Verrecchia ; hébergeur OVH ; design, illustrations et photographies Fabrizio Verrecchia — Studio_18h22.

Le nom de domaine retenu est `jacqueline-restaurant.com` (celui de l'adresse e-mail). S'il change, le remplacer dans `index.html` (balises `canonical`, `og:` et données structurées), `robots.txt`, `sitemap.xml` et les deux pages légales.

## Ce qui est déjà en règle

- Aucun cookie, aucune mesure d'audience, aucun appel à un service tiers au chargement (les polices sont hébergées sur le site) : pas de bandeau cookies à prévoir.
- Mention loi Évin dans le pied de page et sous la carte des vins.
- Allergènes et prix nets (TTC, service compris) indiqués sur la carte et dans les mentions légales.
- Crédits : design, illustrations et photographies, Fabrizio Verrecchia — Studio_18h22.

## Le site

- Préchargement : le picto se trace, se remplit, puis le rideau bourgogne se lève sur la photo de la salle.
- Accueil plein écran, barre d'accès rapide (Réserver, La carte, Les vins, Accès).
- Séquences : bande horizontale (glisser au doigt, trackpad, flèches ou souris). Le défilement vertical de la page n'est jamais bloqué.
- Le menu et la carte des vins s'ouvrent dans une feuille (liens directs `#carte` et `#vins`).
- Le chef, un carrousel de photos (façade côté rue, plats, carte, salle) et une courte boucle vidéo de la viande, la maison, réservation, pied de page.
- Textes à valider : citation et bio du chef, horaires (« Déjeuner & dîner, sur réservation »).
