<?php
/*
 * Lien de partage d'une publication : share.php?p=<id du post>[&c=<client>]
 * Les applications (WhatsApp, iMessage, Instagram, Slack…) lisent ici l'aperçu du lien :
 * le visuel, les visuels côte à côte pour un carrousel, ou la vidéo et sa couverture pour un reel.
 * Une personne qui ouvre le lien arrive sur le planning, la publication ouverte.
 * share.php?…&img=1 : l'image de l'aperçu (réduite, et assemblée pour un carrousel).
 */
$slug = isset($_GET['c']) ? preg_replace('/[^a-z0-9-]/', '', strtolower((string) $_GET['c'])) : '';
if ($slug === '') $slug = 'la-petite-maison';
$dir = __DIR__ . '/clients/' . $slug;
if (!is_dir($dir)) { $slug = 'la-petite-maison'; $dir = __DIR__ . '/clients/' . $slug; }
$key = isset($_GET['p']) ? (string) $_GET['p'] : '';
if (!preg_match('/^[A-Za-z0-9-]{1,48}$/', $key)) $key = '';

$raw = is_file($dir . '/data/suivi.json') ? @file_get_contents($dir . '/data/suivi.json') : '';
$data = $raw ? json_decode($raw, true) : null;
$e = ($key !== '' && is_array($data) && isset($data['edits'][$key]) && is_array($data['edits'][$key])) ? $data['edits'][$key] : [];
if (!empty($e['deleted'])) $e = [];

function is_vid($p) { return (bool) preg_match('~\.(mp4|mov|m4v)$~i', $p); }
function safe_path($p) {
  return is_string($p) && preg_match('~^(media|uploads)/[A-Za-z0-9._-]+$~', $p) && strpos($p, '..') === false ? $p : '';
}

// Ce que montre la publication
$reel = isset($e['format']) && $e['format'] === 'reel';
$images = [];
$video = '';
if ($reel) {
  if (!empty($e['poster']) && safe_path($e['poster'])) $images[] = $e['poster'];
  if (!empty($e['video']) && safe_path($e['video'])) $video = $e['video'];
} else {
  foreach ((array) (isset($e['media']) ? $e['media'] : []) as $m) {
    if (!safe_path($m)) continue;
    if (is_vid($m)) { if ($video === '') $video = $m; }
    else $images[] = $m;
  }
}

/* Image de l'aperçu : photo réduite (1200 px), ou jusqu'à 3 photos du carrousel côte à côte */
if (isset($_GET['img'])) {
  $files = array_slice($images, 0, count($images) > 1 ? 3 : 1);
  if (!$files) { http_response_code(404); exit; }
  if (!function_exists('imagecreatefromstring')) { header('Location: clients/' . $slug . '/' . $files[0]); exit; }
  @ini_set('memory_limit', '256M');
  $load = function ($f) use ($dir) { $b = @file_get_contents($dir . '/' . $f); return $b ? @imagecreatefromstring($b) : false; };
  if (count($files) === 1) {
    $im = $load($files[0]);
    if (!$im) { header('Location: clients/' . $slug . '/' . $files[0]); exit; }
    $w = imagesx($im); $h = imagesy($im); $r = min(1, 1200 / max($w, $h));
    $out = imagecreatetruecolor(max(1, (int) round($w * $r)), max(1, (int) round($h * $r)));
    imagecopyresampled($out, $im, 0, 0, 0, 0, imagesx($out), imagesy($out), $w, $h);
    imagedestroy($im);
  } else {
    $W = 1200; $H = 630; $gap = 8; $n = count($files);
    $out = imagecreatetruecolor($W, $H);
    imagefill($out, 0, 0, imagecolorallocate($out, 241, 238, 230));
    $pw = (int) floor(($W - $gap * ($n - 1)) / $n);
    foreach ($files as $k => $f) {
      $im = $load($f);
      if (!$im) continue;
      $w = imagesx($im); $h = imagesy($im);
      // Recadrage au centre, au format de la case
      $s = max($pw / $w, $H / $h);
      $cw = (int) round($pw / $s); $ch = (int) round($H / $s);
      imagecopyresampled($out, $im, $k * ($pw + $gap), 0, (int) (($w - $cw) / 2), (int) (($h - $ch) / 2), $pw, $H, $cw, $ch);
      imagedestroy($im);
    }
  }
  header('Content-Type: image/jpeg');
  header('Cache-Control: public, max-age=3600');
  imagejpeg($out, null, 84);
  exit;
}

