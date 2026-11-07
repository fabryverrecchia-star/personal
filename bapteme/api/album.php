<?php
/*
 * GET api/album.php — tout l'album public en un seul ZIP (qualité d'origine,
 * un dossier par invité). Les photos masquées dans admin.php n'y sont pas.
 */
require __DIR__ . '/lib.php';

if (!rate_limit('album', 12)) {
    http_response_code(429);
    exit('Trop de téléchargements, réessayez dans une heure.');
}

// ?set=pro : le reportage du photographe, en qualité d'origine
if (($_GET['set'] ?? '') === 'pro') {
    if (!pro_download_allowed() && !is_admin()) {
        http_response_code(404);
        exit('Not found');
    }
    $entries = [];
    $used = [];
    foreach (pro_all() as $m) {
        if (!empty($m['file']) && !str_contains($m['file'], '..')) {
            $n = preg_replace('/[\\\\\/:*?"<>|\x00-\x1F]+/u', '-', (string) $m['original']) ?: basename($m['file']);
            if (isset($used[strtolower($n)])) {
                $n = pathinfo($n, PATHINFO_FILENAME) . '-' . substr((string) $m['id'], 0, 6) . '.' . pathinfo($n, PATHINFO_EXTENSION);
            }
            $used[strtolower($n)] = true;
            $entries[] = ['path' => storage_dir() . '/' . $m['file'], 'name' => 'Photographe/' . $n];
        }
    }
    if (!$entries) {
        http_response_code(404);
        exit('Le reportage n’est pas encore en ligne.');
    }
    zip_stream($entries, 'Bapteme de Lou - photographe.zip');
}

if (empty(config()['public_gallery'])) {
    http_response_code(404);
    exit('Not found');
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
