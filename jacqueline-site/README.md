# Jacqueline, site one page

Site du restaurant Jacqueline (Gustave Migdal, 23 rue de la Victoire, Paris 9e). C'est un seul fichier statique, sans compilation : il suffit d'envoyer `index.html` et `assets/` à la racine de l'hébergement.

- **Préchargement** sur fond blanc : le picto se trace en bourgogne, se remplit, puis le logo se compose et le rideau se lève sur l'accueil.
- **Sections** : accueil, la maison, le chef, les séquences (WebGL), menus, infos, réserver, pied de page.
- **Séquences** : les 5 illustrations du langage graphique (l'iode, le végétal, le corsé, le fruité, le gourmand) sont découpées sans fond dans `assets/sequences-atlas.jpg` et animées en WebGL. Chaque dessin apparaît comme de l'encre qui coule, bouge selon son caractère et se dissout dans le suivant pendant le défilement. Le pointeur fait des ondulations, un défilement rapide agite le dessin. Le canvas est en `multiply` sur la page, donc le blanc des dessins devient le papier. Sans WebGL (ou si la page est ouverte directement depuis le disque), les 5 illustrations s'affichent fixes.
- **Réservation** : tous les boutons mènent à Zenchef (`rid=388647`).
- **Textes à valider** avec le chef : la citation et la bio du chef, la phrase sur les menus et les horaires (« Déjeuner & dîner sur réservation »).
