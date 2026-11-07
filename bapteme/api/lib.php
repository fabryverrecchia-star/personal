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
// some hosts disable ini_set(): every call goes through this guard
function ini_try(string $k, string $v): void
{
    if (function_exists('ini_set')) {
        @ini_set($k, $v);
    }
}
ini_try('display_errors', '0');

function time_limit(int $seconds): void
{
    if (function_exists('set_time_limit')) {
        @set_time_limit($seconds);
    }
}
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
    jsonl_delete('media.jsonl', $id);
    set_hidden($id, false);
}

/** Remove one line of an index (and the files it points to). */
function jsonl_delete(string $index, string $id): void
{
    $file = storage_file($index);
    $fp = fopen($file, 'c+');
    if (!$fp) {
        return;
    }
    flock($fp, LOCK_EX);
    $keep = '';
    while (($line = fgets($fp)) !== false) {
        $row = json_decode($line, true);
        if (is_array($row) && hash_equals((string) $row['id'], $id)) {
            foreach (['file', 'thumb', 'web'] as $k) {
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
    time_limit(0);
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
function make_thumb(string $src, string $dest, int $max = 720, int $quality = 78): ?array
{
    if (!function_exists('imagecreatetruecolor')) {
        return null;
    }
    $info = @getimagesize($src);
    if (!$info) {
        return null;
    }
    [$w, $h, $type] = $info;
    if ($w < 1 || $h < 1 || $w * $h > 120000000) {
        return null;
    }
    if (!memory_for_image($w, $h)) {
        return null;              // pas assez de mémoire : mieux vaut pas d'aperçu qu'une erreur fatale
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
    $ok = imagejpeg($thumb, $dest, $quality);
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
        'size' => (int) ($m['size'] ?? 0),
        'src' => 'api/media.php?id=' . $id,
        'thumb' => !empty($m['thumb']) ? 'api/media.php?id=' . $id . '&v=thumb' : null,
    ];
}

/* ───────────── ZIP à la volée (album complet) ───────────── */

/**
 * Sends a ZIP of the given files straight to the browser, one file after the other:
 * nothing is copied on the server (no temporary archive), files are stored as-is
 * (photos and videos are already compressed), the download size is known in advance
 * (the browser shows real progress), and ZIP64 kicks in past 4 GB.
 *
 * $entries: [['path' => absolute file, 'name' => name inside the zip], …]
 * $extra:   [['name' => …, 'data' => string], …] small text files added at the end
 */
function zip_stream(array $entries, string $downloadName, array $extra = [])
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    time_limit(0);
    ignore_user_abort(false);
    // pas de compression gzip par le serveur : elle fausserait la taille annoncée
    ini_try('zlib.output_compression', 'Off');
    if (function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', '1');
    }
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }

    $files = [];
    foreach ($entries as $e) {
        if (is_file($e['path'])) {
            $files[] = ['name' => $e['name'], 'path' => $e['path'], 'size' => (int) filesize($e['path']), 'time' => (int) filemtime($e['path'])];
        }
    }
    foreach ($extra as $e) {
        $files[] = ['name' => $e['name'], 'data' => (string) $e['data'], 'size' => strlen((string) $e['data']), 'time' => time()];
    }

    // Exact layout first, to announce the total size.
    $offset = 0;
    foreach ($files as &$f) {
        $f['offset'] = $offset;
        $offset += 30 + strlen($f['name']) + $f['size'] + 16;       // local header + data + data descriptor
    }
    unset($f);
    $cdStart = $offset;
    $cdSize = 0;
    foreach ($files as $f) {
        $cdSize += 46 + strlen($f['name']) + ($f['offset'] >= 0xFFFFFFFF ? 12 : 0);
    }
    $zip64 = $cdStart + $cdSize >= 0xFFFFFFFF || count($files) >= 0xFFFF;
    $length = $cdStart + $cdSize + ($zip64 ? 56 + 20 : 0) + 22;

    header('Content-Type: application/zip');
    header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($downloadName));
    header('Content-Length: ' . $length);
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');

    $dos = function (int $t): array {
        $d = getdate($t);
        return [
            (($d['hours'] & 31) << 11) | (($d['minutes'] & 63) << 5) | (int) floor($d['seconds'] / 2),
            ((max(1980, $d['year']) - 1980) << 9) | ($d['mon'] << 5) | $d['mday'],
        ];
    };
    $flags = 0x0008 | 0x0800;                                         // sizes after the data · UTF-8 names

    foreach ($files as $i => $f) {
        [$dt, $dd] = $dos($f['time']);
        $files[$i]['dt'] = $dt;
        $files[$i]['dd'] = $dd;
        echo pack('VvvvvvVVVvv', 0x04034b50, 20, $flags, 0, $dt, $dd, 0, 0, 0, strlen($f['name']), 0), $f['name'];
        $h = hash_init('crc32b');
        if (isset($f['data'])) {
            hash_update($h, $f['data']);
            echo $f['data'];
        } else {
            $fp = fopen($f['path'], 'rb');
            while ($fp && !feof($fp)) {
                $buf = fread($fp, 1048576);
                if ($buf === false || $buf === '') {
                    break;
                }
                hash_update($h, $buf);
                echo $buf;
                flush();
                if (connection_aborted()) {
                    fclose($fp);
                    exit;
                }
            }
            if ($fp) {
                fclose($fp);
            }
        }
        $crc = unpack('N', hash_final($h, true))[1];
        $files[$i]['crc'] = $crc;
        echo pack('VVVV', 0x08074b50, $crc, $f['size'], $f['size']);
    }

    foreach ($files as $f) {
        $big = $f['offset'] >= 0xFFFFFFFF;
        $extraField = $big ? pack('vvP', 0x0001, 8, $f['offset']) : '';
        // créé « sous Unix » avec des droits de lecture normaux (sinon le Mac peut extraire des fichiers illisibles)
        echo pack('VvvvvvvVVVvvvvvVV', 0x02014b50, (3 << 8) | 45, $big ? 45 : 20, $flags, 0, $f['dt'], $f['dd'],
            $f['crc'], $f['size'], $f['size'], strlen($f['name']), strlen($extraField), 0, 0, 0, 0100644 << 16,
            $big ? 0xFFFFFFFF : $f['offset']), $f['name'], $extraField;
    }
    $n = count($files);
    if ($zip64) {
        $eocd64 = $cdStart + $cdSize;
        echo pack('VPvvVVPPPP', 0x06064b50, 44, 45, 45, 0, 0, $n, $n, $cdSize, $cdStart);
        echo pack('VVPV', 0x07064b50, 0, $eocd64, 1);
    }
    echo pack('VvvvvVVv', 0x06054b50, 0, 0, min($n, 0xFFFF), min($n, 0xFFFF),
        min($cdSize, 0xFFFFFFFF), $zip64 ? 0xFFFFFFFF : $cdStart, 0);
    flush();
    exit;
}

/** Readable, unique names inside the album zip: "Prénom/fichier.jpg". */
function zip_entries(array $media): array
{
    $out = [];
    $used = [];
    foreach ($media as $m) {
        if (empty($m['file']) || str_contains($m['file'], '..')) {
            continue;
        }
        $who = trim(preg_replace('/[\\\\\/:*?"<>|\x00-\x1F]+/u', '', (string) ($m['guest'] ?? '')) ?? '');
        $who = $who !== '' ? mb_substr($who, 0, 60) : 'Invité';
        $file = preg_replace('/[\\\\\/:*?"<>|\x00-\x1F]+/u', '-', (string) ($m['original'] ?: basename($m['file']))) ?: basename($m['file']);
        $name = $who . '/' . $file;
        if (isset($used[strtolower($name)])) {
            $name = $who . '/' . pathinfo($file, PATHINFO_FILENAME) . '-' . substr((string) $m['id'], 0, 6) . (pathinfo($file, PATHINFO_EXTENSION) !== '' ? '.' . pathinfo($file, PATHINFO_EXTENSION) : '');
        }
        $used[strtolower($name)] = true;
        $out[] = ['path' => storage_dir() . '/' . $m['file'], 'name' => $name];
    }
    return $out;
}


/* ───────────── Espace privé & reportage du photographe ───────────── */

/** True when the visitor is logged in to admin.php (same session). */
function is_admin(): bool
{
    static $ok = null;
    if ($ok === null) {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_name('lou_admin');
            if (!isset($_COOKIE['lou_admin'])) {
                return $ok = false;
            }
            @session_start(['read_and_close' => true]);
        }
        $ok = !empty($_SESSION['ok']);
    }
    return $ok;
}

