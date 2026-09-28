<?php
/*
 * POST api/upload.php — chunked photo / video / voice-note upload.
 *
 * Body: a normal form (multipart/form-data) with the chunk as file "chunk" and
 *       uploadId, index, total, name, size, type, guest, [w, h, duration].
 *       (A raw body with the same values in X- headers is also accepted.)
 * Chunk size is chosen by the page from api/status.php, to fit this server's
 * upload_max_filesize / post_max_size (often only 2 MB on shared hosting).
 *
 * Chunks land in storage/tmp/<id>/; once all have arrived they are joined
 * into storage/uploads/<date>/ and recorded in storage/media.jsonl.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

require_post();
@set_time_limit(300);
ignore_user_abort(true);

const MAX_CHUNK = 12 * 1024 * 1024;   // client sends ≤ 4 MB; generous margin

// The whole request was larger than post_max_size: PHP silently drops it.
$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > ini_bytes((string) ini_get('post_max_size'))) {
    fail('chunk_too_big', 413, 'chunk_too_big');
}

// Fields come from a normal form (FormData) or, for older clients, from X- headers.
function field(string $name, string $header): string
{
    if (isset($_POST[$name])) {
        return (string) $_POST[$name];
    }
    return (string) ($_SERVER['HTTP_' . $header] ?? '');
}

$id = field('uploadId', 'X_UPLOAD_ID');
$index = filter_var(field('index', 'X_CHUNK_INDEX'), FILTER_VALIDATE_INT);
$total = filter_var(field('total', 'X_CHUNK_TOTAL'), FILTER_VALIDATE_INT);
$size = filter_var(field('size', 'X_FILE_SIZE'), FILTER_VALIDATE_INT);
$name = clean_text(rawurldecode(field('name', 'X_FILE_NAME') ?: 'file'), 180);
$guest = clean_text(rawurldecode(field('guest', 'X_GUEST_NAME')), 80);
$maxBytes = (int) config()['max_file_mb'] * 1024 * 1024;

if (!preg_match('/^[a-f0-9]{16,64}$/i', $id)) {
    fail('bad_upload_id');
}
if ($index === false || $total === false || $size === false || $index < 0 || $total < 1 || $index >= $total || $total > 5000) {
    fail('bad_chunk');
}
if ($size < 1 || $size > $maxBytes) {
    fail('file_too_large', 413, 'too_big');
}
$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
if (!in_array($ext, MEDIA_EXT, true)) {
    fail('file_type_not_allowed', 415, 'bad_type');
}
if (!rate_limit('chunk', (int) config()['max_chunks_per_hour'])) {
    fail('rate_limited', 429);
}

// Occasionally sweep abandoned uploads (older than 2 days).
if (random_int(1, 200) === 1) {
    foreach (glob(storage_dir('tmp') . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        if (filemtime($dir) < time() - 172800) {
            rrmdir($dir);
        }
    }
}

$tmpDir = storage_dir('tmp/' . strtolower($id));

// Remember what this upload claims to be; later chunks must agree.
$metaFile = $tmpDir . '/meta.json';
$meta = ['name' => $name, 'size' => $size, 'total' => $total, 'guest' => $guest];
if (is_file($metaFile)) {
    $prev = json_decode((string) file_get_contents($metaFile), true);
    if (!is_array($prev) || $prev['size'] !== $size || $prev['total'] !== $total) {
        fail('upload_mismatch', 409);
    }
} else {
    file_put_contents($metaFile, json_encode($meta), LOCK_EX);
}

// Stream the chunk to disk without loading it into memory.
$part = sprintf('%s/%05d.part', $tmpDir, $index);
if (isset($_FILES['chunk'])) {
    $err = (int) $_FILES['chunk']['error'];
    if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
        fail('chunk_too_big', 413, 'chunk_too_big');
    }
    if ($err !== UPLOAD_ERR_OK) {
        fail('upload_error_' . $err, $err === UPLOAD_ERR_NO_TMP_DIR || $err === UPLOAD_ERR_CANT_WRITE ? 500 : 400);
    }
    $in = fopen($_FILES['chunk']['tmp_name'], 'rb');
} else {
    $in = fopen('php://input', 'rb');
}
$out = fopen($part . '.tmp', 'wb');
if (!$in || !$out) {
    fail('storage_not_writable', 500);
}
$written = stream_copy_to_stream($in, $out, MAX_CHUNK + 1);
fclose($in);
fclose($out);
if ($written === false || $written < 1 || $written > MAX_CHUNK) {
    @unlink($part . '.tmp');
    fail('bad_chunk_size', 413);
}
rename($part . '.tmp', $part);
touch($tmpDir);

// Not complete yet?
$parts = glob($tmpDir . '/*.part') ?: [];
if (count($parts) < $total) {
    json_out(['ok' => true, 'done' => false, 'received' => count($parts)]);
}

// All chunks are here: assemble exactly once (two final chunks may race).
$lock = fopen($tmpDir . '/.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    json_out(['ok' => true, 'done' => false, 'assembling' => true]);
}
if (!is_file($metaFile)) {            // another request already finished it
    json_out(['ok' => true, 'done' => true]);
}

$day = date('Y-m-d');
$destDir = storage_dir('uploads/' . $day);
$safeBase = preg_replace('/[^A-Za-z0-9._-]+/', '-', pathinfo($name, PATHINFO_FILENAME)) ?: 'file';
$safeBase = substr(trim($safeBase, '-.'), 0, 60) ?: 'file';
$stored = date('His') . '_' . substr(strtolower($id), 0, 8) . '_' . $safeBase . '.' . $ext;
$dest = $destDir . '/' . $stored;

$outFp = fopen($dest, 'wb');
if (!$outFp) {
    fail('storage_not_writable', 500);
}
for ($i = 0; $i < $total; $i++) {
    $p = sprintf('%s/%05d.part', $tmpDir, $i);
    $fp = @fopen($p, 'rb');
    if (!$fp) {
        fclose($outFp);
        @unlink($dest);
        fail('missing_chunk', 409);
    }
    stream_copy_to_stream($fp, $outFp);
    fclose($fp);
}
fclose($outFp);

$finalSize = filesize($dest);
if ($finalSize !== $size) {
    @unlink($dest);
    rrmdir($tmpDir);
    fail('size_mismatch', 422);
}

// Trust the bytes, not the browser: only real images / videos are kept.
$mime = 'application/octet-stream';
if (function_exists('finfo_open')) {
    $fi = finfo_open(FILEINFO_MIME_TYPE);
    $mime = (string) finfo_file($fi, $dest);
    finfo_close($fi);
}
$clientType = strtolower(field('type', 'X_FILE_TYPE'));
$isMedia = str_starts_with($mime, 'image/') || str_starts_with($mime, 'video/') || str_starts_with($mime, 'audio/');
// Some libmagic builds don't know HEIC / some MP4 brands: check the ISO-BMFF "ftyp" box instead.
if (!$isMedia && in_array($ext, ['heic', 'heif', 'avif', 'mp4', 'mov', 'm4v', 'm4a', '3gp', '3g2', 'hevc'], true)) {
    $head = (string) file_get_contents($dest, false, null, 0, 16);
    $isMedia = substr($head, 4, 4) === 'ftyp';
}
if (!$isMedia && in_array($ext, ['dng', 'tif', 'tiff'], true)) {
    $head = (string) file_get_contents($dest, false, null, 0, 4);
    $isMedia = $head === "II*\0" || $head === "MM\0*";
}
if (!$isMedia && in_array($ext, ['webm', 'weba'], true)) {
    $isMedia = file_get_contents($dest, false, null, 0, 4) === "\x1A\x45\xDF\xA3";   // EBML / Matroska
}
if (!$isMedia) {
    @unlink($dest);
    rrmdir($tmpDir);
    fail('file_type_not_allowed', 415, 'bad_type');
}

// A voice note recorded on the page is a webm/mp4 container with only sound in it:
// libmagic often calls it video/*, so the browser's own type decides.
if (str_starts_with($mime, 'audio/') || in_array($ext, AUDIO_EXT, true)
    || (str_starts_with($clientType, 'audio/') && in_array($ext, ['webm', 'mp4', 'ogg'], true))) {
    $kind = 'audio';
    if (!str_starts_with($mime, 'audio/')) {
        $mime = str_starts_with($clientType, 'audio/') ? preg_replace('/;.*/', '', $clientType) : 'audio/' . $ext;
    }
} elseif (in_array($ext, VIDEO_EXT, true) || str_starts_with($mime, 'video/')) {
    $kind = 'video';
} else {
    $kind = 'photo';
}

