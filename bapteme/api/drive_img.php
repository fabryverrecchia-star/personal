<?php
/*
 * GET api/drive_img.php?id=<fichier Drive>&s=600|2400|4000
 * Plan B du reportage (photos pas encore importées) : ce serveur va chercher l'image
 * chez Google une seule fois, la garde dans storage/drivecache/, puis la sert lui-même.
 * Seules les photos du dossier du reportage sont acceptées (pas un relais ouvert).
 */
require __DIR__ . '/lib.php';

$id = (string) ($_GET['id'] ?? '');
$size = (int) ($_GET['s'] ?? 0);
if (!preg_match('/^[A-Za-z0-9_-]{10,}$/', $id) || !in_array($size, [600, 2400, 4000], true)) {
    http_response_code(400);
    exit('Bad request');
}
$known = false;
foreach (drive_fallback_items() as $it) {
    if (($it['drive'] ?? '') === $id) {
        $known = true;
        break;
    }
}
if (!$known) {
    http_response_code(404);
    exit('Not found');
}

$dir = storage_dir('drivecache');
$file = $dir . '/' . $id . '_' . $size . '.jpg';
if (!is_file($file)) {
    time_limit(120);
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.part';
    [$ok, $bytes] = http_download('https://drive.google.com/thumbnail?id=' . rawurlencode($id) . '&sz=w' . $size, $tmp, 40 * 1048576);
    $info = $ok ? @getimagesize($tmp) : false;
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
        @unlink($tmp);
        header('Retry-After: 2');
        http_response_code(503);                 // Google a refusé pour l'instant : le navigateur réessaiera
        exit('Retry');
    }
    @rename($tmp, $file);
}
stream_file($file, (string) (getimagesize($file)['mime'] ?? 'image/jpeg'), basename($file), false, 'public, max-age=2592000');
