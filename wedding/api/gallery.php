<?php
/*
 * GET api/gallery.php?offset=0&limit=40
 * Everything guests have shared, newest first, minus what the couple hid.
 */
require __DIR__ . '/lib.php';

if (empty(config()['public_gallery'])) {
    json_out(['ok' => true, 'disabled' => true, 'items' => [], 'total' => 0, 'next' => null]);
}

$offset = max(0, (int) ($_GET['offset'] ?? 0));
$limit = min(60, max(1, (int) ($_GET['limit'] ?? 40)));

$hidden = array_flip(hidden_ids());
$all = array_values(array_filter(array_reverse(media_all()), function ($m) use ($hidden) { return !isset($hidden[$m['id']]); }));
$page = array_slice($all, $offset, $limit);

header('Cache-Control: no-cache');
json_out([
    'ok' => true,
    'items' => array_map('media_public', $page),
    'total' => count($all),
    'next' => $offset + $limit < count($all) ? $offset + $limit : null,
]);
