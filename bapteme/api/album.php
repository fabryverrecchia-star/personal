<?php
/*
 * GET api/album.php — tout l'album public en un seul ZIP (qualité d'origine,
 * un dossier par invité). Les photos masquées dans admin.php n'y sont pas.
 */
require __DIR__ . '/lib.php';

if (empty(config()['public_gallery'])) {
    http_response_code(404);
    exit('Not found');
}
if (!rate_limit('album', 12)) {
    http_response_code(429);
    exit('Trop de téléchargements, réessayez dans une heure.');
}

$hidden = array_flip(hidden_ids());
$media = array_values(array_filter(media_all(), function ($m) use ($hidden) {
    return !isset($hidden[$m['id']]) && ($m['kind'] ?? '') !== 'audio';
}));
if (!$media) {
    http_response_code(404);
    exit('L’album est encore vide.');
}
zip_stream(zip_entries($media), 'Bapteme de Lou - album.zip');
