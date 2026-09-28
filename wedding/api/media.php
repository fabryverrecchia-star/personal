<?php
/*
 * GET api/media.php?id=…[&v=thumb][&dl=1]
 * Serves one shared photo / video / voice note to the public gallery.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

$id = (string) ($_GET['id'] ?? '');
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
