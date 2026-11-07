<?php
/*
 * GET api/resume.php?name=…&size=…[&guest=…][&id=…]
 * Lets an interrupted upload continue where it stopped instead of starting again:
 * returns the upload id of an unfinished upload of the same file and the chunks
 * the server already has. Unfinished uploads are kept 2 days (see upload.php).
 */
require __DIR__ . '/lib.php';

$name = clean_text(rawurldecode((string) ($_GET['name'] ?? '')), 180);
$size = filter_var($_GET['size'] ?? '', FILTER_VALIDATE_INT);
$guest = clean_text(rawurldecode((string) ($_GET['guest'] ?? '')), 80);
$wantId = strtolower((string) ($_GET['id'] ?? ''));

if ($name === '' || $size === false || $size < 1) {
    fail('bad_request');
}
if (!is_admin() && !rate_limit('resume', 600)) {
    fail('rate_limited', 429);
}

function received(string $dir): array
{
    $out = [];
    foreach (glob($dir . '/*.part') ?: [] as $p) {
        $out[] = (int) basename($p, '.part');
    }
    sort($out);
    return $out;
}

$best = null;
foreach (glob(storage_dir('tmp') . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
    $id = basename($dir);
    if (!preg_match('/^[a-f0-9]{16,64}$/', $id) || filemtime($dir) < time() - 172800) {
        continue;
    }
    $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
    if (!is_array($meta) || (int) $meta['size'] !== $size || (string) $meta['name'] !== $name) {
        continue;
    }
    $parts = received($dir);
    // the id the browser remembers wins; then the same guest; then the most advanced upload
    $score = ($id === $wantId ? 1e9 : 0) + (($meta['guest'] ?? '') === $guest ? 1e6 : 0) + count($parts);
    if (!$best || $score > $best['score']) {
        $best = ['score' => $score, 'id' => $id, 'total' => (int) $meta['total'], 'received' => $parts];
    }
}

if (!$best) {
    json_out(['ok' => true, 'found' => false]);
}
json_out(['ok' => true, 'found' => true, 'id' => $best['id'], 'total' => $best['total'], 'received' => $best['received']]);