// Size of the photo / video, so the gallery can reserve the right space before it loads.
$dim = static function (string $f, string $hd): ?int {
    $v = filter_var(field($f, $hd), FILTER_VALIDATE_INT);
    return $v !== false && $v > 0 && $v < 40000 ? $v : null;
};
$w = $dim('w', 'X_WIDTH');
$h = $dim('h', 'X_HEIGHT');
$duration = filter_var(field('duration', 'X_DURATION'), FILTER_VALIDATE_FLOAT);
$duration = $duration !== false && $duration > 0 && $duration < 36000 ? round($duration, 1) : null;

$thumb = null;
if ($kind === 'photo') {
    $thumbRel = 'thumbs/' . substr(strtolower($id), 0, 16) . '.jpg';
    storage_dir('thumbs');
    $size2 = make_thumb($dest, storage_dir() . '/' . $thumbRel);
    if ($size2) {
        [$w, $h] = $size2;
        $thumb = $thumbRel;
    }
}

$record = [
    'id' => substr(strtolower($id), 0, 16),
    'time' => date('c'),
    'guest' => $guest,
    'original' => $name,
    'file' => 'uploads/' . $day . '/' . $stored,
    'thumb' => $thumb,
    'size' => $finalSize,
    'mime' => $mime,
    'kind' => $kind,
    'w' => $w,
    'h' => $h,
    'duration' => $duration,
    'visitor' => visitor_hash(),
];
append_jsonl(storage_file('media.jsonl'), $record);

flock($lock, LOCK_UN);
fclose($lock);
rrmdir($tmpDir);

$public = empty(config()['public_gallery']) ? null : media_public($record);
json_out(['ok' => true, 'done' => true, 'item' => $public]);
