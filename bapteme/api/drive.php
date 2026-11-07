<?php
/*
 * Import du reportage depuis un dossier Google Drive partagé par lien
 * (espace privé uniquement). Le serveur va chercher les photos directement
 * chez Google, en qualité d'origine : rien ne passe par la connexion des parents.
 *
 * GET  api/drive.php?folder=<lien ou id>   → liste des photos du dossier, et celles déjà importées
 * POST api/drive.php  id=<id du fichier> name=<nom>   → importe une photo
 */
require __DIR__ . '/lib.php';

if (!is_admin()) {
    fail('admin_only', 403, 'admin_only');
}

const IMPORT_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'tif', 'tiff', 'mp4', 'mov', 'm4v'];

function drive_id(string $s): string
{
    if (preg_match('#/folders/([A-Za-z0-9_-]{10,})#', $s, $m) || preg_match('#[?&]id=([A-Za-z0-9_-]{10,})#', $s, $m)) {
        return $m[1];
    }
    return preg_match('/^[A-Za-z0-9_-]{10,}$/', trim($s)) ? trim($s) : '';
}

/** Photos already in the reportage: by Drive id, and by file name + size. */
function already(): array
{
    $ids = [];
    $names = [];
    foreach (read_jsonl(storage_file('pro.jsonl')) as $m) {
        if (!empty($m['drive'])) {
            $ids[$m['drive']] = true;
        }
        $names[strtolower((string) $m['original'])] = true;
    }
    return [$ids, $names];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    $folder = drive_id((string) ($_GET['folder'] ?? ''));
    if ($folder === '') {
        fail('bad_folder', 400, 'bad_folder');
    }
    $tmp = storage_dir('tmp') . '/drive-' . bin2hex(random_bytes(4)) . '.html';
    [$ok, , , $err] = http_download('https://drive.google.com/embeddedfolderview?id=' . rawurlencode($folder), $tmp, 20 * 1048576);
    $html = $ok ? (string) @file_get_contents($tmp) : '';
    @unlink($tmp);
    if (!$ok || $html === '') {
        fail('drive_unreachable' . ($err ? ' (' . $err . ')' : ''), 502, 'drive_unreachable');
    }
    preg_match_all('#<div class="flip-entry" id="entry-([A-Za-z0-9_-]+)".*?<a href="([^"]*)".*?<div class="flip-entry-title">([^<]*)</div>#s', $html, $mm, PREG_SET_ORDER);
    if (!$mm && stripos($html, 'flip-entries') === false) {
        fail('drive_private', 403, 'drive_private');   // dossier non partagé « tous les utilisateurs disposant du lien »
    }
    [$ids, $names] = already();
    $items = [];
    foreach ($mm as $e) {
        $name = html_entity_decode($e[3], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (strpos($e[2], '/file/d/') === false || !in_array($ext, IMPORT_EXT, true)) {
            continue;                                  // sous-dossiers, documents…
        }
        $items[] = ['id' => $e[1], 'name' => $name, 'done' => isset($ids[$e[1]]) || isset($names[strtolower($name)])];
    }
    usort($items, function ($a, $b) { return strnatcasecmp($a['name'], $b['name']); });
    json_out(['ok' => true, 'items' => $items, 'total' => count($items), 'todo' => count(array_filter($items, function ($i) { return !$i['done']; }))]);
}

/* ───────────── Import d'une photo ───────────── */

time_limit(600);
ignore_user_abort(true);


$fileId = (string) ($_POST['id'] ?? '');
$name = clean_text((string) ($_POST['name'] ?? ''), 180);
if (!preg_match('/^[A-Za-z0-9_-]{10,}$/', $fileId) || $name === '') {
    fail('bad_request');
}
[$ids, $names] = already();
if (isset($ids[$fileId]) || isset($names[strtolower($name)])) {
    json_out(['ok' => true, 'skipped' => true]);
}
$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
if (!in_array($ext, IMPORT_EXT, true)) {
    fail('file_type_not_allowed', 415, 'bad_type');
}

$short = substr(hash('sha256', 'drive:' . $fileId), 0, 16);
$safeBase = substr(trim(preg_replace('/[^A-Za-z0-9._-]+/', '-', pathinfo($name, PATHINFO_FILENAME)) ?: 'photo', '-.'), 0, 60) ?: 'photo';
$stored = date('His') . '_' . substr($short, 0, 8) . '_' . $safeBase . '.' . $ext;
$dest = storage_dir('pro/originals') . '/' . $stored;
$part = $dest . '.part';

$url = 'https://drive.usercontent.google.com/download?id=' . rawurlencode($fileId) . '&export=download&confirm=t';
[$ok, $bytes, $type, $err] = http_download($url, $part, (int) config()['max_file_mb'] * 1048576);
if (!$ok || $bytes < 1) {
    @unlink($part);
    fail('download_failed: ' . $err, 502, 'download_failed');
}
// Google renvoie une page HTML (et non le fichier) quand le partage n'est pas public
$head = (string) file_get_contents($part, false, null, 0, 64);
if (stripos($type, 'text/html') !== false || stripos($head, '<!DOCTYPE html') !== false || stripos($head, '<html') !== false) {
    @unlink($part);
    fail('not_public', 403, 'not_public');
}
$mime = 'application/octet-stream';
if (function_exists('finfo_open')) {
    $fi = finfo_open(FILEINFO_MIME_TYPE);
    $mime = (string) finfo_file($fi, $part);
    finfo_close($fi);
}
$isVideo = in_array($ext, ['mp4', 'mov', 'm4v'], true);
if (!str_starts_with($mime, 'image/') && !str_starts_with($mime, 'video/') && substr($head, 4, 4) !== 'ftyp') {
    @unlink($part);
    fail('file_type_not_allowed', 415, 'bad_type');
}
rename($part, $dest);

$info = $isVideo ? null : @getimagesize($dest);
$record = [
    'id' => $short,
    'time' => date('c'),
    'original' => $name,
    'file' => 'pro/originals/' . $stored,
    'web' => null,
    'thumb' => null,
    'size' => $bytes,
    'mime' => $isVideo ? ($mime ?: 'video/mp4') : ($mime ?: 'image/jpeg'),
    'kind' => $isVideo ? 'video' : 'photo',
    'w' => $info ? $info[0] : null,
    'h' => $info ? $info[1] : null,
    'drive' => $fileId,
];
append_jsonl(storage_file('pro.jsonl'), $record);
if (!$isVideo) {
    $prev = pro_server_previews($record);
    if ($prev) {
        $record = pro_update($short, $prev) ?: $record;
    }
}
json_out(['ok' => true, 'item' => pro_public($record), 'needsPreview' => !$isVideo && empty($record['thumb'])]);
