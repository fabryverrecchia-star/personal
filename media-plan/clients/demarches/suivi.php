<?php
/*
 * Suivi Démarches (Helicave) : price list, missions en cours, avancement global et passages,
 * partagés entre tous les visiteurs.
 *   GET  suivi.php                  → { progress: 0-100, passages: [...], missions: [...], prices: { vat, credit, sections, items } }
 *   GET  suivi.php?diag             → version PHP et droits d'écriture (installation)
 *   Les données ne sont lues qu'avec un code d'accès (demandé au chargement de la page) :
 *   POST suivi.php (formulaire : payload = JSON, code = code d'accès)
 *        { action: "login" }  → { role: "edit"|"view", name, data }   (Fabrizio modifie, Guillaume consulte)
 *        { action: "check" }
 *        { action: "add",    kind: "missions"|"passages", item: {...} }
 *        { action: "update", kind: "missions", id, status }
 *        { action: "edit",   kind: "missions"|"passages", id, item: {...} }
 *        { action: "delete", kind: "missions"|"passages", id }
 *        { action: "progress", value: 0|25|50|75|100 }
 *   Price list (kind: "prices") :
 *        { action: "add"|"edit", kind: "prices", id?, item: { sec | "__new", secTitle?, title, detail, unit, price, qty, status } }
 *        { action: "update", kind: "prices", id, status: "off"|"on"|"done" }   (Proposé / Engagé / Livré)
 *        { action: "delete", kind: "prices", id }
 *        { action: "settings", kind: "prices", credit: enveloppe HT (0 = aucune), vat: 0.2|0 }
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

function read_data($FILE) {
  $raw = is_file($FILE) ? file_get_contents($FILE) : '';
  $data = $raw ? json_decode($raw, true) : null;
  return is_array($data) ? $data : empty_data();
}

// Lecture sans code refusée : la page est privée
if ($method === 'GET') out(['error' => 'code'], 403);
if ($method !== 'POST') out(['error' => 'method'], 405);

// Requête : formulaire classique (payload + code), ou JSON brut en repli.
// Le code passe dans le corps : certains hébergeurs suppriment les en-têtes personnalisés.
$in = isset($_POST['payload']) ? json_decode((string) $_POST['payload'], true) : json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(['error' => 'json'], 400);

// Mode équipe : le code est vérifié à chaque écriture
$code = isset($_POST['code']) ? (string) $_POST['code'] : (isset($in['code']) ? (string) $in['code'] : '');
if ($code === '' && isset($_SERVER['HTTP_X_ADMIN_CODE'])) $code = (string) $_SERVER['HTTP_X_ADMIN_CODE'];
$action = isset($in['action']) ? $in['action'] : '';
$isAdmin = $code !== '' && password_verify($code, $config['admin_hash']);
$isViewer = !$isAdmin && $code !== '' && !empty($config['view_hash']) && password_verify($code, $config['view_hash']);

// Connexion : Fabrizio (modification) ou Guillaume (consultation)
if ($action === 'login' && ($isAdmin || $isViewer)) {
  out([
    'role' => $isAdmin ? 'edit' : 'view',
    'name' => $isAdmin ? $config['admin_name'] : $config['view_name'],
    'data' => read_data($FILE),
  ]);
}
// Toute modification demande le code de Fabrizio
if (!$isAdmin) {
  usleep(700000); // freine les essais au hasard
  out(['error' => $isViewer ? 'readonly' : 'code'], 403);
}
if ($action === 'check') {
  // On vérifie aussi que les modifications pourront être enregistrées
  $w = is_file($FILE) ? is_writable($FILE) : is_writable(dirname($FILE));
  out($w ? ['ok' => true] : ['error' => 'storage'], $w ? 200 : 500);
}

$kind = isset($in['kind']) ? $in['kind'] : '';
if ($action === 'progress') $kind = 'missions';
if (!in_array($kind, ['missions', 'passages', 'prices'], true)) out(['error' => 'kind'], 400);

$TEAM = ['Fabrizio', 'Helicave', 'Guillaume'];
$CATS = ['print', 'branding', 'meeting', 'photo', 'video', 'montage', 'planning', 'redaction', 'web', 'autre'];
$PSTATUS = ['off', 'on', 'done'];
$STATUS = ['todo', 'doing', 'wait', 'done'];
$KINDS = ['photo', 'video', 'both', 'meeting'];

// Lecture + écriture sous verrou : deux personnes qui modifient en même temps ne s'écrasent pas
$fp = @fopen($FILE, 'c+');
if (!$fp) out(['error' => 'storage'], 500);
flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$data = $raw ? json_decode($raw, true) : null;
if (!is_array($data)) $data = empty_data();
if ($kind !== 'prices' && (!isset($data[$kind]) || !is_array($data[$kind]))) $data[$kind] = [];

// Price list : rubriques et prestations, crédit engagé calculé côté page
function num($v, $min) {
  $v = is_numeric($v) ? (float) $v : null;
  return ($v !== null && $v >= $min) ? round($v, 2) : null;
}
function price_sec(&$pr, $it) {
  $sec = isset($it['sec']) ? (string) $it['sec'] : '';
  if ($sec === '__new') {
    $title = clean(isset($it['secTitle']) ? $it['secTitle'] : '', 80);
    if ($title === '') return null;
    $n = 0;
    foreach ($pr['sections'] as $s) $n = max($n, (int) $s['ref']);
    $ref = sprintf('%02d', $n + 1);
    $pr['sections'][] = ['ref' => $ref, 'title' => $title];
    return $ref;
  }
  foreach ($pr['sections'] as $s) if ($s['ref'] === $sec) return $sec;
  return null;
}
function price_ref($pr, $sec) {
  $n = 0;
  foreach ($pr['items'] as $x) if ($x['sec'] === $sec) { $p = explode('.', $x['ref']); $n = max($n, isset($p[1]) ? (int) $p[1] : 0); }
  return $sec . '.' . sprintf('%02d', $n + 1);
}
function price_status(&$x, $st) {
  if ($st !== 'off' && (!isset($x['status']) || $x['status'] === 'off')) $x['at'] = date('Y-m-d');
  if ($st === 'off') unset($x['at']);
  $x['status'] = $st;
}
function price_fill(&$x, $it, $PSTATUS) {
  if (isset($it['title'])) { $t = clean($it['title'], 140); if ($t !== '') $x['title'] = $t; }
  if (isset($it['detail'])) $x['detail'] = clean($it['detail'], 200);
  if (isset($it['unit'])) { $u = clean($it['unit'], 30); $x['unit'] = $u !== '' ? $u : 'forfait'; }
  if (isset($it['price']) && ($p = num($it['price'], 0)) !== null) $x['price'] = $p;
  if (isset($it['qty']) && ($q = num($it['qty'], 0.01)) !== null) $x['qty'] = $q;
  if (isset($it['status']) && in_array($it['status'], $PSTATUS, true)) price_status($x, $it['status']);
}

if ($kind === 'prices') {
  $pr = isset($data['prices']) && is_array($data['prices']) ? $data['prices'] : [];
  if (!isset($pr['sections']) || !is_array($pr['sections'])) $pr['sections'] = [];
  if (!isset($pr['items']) || !is_array($pr['items'])) $pr['items'] = [];
  $it = isset($in['item']) && is_array($in['item']) ? $in['item'] : [];
  $id = isset($in['id']) ? (string) $in['id'] : '';
  if ($action === 'settings') {
    $c = isset($in['credit']) ? num($in['credit'], 0) : 0;
    $pr['credit'] = $c === null ? 0 : $c;
    $pr['vat'] = (isset($in['vat']) && (float) $in['vat'] == 0) ? 0 : 0.2;
  } elseif ($action === 'add') {
    $sec = price_sec($pr, $it);
    $title = clean(isset($it['title']) ? $it['title'] : '', 140);
    if ($sec === null || $title === '') { flock($fp, LOCK_UN); out(['error' => 'item'], 400); }
    $x = ['id' => 'x' . bin2hex(random_bytes(5)), 'ref' => price_ref($pr, $sec), 'sec' => $sec, 'title' => $title,
      'detail' => '', 'unit' => 'forfait', 'price' => 0, 'qty' => 1, 'status' => 'off'];
    price_fill($x, $it, $PSTATUS);
    $pr['items'][] = $x;
  } elseif ($action === 'edit') {
    foreach ($pr['items'] as &$x) {
      if ($x['id'] !== $id) continue;
      $sec = isset($it['sec']) ? price_sec($pr, $it) : null;
      if ($sec !== null && $sec !== $x['sec']) { $x['sec'] = $sec; $x['ref'] = price_ref($pr, $sec); }
      price_fill($x, $it, $PSTATUS);
    }
    unset($x);
  } elseif ($action === 'update') {
    $st = isset($in['status']) ? $in['status'] : '';
    if (!in_array($st, $PSTATUS, true)) { flock($fp, LOCK_UN); out(['error' => 'status'], 400); }
    foreach ($pr['items'] as &$x) if ($x['id'] === $id) price_status($x, $st);
    unset($x);
  } elseif ($action === 'delete') {
    $pr['items'] = array_values(array_filter($pr['items'], function ($x) use ($id) { return $x['id'] !== $id; }));
  } else {
    flock($fp, LOCK_UN);
    out(['error' => 'action'], 400);
  }
  usort($pr['items'], function ($a, $b) { return strcmp($a['ref'], $b['ref']); });
  usort($pr['sections'], function ($a, $b) { return strcmp($a['ref'], $b['ref']); });
  $data['prices'] = $pr;
} elseif ($action === 'add') {
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
} elseif ($action === 'progress') {
  // Avancement global, par paliers de 25 %
  $v = isset($in['value']) ? (int) $in['value'] : -1;
  if (!in_array($v, [0, 25, 50, 75, 100], true)) { flock($fp, LOCK_UN); out(['error' => 'value'], 400); }
  $data['progress'] = $v;
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