/** Guests may download the photographer's originals (config 'pro_download', on by default). */
function pro_download_allowed(): bool
{
    return (bool) (config()['pro_download'] ?? true);
}

/** The photographer's photos, in the order of their file names (IMG_0001, IMG_0002…). */
function pro_all(): array
{
    $all = read_jsonl(storage_file('pro.jsonl'));
    usort($all, function ($a, $b) {
        return strnatcasecmp((string) $a['original'], (string) $b['original']) ?: strcmp((string) $a['time'], (string) $b['time']);
    });
    return $all;
}

function pro_find(string $id): ?array
{
    foreach (read_jsonl(storage_file('pro.jsonl')) as $m) {
        if (hash_equals((string) $m['id'], $id)) {
            return $m;
        }
    }
    return null;
}

function pro_public(array $m): array
{
    $id = rawurlencode((string) $m['id']);
    $base = 'api/media.php?set=pro&id=' . $id;
    return [
        'id' => $m['id'],
        'kind' => $m['kind'],
        'name' => $m['original'],
        'w' => $m['w'] ?? null,
        'h' => $m['h'] ?? null,
        'size' => (int) ($m['size'] ?? 0),
        'mime' => $m['mime'],
        'src' => $base . (!empty($m['web']) ? '&v=web' : ''),
        'thumb' => !empty($m['thumb']) ? $base . '&v=thumb' : null,
        'dl' => pro_download_allowed() ? $base . '&dl=1' : null,
    ];
}


