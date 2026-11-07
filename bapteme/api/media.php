<?php
/*
 * GET api/media.php?id=…[&v=thumb][&dl=1]
 * Serves one shared photo / video / voice note to the public gallery.
 */
require __DIR__ . '/lib.php';

$id = (string) ($_GET['id'] ?? '');

// Reportage du photographe : version écran, miniature, ou original à télécharger
if (($_GET['set'] ?? '') === 'pro') {
    $m = preg_match('/^[a-f0-9]{16}$/', $id) ? pro_find($id) : null;
    $v = (string) ($_GET['v'] ?? '');
    $dl = isset($_GET['dl']);
    if (!$m || ($dl && !pro_download_allowed() && !is_admin())) {
        http_response_code(404);
        exit('Not found');
    }
    $orig = $v === 'orig' && (pro_download_allowed() || is_admin());   // pleine résolution, pour le zoom
    $rel = ($v === 'thumb' && !empty($m['thumb'])) ? $m['thumb'] : (($v === 'web' && !empty($m['web'])) ? $m['web'] : $m['file']);
    if ($rel === $m['file'] && !$dl && !$orig && !empty($m['web'])) {
        $rel = $m['web'];                                     // sans demande explicite, la version écran
    }
    $path = storage_dir() . '/' . $rel;
    if (str_contains($rel, '..') || !is_file($path)) {
        http_response_code(404);
        exit('Not found');
    }
    stream_file($path, $rel === $m['file'] ? (string) $m['mime'] : 'image/jpeg', (string) ($m['original'] ?: basename($path)), $dl, 'public, max-age=604800');
}

$m = preg_match('/^[a-f0-9]{16}$/', $id) ? media_find($id) : null;

if (!$m || empty(config()['public_gallery']) || in_array($id, hidden_ids(), true)) {
    http_response_code(404);
    exit('Not found');
}

$wantThumb = ($_GET['v'] ?? '') === 'thumb' && !empty($m['thumb']);
$rel = $wantThumb ? $m['thumb'] : $m['file'];
$path = storage_dir() . '/' . $rel;
if (str_contains($rel, '..') || !is_file($path)) {
    http_response_code(404);
    exit('Not found');
}

stream_file(
    $path,
    $wantThumb ? 'image/jpeg' : (string) $m['mime'],
    (string) ($m['original'] ?: basename($path)),
    isset($_GET['dl']),
    'public, max-age=604800'
);
