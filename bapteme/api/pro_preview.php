<?php
/*
 * POST api/pro_preview.php  id, web (jpeg), thumb (jpeg), w, h
 * Aperçus d'une photo du reportage préparés par le navigateur de l'espace privé,
 * quand le serveur n'a pas assez de mémoire pour ouvrir une photo de 30-50 Mpx.
 */
require __DIR__ . '/lib.php';

require_post();
if (!is_admin()) {
    fail('admin_only', 403, 'admin_only');
}
$id = (string) ($_POST['id'] ?? '');
$m = preg_match('/^[a-f0-9]{16}$/', $id) ? pro_find($id) : null;
if (!$m) {
    fail('not_found', 404);
}

$fields = [];
foreach (['web' => 'pro/web', 'thumb' => 'pro/thumbs'] as $k => $dir) {
    $f = $_FILES[$k] ?? null;
    if (!$f || (int) $f['error'] !== UPLOAD_ERR_OK || $f['size'] < 100 || $f['size'] > 20 * 1048576) {
        continue;
    }
    $info = @getimagesize($f['tmp_name']);
    if (!$info || $info[2] !== IMAGETYPE_JPEG) {
        continue;                                    // uniquement de vrais JPEG
    }
    storage_dir($dir);
    $rel = $dir . '/' . $id . '.jpg';
    if (move_uploaded_file($f['tmp_name'], storage_dir() . '/' . $rel)) {
        $fields[$k] = $rel;
    }
}
$w = filter_var($_POST['w'] ?? '', FILTER_VALIDATE_INT);
$h = filter_var($_POST['h'] ?? '', FILTER_VALIDATE_INT);
if ($w && $h && $w < 40000 && $h < 40000) {
    $fields['w'] = $w;
    $fields['h'] = $h;
}
if (!$fields) {
    fail('no_preview', 422);
}
$m = pro_update($id, $fields) ?: $m;
json_out(['ok' => true, 'item' => pro_public($m)]);
