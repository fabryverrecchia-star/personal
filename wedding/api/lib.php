<?php
/*
 * Shared helpers for the guestbook / upload endpoints and admin page.
 */

if (PHP_SAPI !== 'cli' && basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') {
    http_response_code(404);
    exit;
}

// If PHP itself fails (missing extension, old version…), answer with the exact
// reason as JSON instead of a bare "500": the page then shows what to fix.
@ini_set('display_errors', '0');
register_shutdown_function(function () {
    $e = error_get_last();
    if (!$e || !in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        return;
    }
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    $msg = preg_replace('/\s+/', ' ', (string) $e['message']);
    $msg = preg_replace('/ Stack trace:.*$/', '', (string) $msg);          // keep it short
    $msg = preg_replace('#(?:[A-Za-z]:)?[/\\\\][^\s:]*[/\\\\]#', '', (string) $msg);   // no server paths
    echo json_encode([
        'ok' => false,
        'error' => 'php: ' . substr((string) $msg, 0, 220) . ' (' . basename((string) $e['file']) . ':' . $e['line'] . ')',
        'code' => 'php_error',
    ]);
});

// Some hosts ship PHP without the mbstring extension.
if (!function_exists('mb_substr')) {
    function mb_substr($s, $start, $length = null, $encoding = null)
    {
        preg_match_all('/./us', (string) $s, $m);
        return implode('', array_slice($m[0], $start, $length));
    }
}

// PHP 7 compatibility (these arrived in PHP 8)
if (!function_exists('str_contains')) {
    function str_contains($haystack, $needle) { return $needle === '' || strpos($haystack, $needle) !== false; }
}
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) { return strncmp($haystack, $needle, strlen($needle)) === 0; }
}

const MEDIA_EXT = [
    // photos
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif', 'tif', 'tiff', 'dng',
    // videos
    'mp4', 'mov', 'm4v', 'webm', '3gp', '3g2', 'avi', 'mkv', 'hevc',
    // voice messages recorded on the page (webm/opus on Android & desktop, mp4/aac on iPhone)
    'm4a', 'mp3', 'wav', 'ogg', 'oga', 'opus', 'aac', 'weba',
];
const VIDEO_EXT = ['mp4', 'mov', 'm4v', 'webm', '3gp', '3g2', 'avi', 'mkv', 'hevc'];
const AUDIO_EXT = ['m4a', 'mp3', 'wav', 'ogg', 'oga', 'opus', 'aac', 'weba'];

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/config.php';
    }
    return $cfg;
}

/** "8M" / "2G" / "512K" → bytes */
function ini_bytes(string $v): int
{
    $v = trim($v);
    if ($v === '' || $v === '-1') {
        return PHP_INT_MAX;
    }
    $n = (float) $v;
    switch (strtolower(substr($v, -1))) {
        case 'g': $n *= 1024;
        // no break
        case 'm': $n *= 1024;
        // no break
        case 'k': $n *= 1024;
    }
    return (int) $n;
}

/** Largest chunk this server accepts in one request (leaves room for the form fields). */
function max_chunk_bytes(): int
{
    $limit = min(ini_bytes((string) ini_get('upload_max_filesize')), ini_bytes((string) ini_get('post_max_size')));
    return (int) max(256 * 1024, min(4 * 1024 * 1024, $limit - 64 * 1024));
}

/** Absolute storage directory (created and locked down on first use). */
function storage_dir(string $sub = ''): string
{
    $root = rtrim(config()['storage_dir'], '/');
    if (!is_dir($root)) {
        @mkdir($root, 0775, true);
    }
    if (!is_file($root . '/.htaccess')) {
        @file_put_contents($root . '/.htaccess', "Require all denied\n");
    }
    $path = $sub === '' ? $root : $root . '/' . trim($sub, '/');
    if (!is_dir($path)) {
        @mkdir($path, 0775, true);
    }
    return $path;
}

/** Absolute path of a file at the storage root. */
function storage_file(string $name): string
{
    return storage_dir() . '/' . $name;
}

