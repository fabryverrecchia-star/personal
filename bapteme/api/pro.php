<?php
/*
 * GET api/pro.php — le reportage du photographe pour la page des invités,
 * dans l'ordre des fichiers, avec la taille totale pour le bouton « Tout télécharger ».
 */
require __DIR__ . '/lib.php';

$all = pro_all();
$bytes = 0;
foreach ($all as $m) {
    $bytes += (int) ($m['size'] ?? 0);
}
header('Cache-Control: no-cache');
json_out([
    'ok' => true,
    'items' => array_map('pro_public', $all),
    'total' => count($all),
    'bytes' => $bytes,
    'download' => pro_download_allowed(),
]);
