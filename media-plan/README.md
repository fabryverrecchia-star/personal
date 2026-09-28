# 18H22 × Helicave by Harnois (Démarches SRL) — Price list

Site mobile first : price list interactive, crédit engagé, missions en cours et jours de passage.
Aucune compilation : déposer le dossier tel quel chez l'hébergeur (ex. 18h22.com/demarches/).

- `index.html` ouvre Démarches (`?c=demarches`). Ouverture en couleurs 18H22, puis fondu vers l'ivoire, le bronze et l'or Helicave.
- Ordre de la page : price list et crédit engagé, missions en cours et avancement global, calendrier des passages. Pas de feed Instagram.
- Textes fixes (conditions, date de l'offre, agence) : `clients/demarches/plan.js`, rubrique `prices`.

## Price list et crédit

Les rubriques, prestations, l'enveloppe et la TVA sont dans `clients/demarches/data/suivi.json` (clé `prices`),
reprises de `Price_list_Abysse_Lab_Demarches_SRL.xlsx` (offre du 23 septembre 2026).

- Chaque prestation a un état : Proposé, Engagé (validée par le client, en cours) ou Livré.
- Crédit engagé HT = somme prix × quantité des prestations engagées et livrées (le « cumul engagé » du fichier Excel).
  Le compteur détaille « En cours » (engagé, pas encore livré) et « Livré », et affiche le TTC.
- Enveloppe (facultative) : si elle est renseignée, le compteur affiche le crédit disponible ou le dépassement.
- TVA : 20 % par défaut, ou 0 % (autoliquidation, client belge assujetti).

## Accès par code

La page est privée : après l'ouverture 18H22, elle demande un code (retenu ensuite sur l'appareil).
- Fabrizio : le code équipe habituel. Tout est modifiable directement, sans menu.
- Guillaume : « helicave ». Consultation seule, aucune modification possible (vérifié aussi côté serveur).
- La pastille en bas à droite indique qui est connecté ; la toucher permet de se déconnecter.
- Changer un code : `php -r 'echo password_hash("nouveau-code", PASSWORD_DEFAULT);'` puis coller le résultat dans `config.php`.

Pour Fabrizio :
- Price list : « Ajouter une prestation » (rubrique existante ou nouvelle, unité, prix HT, quantité, état) et « Enveloppe et TVA ».
  Sur chaque ligne, l'état se choisit en un geste (Proposé, Engagé, Livré) ; le crayon modifie, la croix supprime.
- Missions : « Nouvelle mission », toucher l'état fait avancer la mission, avancement global de 25 en 25 %.
- Passages : « Ajouter un passage ».

## Hébergement

- PHP 7.4 ou plus.
- Le dossier `clients/demarches/data/` doit être accessible en écriture par PHP (`suivi.json` en 664).
- Apache lit `data/.htaccess` qui bloque l'accès direct au fichier. Sur Nginx : `location ~ /data/ { deny all; }`.
- Vérifier l'installation : `clients/demarches/suivi.php?diag`.

Sans PHP (aperçu statique), la page lit `data/suivi.json` et les modifications restent sur l'appareil.
