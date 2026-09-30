# 18H22 — landing animée

Page d'accueil autonome (HTML/CSS/JS statique, aucune compilation).

1. **Construction du picto** : lignes et cercles de construction, puis le monogramme se trace et prend sa forme pleine.
2. **Écriture « 18h22 »** : le mot sort de gauche à droite, suivi d'un filet.
3. **Accroche** dans la langue du visiteur (`navigator.languages` : fr, en, es, it ; français par défaut). Boutons FR/EN/ES/IT en haut à droite, ou `?lang=it` dans l'URL.
4. **Projets** autour du logo : un nouveau toutes les 3 s ; au-delà de 5 (3 sur mobile) le plus ancien s'efface et laisse sa place. Rendu WebGL : les images suivent le curseur, se plient et séparent légèrement leurs couleurs selon la vitesse. Sur mobile : suivent le doigt, l'inclinaison (Android) ou dérivent lentement.

## Modifier

- **Projets** : `assets/js/projects.js` (chemin, dimensions, titre facultatif). Images conseillées : WebP ~1100 px.
- **Rythme** : `SPAWN_EVERY`, `MAX_DESKTOP`, `MAX_MOBILE` en haut de `assets/js/app.js`.
- **Accroches** : objet `TAGLINES` dans `assets/js/app.js`.
- **Couleurs** : variables `--bg`, `--ink` dans `assets/css/style.css`.

## Mise en ligne

Copier le dossier tel quel sur le serveur (ex. `18h22.com/`). La page doit être servie en http(s) : ouverte en `file://`, le navigateur refuse les images au WebGL (un repli sans WebGL prend alors le relais).

Paramètres de test : `?skip` (saute l'intro), `?nogl` (force le repli sans WebGL), `?lang=es`.

`python3 tools/build-preview.py sortie.html` produit un aperçu en un seul fichier.
