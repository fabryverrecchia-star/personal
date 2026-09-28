<?php
/*
 * Suivi La Petite Maison : passages et missions en cours, partagés entre tous les visiteurs.
 *   GET  suivi.php                  → { passages: [...], missions: [...] }
 *   GET  suivi.php?diag             → version PHP et droits d'écriture (installation)
 *   POST suivi.php (formulaire : payload = JSON, code = code équipe)
 *        { action: "check" }
 *        { action: "add",    kind: "missions"|"passages", item: {...} }
 *        { action: "update", kind: "missions", id, status }
 *        { action: "edit",   kind: "missions"|"passages", id, item: {...} }
 *        { action: "delete", kind: "missions"|"passages", id }
 * Les données sont dans data/suivi.json (dossier protégé par .htaccess).
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$FILE = __DIR__ . '/data/suivi.json';
$config = require __DIR__ . '/config.php';

function out($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function clean($s, $max) {
  $s = trim(preg_replace('/\s+/u', ' ', (string) $s));
  $s = strip_tags($s);
  return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max * 2);
}
function empty_data() { return ['passages' => [], 'missions' => []]; }

$method = $_SERVER['REQUEST_METHOD'];

// Diagnostic d'installation (sans secret) : suivi.php?diag
if ($method === 'GET' && isset($_GET['diag'])) {
  out([
    'php' => PHP_VERSION,
    'data_exists' => is_file($FILE),
    'data_writable' => is_file($FILE) ? is_writable($FILE) : is_writable(dirname($FILE)),
    'dir_writable' => is_writable(dirname($FILE)),
    'password_verify' => function_exists('password_verify'),
  ]);
}

if ($method === 'GET') {
  $raw = is_file($FILE) ? file_get_contents($FILE) : '';
  $data = $raw ? json_decode($raw, true) : null;
  out(is_array($data) ? $data : empty_data());
}

if ($method !== 'POST') out(['error' => 'method'], 405);

// Requête : formulaire classique (payload + code), ou JSON brut en repli.
// Le code passe dans le corps : certains hébergeurs suppriment les en-têtes personnalisés.
$in = isset($_POST['payload']) ? json_decode((string) $_POST['payload'], true) : json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(['error' => 'json'], 400);

// Mode équipe : le code est vérifié à chaque écriture
$code = isset($_POST['code']) ? (string) $_POST['code'] : (isset($in['code']) ? (string) $in['code'] : '');
if ($code === '' && isset($_SERVER['HTTP_X_ADMIN_CODE'])) $code = (string) $_SERVER['HTTP_X_ADMIN_CODE'];
if ($code === '' || !password_verify($code, $config['admin_hash'])) {
  usleep(700000); // freine les essais au hasard
  out(['error' => 'code'], 403);
}

$action = isset($in['action']) ? $in['action'] : '';
if ($action === 'check') {
  // On vérifie aussi que les modifications pourront être enregistrées
  $w = is_file($FILE) ? is_writable($FILE) : is_writable(dirname($FILE));
  out($w ? ['ok' => true] : ['error' => 'storage'], $w ? 200 : 500);
}

$kind = isset($in['kind']) ? $in['kind'] : '';
if (!in_array($kind, ['missions', 'passages'], true)) out(['error' => 'kind'], 400);

$TEAM = ['Fabrizio', 'Jade'];
$CATS = ['photo', 'video', 'montage', 'planning', 'redaction', 'autre'];
$STATUS = ['todo', 'doing', 'done'];
$KINDS = ['photo', 'video', 'both', 'meeting'];

// Lecture + écriture sous verrou : deux personnes qui modifient en même temps ne s'écrasent pas
$fp = @fopen($FILE, 'c+');
if (!$fp) out(['error' => 'storage'], 500);
flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$data = $raw ? json_decode($raw, true) : null;
if (!is_array($data)) $data = empty_data();
if (!isset($data[$kind]) || !is_array($data[$kind])) $data[$kind] = [];

if ($action === 'add') {
  $it = isset($in['item']) && is_array($in['item']) ? $in['item'] : [];
  $id = substr($kind, 0, 1) . bin2hex(random_bytes(5));
  if ($kind === 'missions') {
    $title = clean(isset($it['title']) ? $it['title'] : '', 140);
    $by = isset($it['by']) ? $it['by'] : '';
    $cat = isset($it['cat']) ? $it['cat'] : 'autre';
    $st = isset($it['status']) ? $it['status'] : 'todo';
    if ($title === '' || !in_array($by, $TEAM, true)) { flock($fp, LOCK_UN); out(['error' => 'item'], 400); }
    $item = [
      'id' => $id, 'title' => $title,
      'cat' => in_array($cat, $CATS, true) ? $cat : 'autre',
      'status' => in_array($st, $STATUS, true) ? $st : 'todo',
      'by' => $by, 'at' => date('Y-m-d'),
    ];
    array_unshift($data[$kind], $item);
  } else {
    $date = isset($it['date']) ? $it['date'] : '';
    $k = isset($it['kind']) ? $it['kind'] : 'photo';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) { flock($fp, LOCK_UN); out(['error' => 'item'], 400); }
    $item = [
      'id' => $id, 'date' => $date,
      'time' => clean(isset($it['time']) ? $it['time'] : '', 30),
      'kind' => in_array($k, $KINDS, true) ? $k : 'photo',
      'title' => clean(isset($it['title']) ? $it['title'] : '', 140),
    ];
    $data[$kind][] = $item;
    usort($data[$kind], function ($a, $b) { return strcmp($a['date'], $b['date']); });
  }
} elseif ($action === 'edit') {
  // Modifier une mission ou un passage déjà publié
  $id = isset($in['id']) ? $in['id'] : '';
  $it = isset($in['item']) && is_array($in['item']) ? $in['item'] : [];
  foreach ($data[$kind] as &$x) {
    if ($x['id'] !== $id) continue;
    if ($kind === 'missions') {
      $title = clean(isset($it['title']) ? $it['title'] : '', 140);
      if ($title !== '') $x['title'] = $title;
      if (isset($it['cat']) && in_array($it['cat'], $CATS, true)) $x['cat'] = $it['cat'];
      if (isset($it['status']) && in_array($it['status'], $STATUS, true)) $x['status'] = $it['status'];
      if (isset($it['by']) && in_array($it['by'], $TEAM, true)) $x['by'] = $it['by'];
    } else {
      if (isset($it['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $it['date'])) $x['date'] = $it['date'];
      if (isset($it['time'])) $x['time'] = clean($it['time'], 30);
      if (isset($it['kind']) && in_array($it['kind'], $KINDS, true)) $x['kind'] = $it['kind'];
      if (isset($it['title'])) $x['title'] = clean($it['title'], 140);
    }
  }
  unset($x);
  if ($kind === 'passages') usort($data[$kind], function ($a, $b) { return strcmp($a['date'], $b['date']); });
} elseif ($action === 'update' && $kind === 'missions') {
  $st = isset($in['status']) ? $in['status'] : '';
  if (!in_array($st, $STATUS, true)) { flock($fp, LOCK_UN); out(['error' => 'status'], 400); }
  foreach ($data[$kind] as &$m) if ($m['id'] === (isset($in['id']) ? $in['id'] : '')) $m['status'] = $st;
  unset($m);
} elseif ($action === 'delete') {
  $id = isset($in['id']) ? $in['id'] : '';
  $data[$kind] = array_values(array_filter($data[$kind], function ($x) use ($id) { return $x['id'] !== $id; }));
} else {
  flock($fp, LOCK_UN);
  out(['error' => 'action'], 400);
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);
out($data);
