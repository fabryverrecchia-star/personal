# Jacqueline, site one page

Site du restaurant Jacqueline (Gustave Migdal, 23 rue de la Victoire, Paris 9e). C'est un seul fichier statique, sans compilation : il suffit d'envoyer `index.html` et `assets/` à la racine de l'hébergement.

- **Préchargement** sur fond blanc : le picto se trace en bourgogne, se remplit, puis le logo se compose et le rideau se lève sur l'accueil.
- **Sections** : accueil, la maison, le chef, les séquences (WebGL), menus, infos, réserver, pied de page.
- **Séquences** : les 5 illustrations du langage graphique (l'iode, le végétal, le corsé, le fruité, le gourmand) sont animées en WebGL depuis `assets/sequences-atlas.jpg`, aussi intégré dans `index.html` pour marcher en double-clic. Le trait apparaît d'abord, puis l'aquarelle s'étend autour. D'une séquence à l'autre, les lavis de l'ancien dessin s'évaporent pendant que le nouveau trait se pose. La souris ou le doigt laisse une traînée d'encre (petite simulation de fluide) qui étire le pigment et le fonce là où il s'accumule. Sans WebGL, les 5 illustrations s'affichent fixes.
- **Défilement fluide** : Lenis 1.1.22 (licence MIT), intégré à la page, pour la molette et le trackpad. Sur écran tactile, le défilement natif est conservé.
- **Réservation** : tous les boutons mènent à Zenchef (`rid=388647`).
- **Textes à valider** avec le chef : la citation et la bio du chef, la phrase sur les menus et les horaires (« Déjeuner & dîner sur réservation »).