/** "128M" → bytes ; -1 → illimité */
function memory_limit_bytes(): int
{
    $v = (string) ini_get('memory_limit');
    return $v === '' || $v === '-1' ? PHP_INT_MAX : ini_bytes($v);
}

/**
 * GD needs ~5 bytes per pixel to open a photo (a 33 Mpx camera JPEG ≈ 160 MB).
 * Raises memory_limit when the host allows it; says false when it won't fit.
 */
function memory_for_image(int $w, int $h): bool
{
    $need = (int) ($w * $h * 5.2) + 24 * 1048576;
    $free = memory_limit_bytes() - memory_get_usage(true);
    if ($free >= $need) {
        return true;
    }
    $want = memory_get_usage(true) + $need + 64 * 1048576;
    ini_try('memory_limit', (string) (int) ceil($want / 1048576) . 'M');
    return memory_limit_bytes() - memory_get_usage(true) >= $need;
}

/** Rewrite some fields of one line of pro.jsonl. */
function pro_update(string $id, array $fields): ?array
{
    $file = storage_file('pro.jsonl');
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return null;
    }
    flock($fp, LOCK_EX);
    $out = '';
    $found = null;
    while (($line = fgets($fp)) !== false) {
        $row = json_decode($line, true);
        if (is_array($row) && hash_equals((string) $row['id'], $id)) {
            $row = array_merge($row, $fields);
            $found = $row;
            $line = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
        }
        $out .= $line;
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $out);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $found;
}

/** Web (2400 px) + thumbnail (800 px) of a photographer's photo, made on the server when memory allows. */
function pro_server_previews(array $m): array
{
    $short = (string) $m['id'];
    $src = storage_dir() . '/' . $m['file'];
    storage_dir('pro/web');
    storage_dir('pro/thumbs');
    $out = [];
    try {
        $sz = make_thumb($src, storage_dir() . '/pro/web/' . $short . '.jpg', 2400, 86);
        if ($sz) {
            $out['web'] = 'pro/web/' . $short . '.jpg';
            [$out['w'], $out['h']] = $sz;
            // la miniature part de la version écran : bien plus léger que l'original
            if (make_thumb(storage_dir() . '/' . $out['web'], storage_dir() . '/pro/thumbs/' . $short . '.jpg', 800, 80)) {
                $out['thumb'] = 'pro/thumbs/' . $short . '.jpg';
            }
        }
    } catch (\Throwable $e) {
        // pas d'aperçu : l'espace privé le préparera dans le navigateur
    }
    return $out;
}

/** Stream a URL to a file (curl, or fopen as a fallback). Returns [ok, bytes, contentType, error]. */
function http_download(string $url, string $dest, int $maxBytes): array
{
    $out = @fopen($dest, 'wb');
    if (!$out) {
        return [false, 0, '', 'storage_not_writable'];
    }
    $bytes = 0;
    $type = '';
    $err = '';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 6,
            CURLOPT_CONNECTTIMEOUT => 20,
            CURLOPT_TIMEOUT => 600,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (bapteme-lou import)',
            CURLOPT_WRITEFUNCTION => function ($ch, $data) use ($out, &$bytes, $maxBytes) {
                $bytes += strlen($data);
                if ($bytes > $maxBytes) {
                    return 0;                                   // trop gros : on coupe
                }
                return fwrite($out, $data);
            },
        ]);
        $ok = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $type = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        if (!$ok || $code >= 400) {
            $err = $code >= 400 ? 'HTTP ' . $code : curl_error($ch);
        }
        curl_close($ch);
    } elseif (filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        $ctx = stream_context_create(['http' => ['follow_location' => 1, 'timeout' => 600, 'user_agent' => 'Mozilla/5.0 (bapteme-lou import)']]);
        $in = @fopen($url, 'rb', false, $ctx);
        if (!$in) {
            $err = 'download_failed';
        } else {
            while (!feof($in)) {
                $buf = fread($in, 1048576);
                if ($buf === false) {
                    break;
                }
                $bytes += strlen($buf);
                if ($bytes > $maxBytes) {
                    $err = 'too_big';
                    break;
                }
                fwrite($out, $buf);
            }
            foreach ($http_response_header ?? [] as $hdr) {
                if (stripos($hdr, 'content-type:') === 0) {
                    $type = trim(substr($hdr, 13));
                }
            }
            fclose($in);
        }
    } else {
        $err = 'no_curl';
    }
    fclose($out);
    return [$err === '', $bytes, $type, $err];
}
