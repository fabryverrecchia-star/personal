<?php
/*
 * GET api/status.php — what the page needs to know before uploading.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

$dir = storage_dir();
json_out([
    'ok' => true,
    'chunk' => max_chunk_bytes(),
    'maxFile' => (int) config()['max_file_mb'] * 1024 * 1024,
    'writable' => is_dir($dir) && is_writable($dir),
    'gallery' => !empty(config()['public_gallery']),
]);