function json_out(array $data, int $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $error, int $status = 400, ?string $code = null)
{
    json_out(['ok' => false, 'error' => $error, 'code' => $code ?? $error], $status);
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        fail('method_not_allowed', 405);
    }
}

/** Anonymous visitor id: the IP is never stored in clear text. */
function visitor_hash(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return substr(hash('sha256', $ip . '|' . salt()), 0, 16);
}

function salt(): string
{
    $file = storage_file('.salt');
    if (!is_file($file)) {
        @file_put_contents($file, bin2hex(random_bytes(16)), LOCK_EX);
    }
    return (string) @file_get_contents($file);
}

/** Fixed-window rate limit stored on disk. Returns false when over the limit. */
function rate_limit(string $bucket, int $max, int $window = 3600): bool
{
    $file = storage_dir('ratelimit') . '/' . $bucket . '-' . visitor_hash() . '.json';
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return true; // fail open rather than block guests
    }
    flock($fp, LOCK_EX);
    $data = json_decode((string) stream_get_contents($fp), true) ?: ['start' => time(), 'n' => 0];
    if (time() - $data['start'] > $window) {
        $data = ['start' => time(), 'n' => 0];
    }
    $data['n']++;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data));
    flock($fp, LOCK_UN);
    fclose($fp);
    return $data['n'] <= $max;
}

/** Append one JSON record per line, safely under concurrent requests. */
function append_jsonl(string $file, array $record): void
{
    $line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    if (@file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) {
        fail('storage_not_writable', 500);
    }
}

function read_jsonl(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $out = [];
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $row = json_decode($line, true);
        if (is_array($row)) {
            $out[] = $row;
        }
    }
    return $out;
}

function clean_text(string $s, int $max): string
{
    $s = str_replace("\0", '', $s);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    $s = trim($s);
    return mb_substr($s, 0, $max);
}

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function rrmdir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (scandir($dir) ?: [] as $f) {
        if ($f === '.' || $f === '..') {
            continue;
        }
        $p = $dir . '/' . $f;
        is_dir($p) ? rrmdir($p) : @unlink($p);
    }
    @rmdir($dir);
}

/* ───────────── Media index & moderation ───────────── */

function media_all(): array
{
    return read_jsonl(storage_file('media.jsonl'));
}

function media_find(string $id): ?array
{
    foreach (media_all() as $m) {
        if (hash_equals((string) $m['id'], $id)) {
            return $m;
        }
    }
    return null;
}

/** Ids the couple hid from the public gallery (admin.php). */
function hidden_ids(): array
{
    $file = storage_file('hidden.json');
    $ids = is_file($file) ? json_decode((string) file_get_contents($file), true) : [];
    return is_array($ids) ? $ids : [];
}

function set_hidden(string $id, bool $hidden): void
{
    $ids = array_values(array_diff(hidden_ids(), [$id]));
    if ($hidden) {
        $ids[] = $id;
    }
    file_put_contents(storage_file('hidden.json'), json_encode($ids), LOCK_EX);
}

/** Remove one upload for good: file, thumbnail and its line in media.jsonl. */
function media_delete(string $id): void
{
    $file = storage_file('media.jsonl');
    $fp = fopen($file, 'c+');
    if (!$fp) {
        return;
    }
    flock($fp, LOCK_EX);
    $keep = '';
    while (($line = fgets($fp)) !== false) {
        $row = json_decode($line, true);
        if (is_array($row) && hash_equals((string) $row['id'], $id)) {
            foreach (['file', 'thumb'] as $k) {
                if (!empty($row[$k]) && !str_contains($row[$k], '..')) {
                    @unlink(storage_dir() . '/' . $row[$k]);
                }
            }
            continue;
        }
        $keep .= $line;
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $keep);
    flock($fp, LOCK_UN);
    fclose($fp);
    set_hidden($id, false);
}