/* Page lue par les applications pour l'aperçu, puis redirection vers la publication */
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$host = isset($_SERVER['HTTP_HOST']) ? preg_replace('/[^A-Za-z0-9.:-]/', '', $_SERVER['HTTP_HOST']) : 'localhost';
$root = ($https ? 'https' : 'http') . '://' . $host . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
$qs = ($slug !== 'la-petite-maison' ? 'c=' . $slug . '&' : '');
$self = $root . 'share.php?' . $qs . 'p=' . rawurlencode($key);
$target = $root . ($qs || $key !== '' ? '?' . $qs . ($key !== '' ? 'post=' . rawurlencode($key) : '') : '');

// Nom du client, lu dans plan.js
$client = 'La Petite Maison';
$plan = @file_get_contents($dir . '/plan.js');
if ($plan && preg_match("~client:\s*\{[^}]*?name:\s*'([^']+)'~s", $plan, $m)) $client = $m[1];

$JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
$MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
$when = '';
if (!empty($e['date']) && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $e['date'], $d)) {
  $t = mktime(12, 0, 0, (int) $d[2], (int) $d[3], (int) $d[1]);
  $when = ucfirst($JOURS[(int) date('w', $t)]) . ' ' . (int) $d[3] . ' ' . $MOIS[(int) $d[2] - 1] . (!empty($e['time']) ? ' · ' . $e['time'] : '');
}
$kindLabel = $reel ? 'Reel' : (count($images) + ($video ? 1 : 0) > 1 ? 'Carrousel' : ($video ? 'Vidéo' : 'Publication'));
$title = trim((string) (isset($e['title']) ? $e['title'] : '')) ?: $kindLabel;
$first = trim((string) strtok(isset($e['caption']) ? (string) $e['caption'] : '', "\n"));
$desc = trim($kindLabel . ($when ? ' · ' . $when : '') . ($first !== '' ? ' — ' . $first : ''));
if (function_exists('mb_substr')) $desc = mb_substr($desc, 0, 200, 'UTF-8');
$site = '18H22 × ' . $client;

function h($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
$v = function ($p) use ($root, $slug) { return $root . 'clients/' . $slug . '/' . $p; };
$imgUrl = $images ? $self . '&img=1' : '';
// Version de l'image : les applications gardent l'aperçu en cache, il change avec les visuels
if ($imgUrl) $imgUrl .= '&v=' . substr(md5(implode('|', $images)), 0, 8);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= h($title . ' · ' . $site) ?></title>
<meta name="description" content="<?= h($desc) ?>">
<meta property="og:type" content="<?= $video ? 'video.other' : 'article' ?>">
<meta property="og:site_name" content="<?= h($site) ?>">
<meta property="og:title" content="<?= h($title) ?>">
<meta property="og:description" content="<?= h($desc) ?>">
<meta property="og:url" content="<?= h($self) ?>">
<meta property="og:locale" content="fr_FR">
<?php if ($imgUrl): ?>
<meta property="og:image" content="<?= h($imgUrl) ?>">
<meta property="og:image:secure_url" content="<?= h($imgUrl) ?>">
<meta property="og:image:type" content="image/jpeg">
<?php if (count($images) > 1): ?>
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<?php endif; ?>
<meta name="twitter:image" content="<?= h($imgUrl) ?>">
<?php endif; ?>
<?php if ($video): ?>
<meta property="og:video" content="<?= h($v($video)) ?>">
<meta property="og:video:secure_url" content="<?= h($v($video)) ?>">
<meta property="og:video:type" content="video/mp4">
<?php endif; ?>
<meta name="twitter:card" content="<?= $imgUrl ? 'summary_large_image' : 'summary' ?>">
<meta name="twitter:title" content="<?= h($title) ?>">
<meta name="twitter:description" content="<?= h($desc) ?>">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f1eee6;color:#22365f;font:16px/1.5 Georgia,serif;text-align:center}a{color:inherit}</style>
</head>
<body>
<p><a href="<?= h($target) ?>">Voir la publication</a></p>
<script>location.replace(<?= json_encode($target, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) ?>);</script>
</body>
</html>
