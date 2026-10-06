<?php
/*
 * Suivi Jacqueline : passages, missions en cours, inspirations et modifications de l'équipe
 * (photos et légendes des posts et des campagnes sponsorisées), partagés entre tous les visiteurs.
 *   GET  suivi.php                  → { passages: [...], missions: [...] }
 *   GET  suivi.php?diag             → version PHP et droits d'écriture (installation)
 *   POST suivi.php (formulaire : payload = JSON, code = code équipe)
 *        { action: "check" }
 *        { action: "add",    kind: "missions"|"passages", item: {...} }
 *        { action: "update", kind: "missions", id, status }
 *        { action: "edit",   kind: "missions"|"passages", id, item: {...} }
 *        { action: "delete", kind: "missions"|"passages"|"inspirations", id }
 *        { action: "refresh", kind: "inspirations" }  → récupère le contenu Instagram manquant
 *        { action: "edit",   kind: "edits", id, item: { title, caption, media, poster, video, format, date, time, budget, spent, status, start, end,
 *                                                  objective, audience, cta, added: "post"|"ad", deleted: true } }
 *                            (format : "reel" pour passer un post photo en vidéo, "photo" pour l'inverse,
 *                             "options" pour proposer plusieurs visuels A / B / C dont un seul sera publié : liste "options")
 *                            (une valeur null rétablit celle du planning)
 *        { action: "reset",  kind: "edits", id }      → revient au post ou à la campagne d'origine
 *        { action: "upload", kind: "edits", id, slot: "media"|"options"|"poster"|"video", index, base } + fichier "file"
 *                            → photo (JPG, PNG, WebP) ou vidéo de reel (MP4, MOV) copiée dans uploads/
 * Inspirations : à l'ajout, l'image, le compte et la légende du post sont récupérés
 * sur Instagram (insta.php) ; l'image est copiée dans inspi/.
 * Les données sont dans data/suivi.json (dossier protégé par .htaccess).
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$FILE = __DIR__ . '/data/suivi.json';
$INSPI_DIR = __DIR__ . '/inspi';
$UP_DIR = __DIR__ . '/uploads';
$config = require __DIR__ . '/config.php';
require __DIR__ . '/insta.php';

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
function empty_data() { return ['passages' => [], 'missions' => [], 'inspirations' => [], 'edits' => new stdClass()]; }
// Taille maximale d'envoi acceptée par l'hébergement (php.ini), lisible
function ini_bytes($v) {
  $v = trim((string) $v); $n = (float) $v; $u = strtolower(substr($v, -1));
  return $u === 'g' ? $n * 1073741824 : ($u === 'm' ? $n * 1048576 : ($u === 'k' ? $n * 1024 : $n));
}
function upload_max() {
  $b = min(ini_bytes(ini_get('upload_max_filesize')) ?: INF, ini_bytes(ini_get('post_max_size')) ?: INF);
  return is_finite($b) ? round($b / 1048576) . ' Mo' : '';
}

$method = $_SERVER['REQUEST_METHOD'];

// Diagnostic d'installation (sans secret) : suivi.php?diag
if ($method === 'GET' && isset($_GET['diag'])) {
  out([
    'php' => PHP_VERSION,
    'data_exists' => is_file($FILE),
    'data_writable' => is_file($FILE) ? is_writable($FILE) : is_writable(dirname($FILE)),
    'dir_writable' => is_writable(dirname($FILE)),
    'password_verify' => function_exists('password_verify'),
    'inspi_writable' => is_dir($INSPI_DIR) ? is_writable($INSPI_DIR) : is_writable(__DIR__),
    'curl' => function_exists('curl_init'),
    'uploads_writable' => is_dir($UP_DIR) ? is_writable($UP_DIR) : is_writable(__DIR__),
    'upload_max' => upload_max(),
    'getimagesize' => function_exists('getimagesize'),
    'url_fopen' => (bool) ini_get('allow_url_fopen'),
  ]);
}

if ($method === 'GET') {
  $raw = is_file($FILE) ? file_get_contents($FILE) : '';
  $data = $raw ? json_decode($raw, true) : null;
  if (is_array($data) && (!isset($data['edits']) || !$data['edits'])) $data['edits'] = new stdClass();
  out(is_array($data) ? $data : empty_data());
}

if ($method !== 'POST') out(['error' => 'method'], 405);

// Fichier plus lourd que ce qu'accepte l'hébergement : PHP vide alors le formulaire
if (empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && (int) $_SERVER['CONTENT_LENGTH'] > 0
    && stripos(isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '', 'multipart/') === 0) {
  out(['error' => 'too_big', 'max' => upload_max()], 413);
}

// Requête : formulaire classique (payload + code), ou JSON brut en repli.
// Le code passe dans le corps : certains hébergeurs suppriment les en-têtes personnalisés.
$in = isset($_POST['payload']) ? json_decode((string) $_POST['payload'], true) : json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(['error' => 'json'], 400);

// Mode équipe : le code est vérifié à chaque écriture
$code = isset($_POST['code']) ? (string) $_POST['code'] : (isset($in['code']) ? (string) $in['code'] : '');
if ($code === '' && isset($_SERVER['HTTP_X_ADMIN_CODE'])) $code = (string) $_SERVER['HTTP_X_ADMIN_CODE'];
if ($code === '' || !password_verify(strtoupper(trim($code)), $config['admin_hash'])) {
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
if (!in_array($kind, ['missions', 'passages', 'inspirations', 'edits'], true)) out(['error' => 'kind'], 400);

$TEAM = ['Fabrizio', 'Manon', 'Clément'];
$CATS = ['photo', 'video', 'montage', 'planning', 'redaction', 'ads', 'autre'];
$AD_STATUS = ['prevue', 'live', 'done'];
// Chemin d'une photo ou vidéo du site (planning ou envoi de l'équipe), jamais en dehors du dossier client
function media_path($p) {
  $p = is_string($p) ? trim($p) : '';
  return preg_match('~^(media|uploads)/[A-Za-z0-9._-]+\.(jpe?g|png|webp|mp4|mov|m4v)$~i', $p) && strpos($p, '..') === false ? $p : '';
}
function edit_key($id) { $id = (string) $id; return preg_match('/^[A-Za-z0-9-]{1,48}$/', $id) ? $id : ''; }
// Fichiers envoyés par l'équipe que plus rien n'utilise : supprimés
function uploads_of($e) {
  $out = [];
  if (!is_array($e)) return $out;
  foreach (['poster', 'video'] as $k) if (!empty($e[$k]) && strpos($e[$k], 'uploads/') === 0) $out[] = $e[$k];
  foreach (['media', 'options'] as $k) if (!empty($e[$k]) && is_array($e[$k])) foreach ($e[$k] as $m) if (is_string($m) && strpos($m, 'uploads/') === 0) $out[] = $m;
  return $out;
}
function cleanup_uploads($before, $data) {
  $used = [];
  foreach ((array) $data['edits'] as $e) $used = array_merge($used, uploads_of($e));
  foreach (array_diff($before, $used) as $f) {
    if (preg_match('~^uploads/[a-z0-9-]+\.(jpg|png|webp|mp4|mov)$~', $f)) @unlink(__DIR__ . '/' . $f);
  }
}
$STATUS = ['todo', 'doing', 'done'];
$KINDS = ['photo', 'video', 'both', 'meeting'];
$FORMATS = ['reel', 'carousel', 'post'];
// Lien Instagram d'un post, carrousel ou reel, remis au propre (sans paramètres de suivi)
function insta_url($u) {
  if (!preg_match('~^https?://(?:www\.)?instagram\.com/(?:[A-Za-z0-9._]+/)?(p|reel|reels|tv)/([A-Za-z0-9_-]+)~', trim((string) $u), $m)) return '';
  return 'https://www.instagram.com/' . ($m[1] === 'p' ? 'p' : 'reel') . '/' . $m[2] . '/';
}

// Contenu Instagram récupéré avant de verrouiller le fichier (la requête peut prendre quelques secondes)
$fetched = [];
if ($kind === 'inspirations' && $action === 'add') {
  $it = isset($in['item']) && is_array($in['item']) ? $in['item'] : [];
  $url = insta_url(isset($it['url']) ? $it['url'] : '');
  if ($url === '') out(['error' => 'url'], 400);
  $newId = 'i' . bin2hex(random_bytes(5));
  $fetched[$newId] = ig_fetch($url, $newId, $INSPI_DIR);
} elseif ($kind === 'inspirations' && $action === 'refresh') {
  $raw = is_file($FILE) ? file_get_contents($FILE) : '';
  $cur = $raw ? json_decode($raw, true) : null;
  $only = isset($in['id']) ? (string) $in['id'] : '';
  $n = 0;
  foreach ((is_array($cur) && isset($cur['inspirations']) ? $cur['inspirations'] : []) as $x) {
    // Sans id : les inspirations jamais récupérées ; avec id : on réessaie celle-ci
    if ($only !== '' ? $x['id'] !== $only : (!empty($x['thumb']) || !empty($x['tried']) || $n >= 6)) continue;
    $fetched[$x['id']] = ig_fetch($x['url'], $x['id'], $INSPI_DIR);
    $n++;
  }
}
function with_fetched($x, $f) {
  $x['tried'] = date('Y-m-d');
  if ($f['thumb'] !== '') $x['thumb'] = $f['thumb'];
  if ($f['author'] !== '') $x['author'] = clean($f['author'], 60);
  if ($f['caption'] !== '') $x['caption'] = clean($f['caption'], 400);
  return $x;
}

// Envoi d'une photo ou d'une vidéo : le fichier est contrôlé et rangé dans uploads/ avant le verrou
$stored = '';
if ($kind === 'edits' && $action === 'upload') {
  $slot = isset($in['slot']) ? $in['slot'] : '';
  if (edit_key(isset($in['id']) ? $in['id'] : '') === '' || !in_array($slot, ['media', 'options', 'poster', 'video'], true)) out(['error' => 'item'], 400);
  $f = isset($_FILES['file']) ? $_FILES['file'] : null;
  if (!$f || $f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) out(['error' => 'too_big', 'max' => upload_max()], 413);
  if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) out(['error' => 'upload'], 400);
  $ext = '';
  if ($slot === 'video') {
    // MP4 / MOV : la boîte « ftyp » est au début du fichier
    $head = (string) @file_get_contents($f['tmp_name'], false, null, 0, 16);
    if (substr($head, 4, 4) === 'ftyp') $ext = substr($head, 8, 2) === 'qt' ? 'mov' : 'mp4';
    if ($f['size'] > 300 * 1048576) out(['error' => 'too_big', 'max' => '300 Mo'], 413);
  } else {
    $info = @getimagesize($f['tmp_name']);
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png'];
    if (defined('IMAGETYPE_WEBP')) $types[IMAGETYPE_WEBP] = 'webp';
    if ($info && isset($types[$info[2]])) $ext = $types[$info[2]];
    if ($f['size'] > 25 * 1048576) out(['error' => 'too_big', 'max' => '25 Mo'], 413);
  }
  if ($ext === '') out(['error' => 'type'], 415);
  if (!is_dir($UP_DIR)) @mkdir($UP_DIR, 0755, true);
  if (!is_dir($UP_DIR) || !is_writable($UP_DIR)) out(['error' => 'uploads'], 500);
  $stored = 'uploads/' . strtolower(preg_replace('/[^a-z0-9-]/i', '', $in['id'])) . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
  if (!move_uploaded_file($f['tmp_name'], __DIR__ . '/' . $stored)) out(['error' => 'uploads'], 500);
  @chmod(__DIR__ . '/' . $stored, 0644);
}

// Lecture + écriture sous verrou : deux personnes qui modifient en même temps ne s'écrasent pas
$fp = @fopen($FILE, 'c+');
if (!$fp) out(['error' => 'storage'], 500);
flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$data = $raw ? json_decode($raw, true) : null;
if (!is_array($data)) $data = empty_data();
if (!isset($data[$kind]) || !is_array($data[$kind])) $data[$kind] = [];

if ($kind === 'edits') {
  // Modifications de l'équipe, par post ou campagne (id du planning)
  $id = edit_key(isset($in['id']) ? $in['id'] : '');
  if ($id === '' || (!isset($data['edits'][$id]) && count($data['edits']) >= 400)) {
    if ($stored) @unlink(__DIR__ . '/' . $stored);
    flock($fp, LOCK_UN); out(['error' => 'item'], 400);
  }
  $before = uploads_of(isset($data['edits'][$id]) ? $data['edits'][$id] : []);
  $e = isset($data['edits'][$id]) && is_array($data['edits'][$id]) ? $data['edits'][$id] : [];
  if ($action === 'reset') {
    $e = [];
  } elseif ($action === 'upload') {
    $slot = $in['slot'];
    if ($slot === 'media' || $slot === 'options') {
      // Liste de départ : photos (ou propositions) déjà modifiées, sinon celles du planning envoyées par la page
      $list = isset($e[$slot]) && is_array($e[$slot]) ? $e[$slot] : array_values(array_filter(array_map('media_path', isset($in['base']) && is_array($in['base']) ? $in['base'] : [])));
      $k = isset($in['index']) ? (int) $in['index'] : -1;
      if ($k >= 0 && $k < count($list)) $list[$k] = $stored; else $list[] = $stored;
      $e[$slot] = array_slice($list, 0, $slot === 'options' ? 8 : 10);
    } else {
      $e[$slot] = $stored;
    }
  } elseif ($action === 'edit') {
    $it = isset($in['item']) && is_array($in['item']) ? $in['item'] : [];
    foreach ($it as $k => $v) {
      if ($v === null) { unset($e[$k]); continue; }
      if ($k === 'title') $e[$k] = clean($v, 140);
      elseif ($k === 'caption') {
        // Légende : on garde les retours à la ligne (un paragraphe par ligne)
        $lines = array_filter(array_map(function ($l) { return clean($l, 2200); }, preg_split('/\r\n|\r|\n/', (string) $v)), 'strlen');
        $c = implode("\n", $lines);
        $e[$k] = function_exists('mb_substr') ? mb_substr($c, 0, 2200, 'UTF-8') : substr($c, 0, 4400);
      } elseif (($k === 'media' || $k === 'options') && is_array($v)) {
        $list = array_values(array_filter(array_map('media_path', $v)));
        if ($list) $e[$k] = array_slice($list, 0, $k === 'options' ? 8 : 10);
      } elseif (($k === 'poster' || $k === 'video') && media_path($v) !== '') $e[$k] = media_path($v);
      elseif (($k === 'budget' || $k === 'spent') && is_numeric($v) && $v >= 0 && $v < 1000000) $e[$k] = round((float) $v, 2);
      elseif ($k === 'status' && in_array($v, $AD_STATUS, true)) $e[$k] = $v;
      elseif ($k === 'format' && in_array($v, ['reel', 'photo', 'options'], true)) $e[$k] = $v;
      // Publication ou campagne ajoutée depuis l'espace équipe, ou retirée du planning
      elseif ($k === 'added' && in_array($v, ['post', 'ad'], true)) $e[$k] = $v;
      elseif ($k === 'deleted' && $v === true) $e[$k] = true;
      elseif ($k === 'date' && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v)) $e[$k] = $v;
      elseif ($k === 'time') { $t = clean($v, 12); if ($t !== '') $e[$k] = $t; else unset($e[$k]); }
      elseif (in_array($k, ['objective', 'audience', 'cta'], true)) { $t = clean($v, 160); if ($t !== '') $e[$k] = $t; else unset($e[$k]); }
      elseif (($k === 'start' || $k === 'end') && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v)) $e[$k] = $v;
    }
  } else {
    flock($fp, LOCK_UN); out(['error' => 'action'], 400);
  }
  if ($e) $data['edits'][$id] = $e; else unset($data['edits'][$id]);
  cleanup_uploads($before, $data);
  if (!$data['edits']) $data['edits'] = new stdClass();
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
  } elseif ($kind === 'inspirations') {
    $f = isset($it['format']) ? $it['format'] : '';
    $item = [
      'id' => $newId, 'url' => $url,
      'format' => in_array($f, $FORMATS, true) ? $f : (strpos($url, '/reel/') ? 'reel' : 'carousel'),
      'note' => clean(isset($it['note']) ? $it['note'] : '', 200),
      'by' => isset($it['by']) && in_array($it['by'], $TEAM, true) ? $it['by'] : '',
      'at' => date('Y-m-d'),
    ];
    array_unshift($data[$kind], with_fetched($item, $fetched[$newId]));
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
    } elseif ($kind === 'inspirations') {
      if (isset($it['format']) && in_array($it['format'], $FORMATS, true)) $x['format'] = $it['format'];
      if (isset($it['note'])) $x['note'] = clean($it['note'], 200);
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
} elseif ($action === 'refresh' && $kind === 'inspirations') {
  foreach ($data[$kind] as &$x) if (isset($fetched[$x['id']])) $x = with_fetched($x, $fetched[$x['id']]);
  unset($x);
} elseif ($action === 'delete') {
  $id = isset($in['id']) ? $in['id'] : '';
  // L'image copiée d'une inspiration part avec elle
  foreach ($data[$kind] as $x) {
    if ($x['id'] === $id && !empty($x['thumb']) && preg_match('~^inspi/[a-z0-9]+\.(jpg|png|webp)$~', $x['thumb'])) @unlink(__DIR__ . '/' . $x['thumb']);
  }
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
