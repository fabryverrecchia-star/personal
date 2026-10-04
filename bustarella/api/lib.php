<?php
/*
 * Shared helpers for the bustarella endpoint and admin page.
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

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/config.php';
    }
    return $cfg;
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
