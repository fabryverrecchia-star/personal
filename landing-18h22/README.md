# 18H22 — landing animée

Page d'accueil autonome (HTML/CSS/JS statique, aucune compilation).

1. **Construction du picto** : lignes et cercles de construction, puis le monogramme se trace et prend sa forme pleine.
2. **Écriture « 18h22 »** : le mot sort de gauche à droite, suivi d'un filet.
3. **Accroche** dans la langue du visiteur (`navigator.languages` : fr, en, es, it ; français par défaut). Boutons FR/EN/ES/IT en haut à droite, ou `?lang=it` dans l'URL.
4. **Projets** autour du logo : un nouveau toutes les 0,9 à 2,2 s (au hasard), révélé dans un sens au hasard ; au-delà de 6 (3 sur mobile) le plus ancien s'efface et laisse sa place. Rendu WebGL : les images suivent le curseur, se plient et séparent légèrement leurs couleurs selon la vitesse. Sur mobile : suivent le doigt, l'inclinaison (Android) ou dérivent lentement.

## Interactions

- **Curseur œil** : un clic n'importe où ouvre la page « Tous les projets » (sur mobile : toucher l'écran ou le bouton « Touchez pour tout voir »). Échap ou « Fermer » pour revenir.
- **Contact** (haut gauche) : panneau avec formulaire. Les messages partent via `contact.php` (PHP `mail()`), vers l'adresse `CONTACT_TO` en haut du fichier.

## Admin (ajouter des projets)

- Lien privé : `admin.php?k=CLÉ` (la clé est donnée à part, jamais dans le dépôt). Sans le lien, `admin.php` demande la clé comme code.
- On y ajoute des images (réduites à 1600 px dans le navigateur), on change l'ordre, les titres, on supprime. « Enregistrer » réécrit `assets/js/projects.js` : le site se met à jour tout de suite.
- Données : `data/projects.json` (dossier protégé). Les dossiers `data/`, `assets/projects/` et `assets/js/` doivent être accessibles en écriture par PHP.
- Réglages « Animation » : vitesse des fondus, fréquence d'apparition, nombre de projets à l'écran, taille moyenne, variété des tailles (toutes pareilles → vignettes et grands formats), espace entre les projets. Enregistrés dans `window.SETTINGS` (fin de `projects.js`).
- Changer la clé : voir `config.php`.

## Modifier

- **Projets** : depuis l'admin (voir plus haut).
- **Rythme, tailles, espacement** : depuis l'admin (réglages « Animation »).
- **Accroches** : objet `TAGLINES` dans `assets/js/app.js`.
- **Couleurs** : variables `--bg`, `--ink` dans `assets/css/style.css`.

## Mise en ligne

Copier le dossier tel quel sur le serveur (ex. `18h22.com/`). La page doit être servie en http(s) : ouverte en `file://`, le navigateur refuse les images au WebGL (un repli sans WebGL prend alors le relais).

Paramètres de test : `?skip` (saute l'intro), `?nogl` (force le repli sans WebGL), `?lang=es`.

`python3 tools/build-preview.py sortie.html` produit un aperçu en un seul fichier.
