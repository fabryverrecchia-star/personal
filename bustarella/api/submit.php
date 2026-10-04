<?php
/*
 * POST api/submit.php
 *   type=iban   holder, iban, note
 *   type=quiz   answers (JSON: [{q, who, answer}, …])
 * Stored in storage/entries.jsonl, readable only in admin.php.
 */
require __DIR__ . '/lib.php';

require_post();
if (!empty($_POST['website'])) {            // honeypot
    json_out(['ok' => true]);
}
if (!rate_limit('submit', 30)) {
    fail('rate_limited', 429);
}

/** ISO 13616 check: length per country + mod-97 = 1. */
function iban_valid(string $iban): bool
{
    $len = ['AD' => 24, 'AT' => 20, 'BE' => 16, 'BG' => 22, 'CH' => 21, 'CY' => 28, 'CZ' => 24, 'DE' => 22, 'DK' => 18,
        'EE' => 20, 'ES' => 24, 'FI' => 18, 'FR' => 27, 'GB' => 22, 'GR' => 27, 'HR' => 21, 'HU' => 28, 'IE' => 22,
        'IS' => 26, 'IT' => 27, 'LI' => 21, 'LT' => 20, 'LU' => 20, 'LV' => 21, 'MC' => 27, 'MT' => 31, 'NL' => 18,
        'NO' => 15, 'PL' => 28, 'PT' => 25, 'RO' => 24, 'SE' => 24, 'SI' => 19, 'SK' => 24, 'SM' => 27, 'VA' => 22];
    if (!preg_match('/^([A-Z]{2})(\d{2})([A-Z0-9]{10,30})$/', $iban, $m)) {
        return false;
    }
    if (isset($len[$m[1]]) && strlen($iban) !== $len[$m[1]]) {
        return false;
    }
    $num = '';
    foreach (str_split(substr($iban, 4) . substr($iban, 0, 4)) as $c) {
        $num .= ctype_alpha($c) ? (string) (ord($c) - 55) : $c;
    }
    $rest = 0;
    foreach (str_split($num, 7) as $part) {
        $rest = (int) ($rest . $part) % 97;
    }
    return $rest === 1;
}

$type = (string) ($_POST['type'] ?? '');
$record = ['id' => bin2hex(random_bytes(8)), 'time' => date('c'), 'type' => $type, 'visitor' => visitor_hash()];

if ($type === 'iban') {
    $iban = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($_POST['iban'] ?? '')));
    $holder = clean_text((string) ($_POST['holder'] ?? ''), 120);
    if ($holder === '') {
        fail('missing_holder', 422);
    }
    if (!iban_valid($iban)) {
        fail('invalid_iban', 422);
    }
    $record['holder'] = $holder;
    $record['iban'] = $iban;
    $record['note'] = clean_text((string) ($_POST['note'] ?? ''), 500);
} elseif ($type === 'quiz') {
    $answers = json_decode((string) ($_POST['answers'] ?? ''), true);
    if (!is_array($answers) || count($answers) > 20) {
        fail('invalid_answers', 422);
    }
    $record['answers'] = array_map(function ($a) {
        return [
            'q' => clean_text((string) ($a['q'] ?? ''), 200),
            'who' => clean_text((string) ($a['who'] ?? ''), 40),
            'answer' => clean_text((string) ($a['answer'] ?? ''), 200),
        ];
    }, array_values($answers));
} else {
    fail('bad_type');
}

append_jsonl(storage_file('entries.jsonl'), $record);
json_out(['ok' => true]);