/** Send a stored file, with HTTP Range support (iPhone Safari needs it to play video/audio). */
function stream_file(string $path, string $mime, string $name, bool $download, string $cache)
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    $size = filesize($path);
    $start = 0;
    $end = $size - 1;
    header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
    header('Accept-Ranges: bytes');
    header('Cache-Control: ' . $cache);
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: ' . ($download ? 'attachment' : 'inline') . "; filename*=UTF-8''" . rawurlencode($name));
    if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $r)) {
        if ($r[1] === '' && $r[2] !== '') {
            $start = max(0, $size - (int) $r[2]);
        } else {
            $start = (int) $r[1];
            if ($r[2] !== '') {
                $end = min((int) $r[2], $size - 1);
            }
        }
        if ($start > $end || $start >= $size) {
            http_response_code(416);
            header("Content-Range: bytes */$size");
            exit;
        }
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
    }
    header('Content-Length: ' . ($end - $start + 1));
    @set_time_limit(0);
    $fp = fopen($path, 'rb');
    fseek($fp, $start);
    $left = $end - $start + 1;
    while ($left > 0 && !feof($fp) && !connection_aborted()) {
        $buf = fread($fp, (int) min(262144, $left));
        echo $buf;
        $left -= strlen($buf);
        flush();
    }
    fclose($fp);
    exit;
}

/**
 * Small JPEG preview for the gallery grid (GD). Honors the camera's EXIF
 * rotation. Returns [width, height] of the upright photo, or null when the
 * format isn't supported by GD (e.g. HEIC) — the grid then uses the original.
 */
function make_thumb(string $src, string $dest, int $max = 720): ?array
{
    if (!function_exists('imagecreatetruecolor')) {
        return null;
    }
    $info = @getimagesize($src);
    if (!$info) {
        return null;
    }
    [$w, $h, $type] = $info;
    if ($w < 1 || $h < 1 || $w * $h > 60000000) {
        return null;
    }
    $img = false;
    if ($type === IMAGETYPE_JPEG) {
        $img = @imagecreatefromjpeg($src);
    } elseif ($type === IMAGETYPE_PNG) {
        $img = @imagecreatefrompng($src);
    } elseif (defined('IMAGETYPE_WEBP') && $type === IMAGETYPE_WEBP && function_exists('imagecreatefromwebp')) {
        $img = @imagecreatefromwebp($src);
    } elseif ($type === IMAGETYPE_GIF) {
        $img = @imagecreatefromgif($src);
    }
    if (!$img) {
        return null;
    }
    if ($type === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $o = (int) (@exif_read_data($src)['Orientation'] ?? 1);
        if ($o === 3) {
            $img = imagerotate($img, 180, 0);
        } elseif ($o === 6) {
            $img = imagerotate($img, -90, 0);
        } elseif ($o === 8) {
            $img = imagerotate($img, 90, 0);
        }
        $w = imagesx($img);
        $h = imagesy($img);
    }
    $scale = min(1, $max / max($w, $h));
    $tw = max(1, (int) round($w * $scale));
    $th = max(1, (int) round($h * $scale));
    $thumb = imagecreatetruecolor($tw, $th);
    imagefill($thumb, 0, 0, imagecolorallocate($thumb, 247, 243, 236));
    imagecopyresampled($thumb, $img, 0, 0, 0, 0, $tw, $th, $w, $h);
    imageinterlace($thumb, 1);
    $ok = imagejpeg($thumb, $dest, 78);
    return $ok ? [$w, $h] : null;
}

/** Public shape of an upload for the gallery (no visitor hash, no file paths). */
function media_public(array $m): array
{
    $id = rawurlencode((string) $m['id']);
    return [
        'id' => $m['id'],
        'kind' => $m['kind'],
        'guest' => $m['guest'] ?? '',
        'time' => $m['time'],
        'w' => $m['w'] ?? null,
        'h' => $m['h'] ?? null,
        'duration' => $m['duration'] ?? null,
        'mime' => $m['mime'],
        'src' => 'api/media.php?id=' . $id,
        'thumb' => !empty($m['thumb']) ? 'api/media.php?id=' . $id . '&v=thumb' : null,
    ];
}
