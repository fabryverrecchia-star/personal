<?php
/*
 * Vignette réduite pour la grille du feed : thumb.php?f=uploads/xxx.jpg (ou media/xxx.jpg)
 * L'original n'est jamais modifié : la fenêtre du post affiche toujours le fichier d'origine.
 * Vignettes gardées dans thumbs/ ; sans GD, redirection vers l'original.
 */
$f = isset($_GET['f']) ? (string) $_GET['f'] : '';
if (!preg_match('~^(uploads|media)/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$~i', $f) || strpos($f, '..') !== false || !is_file(__DIR__ . '/' . $f)) {
  http_response_code(404); exit;
}
$W = 540;
$src = __DIR__ . '/' . $f;
$dir = __DIR__ . '/thumbs';
$out = $dir . '/' . str_replace('/', '-', $f) . '-' . $W . '-' . filemtime($src) . '.jpg';
function send_file($p) {
  header('Content-Type: image/jpeg');
  header('Cache-Control: public, max-age=31536000, immutable');
  header('Content-Length: ' . filesize($p));
  readfile($p); exit;
}
function go_original($f) { header('Cache-Control: no-cache'); header('Location: ' . $f, true, 302); exit; }
if (is_file($out)) send_file($out);
if (!function_exists('imagecreatetruecolor')) go_original($f);
$info = @getimagesize($src);
if (!$info || $info[0] <= $W) go_original($f);
@ini_set('memory_limit', '256M');
$t = $info[2];
$im = $t === IMAGETYPE_JPEG ? @imagecreatefromjpeg($src) : ($t === IMAGETYPE_PNG ? @imagecreatefrompng($src) : ($t === IMAGETYPE_WEBP && function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($src) : null));
if (!$im) go_original($f);
// Orientation de l'appareil photo (EXIF)
if ($t === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
  $ex = @exif_read_data($src);
  $o = isset($ex['Orientation']) ? (int) $ex['Orientation'] : 1;
  if ($o === 3) $im = imagerotate($im, 180, 0); elseif ($o === 6) $im = imagerotate($im, -90, 0); elseif ($o === 8) $im = imagerotate($im, 90, 0);
}
$w = imagesx($im); $h = imagesy($im);
if ($w <= $W) { imagedestroy($im); go_original($f); }
$nh = (int) round($h * $W / $w);
$th = imagecreatetruecolor($W, $nh);
imagecopyresampled($th, $im, 0, 0, 0, 0, $W, $nh, $w, $h);
imagedestroy($im);
if (!is_dir($dir)) @mkdir($dir, 0755, true);
if (is_dir($dir) && is_writable($dir) && @imagejpeg($th, $out, 86)) { imagedestroy($th); send_file($out); }
header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=86400');
imagejpeg($th, null, 86);
