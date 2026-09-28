<?php
/*
 * POST api/message.php  {name, message, lang, website}
 * Stores a guestbook note in storage/messages.jsonl
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';

require_post();

$raw = file_get_contents('php://input', false, null, 0, 32 * 1024);
$in = json_decode((string) $raw, true);
if (!is_array($in)) {
    $in = $_POST;
}

// Honeypot: bots fill every field. Pretend success, store nothing.
if (!empty($in['website'])) {
    json_out(['ok' => true]);
}

$name = clean_text((string) ($in['name'] ?? ''), 80);
$message = clean_text((string) ($in['message'] ?? ''), 2000);
$lang = in_array($in['lang'] ?? '', ['en', 'it', 'fr'], true) ? $in['lang'] : 'en';

if ($name === '' || $message === '') {
    fail('missing_fields', 422);
}
if (!rate_limit('msg', (int) config()['max_messages_per_hour'])) {
    fail('rate_limited', 429);
}

$record = [
    'id' => bin2hex(random_bytes(8)),
    'time' => date('c'),
    'name' => $name,
    'message' => $message,
    'lang' => $lang,
    'visitor' => visitor_hash(),
];
append_jsonl(storage_file('messages.jsonl'), $record);

$to = trim((string) config()['notify_email']);
if ($to !== '' && function_exists('mail')) {
    $subject = '=?UTF-8?B?' . base64_encode('💌 ' . $name . ' — Lindsey & Andrea') . '?=';
    @mail($to, $subject, $name . ":\n\n" . $message, "Content-Type: text/plain; charset=UTF-8\r\n");
}

json_out(['ok' => true]);
