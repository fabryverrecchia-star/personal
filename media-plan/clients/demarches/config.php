<?php
// Codes d'accès, stockés hachés. Au chargement, la page demande un code :
//   - Fabrizio (modification) : le code équipe habituel, le même que pour Enza Famiglia et La Petite Maison ;
//   - Guillaume (consultation, sans modification) : « helicave ».
// Pour changer un code :
//   php -r 'echo password_hash("nouveau-code", PASSWORD_DEFAULT);'
// puis coller le résultat ci-dessous.
return [
  'admin_name' => 'Fabrizio',
  'admin_hash' => '$2y$12$CzQa0dF0cY78.Np9fKgyzuQ/nVk.5.efA8/zPxG0lnj0bcMPO13k6',
  'view_name' => 'Guillaume',
  'view_hash' => '$2y$12$DwHpg1qNriNapKnjGnKa8u7G.T7BgYqDJKsQ8Fkkod3cZeIqutIkS',
];
