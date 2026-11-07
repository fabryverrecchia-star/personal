<?php
/*
 * GET api/pro.php — le reportage du photographe pour la page des invités,
 * dans l'ordre des fichiers, avec la taille totale pour le bouton « Tout télécharger ».
 */
require __DIR__ . '/lib.php';

// une photo dont les aperçus ne sont pas encore prêts attend (sinon on chargerait 50 Mo pour une vignette)
$all = array_values(array_filter(pro_all(), function ($m) {
    return ($m['kind'] ?? '') === 'video' || !empty($m['thumb']);
}));
$bytes = 0;
foreach ($all as $m) {
    $bytes += (int) ($m['size'] ?? 0);
}
header('Cache-Control: no-cache');
// rien d'importé encore : les photos directement depuis le dossier Google Drive
if (!$all) {
    $drive = drive_fallback_items();
    if ($drive) {
        json_out(['ok' => true, 'items' => $drive, 'total' => count($drive), 'bytes' => 0, 'download' => true, 'source' => 'drive']);
    }
}
json_out([
    'ok' => true,
    'items' => array_map('pro_public', $all),
    'total' => count($all),
    'bytes' => $bytes,
    'download' => pro_download_allowed(),
]);
