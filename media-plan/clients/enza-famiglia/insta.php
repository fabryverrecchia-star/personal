<?php
/*
 * Récupération du contenu d'un lien Instagram public (image, compte, légende),
 * utilisée par suivi.php quand on ajoute une inspiration.
 * Instagram sert ses balises de partage (og:image, og:description) aux robots d'aperçu :
 * on se présente comme tel, puis on garde une copie de l'image sur le site
 * (les liens d'image Instagram expirent au bout de quelques jours).
 */

function ig_http($url, $max = 6000000, $timeout = 10) {
  $ua = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
  if (function_exists('curl_init')) {
    $c = curl_init($url);
    curl_setopt_array($c, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS => 4,
      CURLOPT_CONNECTTIMEOUT => 5,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_USERAGENT => $ua,
      CURLOPT_HTTPHEADER => ['Accept-Language: fr-FR,fr;q=0.9,en;q=0.6'],
      CURLOPT_ENCODING => '',
    ]);
    $body = curl_exec($c);
    $code = curl_getinfo($c, CURLINFO_HTTP_CODE);
    curl_close($c);
    return ($body !== false && $code >= 200 && $code < 300 && strlen($body) <= $max) ? $body : '';
  }
  if (!ini_get('allow_url_fopen')) return '';
  $ctx = stream_context_create(['http' => [
    'timeout' => $timeout, 'follow_location' => 1, 'max_redirects' => 4,
    'header' => "User-Agent: $ua\r\nAccept-Language: fr-FR,fr;q=0.9\r\n",
  ]]);
  $body = @file_get_contents($url, false, $ctx, 0, $max);
  return $body === false ? '' : $body;
}

function ig_meta($html, $prop) {
  $p = preg_quote($prop, '~');
  if (preg_match('~<meta[^>]+(?:property|name)=["\']' . $p . '["\'][^>]*content=(["\'])(.*?)\1~is', $html, $m)
    || preg_match('~<meta[^>]+content=(["\'])(.*?)\1[^>]*(?:property|name)=["\']' . $p . '["\']~is', $html, $m)) {
    return html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
  }
  return '';
}

// Lit la page de partage : image, compte et légende
function ig_parse($html) {
  $img = ig_meta($html, 'og:image');
  if ($img === '') $img = ig_meta($html, 'twitter:image');
  $desc = ig_meta($html, 'og:description');
  if ($desc === '') $desc = ig_meta($html, 'description');
  $title = ig_meta($html, 'og:title');
  $author = '';
  $caption = '';
  // « 1 234 likes, 56 comments - compte on 20 septembre 2026: "légende" »
  if (preg_match('~-\s+([A-Za-z0-9._]+)\s+(?:on|le)\s+[^:]{3,40}:\s*["“«]?(.*?)["”»]?\s*\.?\s*$~su', $desc, $m)) {
    $author = $m[1];
    $caption = $m[2];
  } elseif (preg_match('~^(.*?)\s+(?:on|sur)\s+Instagram\s*:\s*["“«]?(.*?)["”»]?$~su', $title, $m)) {
    $caption = $m[2];
  } else {
    $caption = $desc;
  }
  if ($author === '' && preg_match('~\(@([A-Za-z0-9._]+)\)~', $title, $m)) $author = $m[1];
  if ($author === '' && preg_match('~instagram\.com/([A-Za-z0-9._]+)/(?:p|reel)/~', ig_meta($html, 'og:url'), $m)) $author = $m[1];
  return ['image' => $img, 'author' => $author, 'caption' => trim($caption), 'video' => ig_video_url($html)];
}

// Adresse du fichier vidéo d'un reel, dans les balises de partage ou les données de la page
function ig_video_url($html) {
  $v = ig_meta($html, 'og:video:secure_url');
  if ($v === '') $v = ig_meta($html, 'og:video');
  if ($v === '' && preg_match('~"video_url"\s*:\s*"([^"]+)"~', $html, $m)) $v = json_decode('"' . $m[1] . '"');
  return is_string($v) && preg_match('~^https://~', $v) ? $v : '';
}

/*
 * Récupère le contenu d'un lien et enregistre l'image dans $dir/$id.jpg.
 * Renvoie ['thumb' => chemin relatif ou '', 'author' => ..., 'caption' => ...].
 */
function ig_fetch($url, $id, $dir) {
  $out = ['thumb' => '', 'author' => '', 'caption' => '', 'video' => ''];
  $info = ig_parse(ig_http($url));
  $out['author'] = $info['author'];
  $out['caption'] = $info['caption'];
  $bytes = '';
  if ($info['image'] !== '' && preg_match('~^https://~', $info['image'])) $bytes = ig_http($info['image']);
  // Repli : l'adresse d'image directe du post
  if ($bytes === '') $bytes = ig_http(rtrim($url, '/') . '/media/?size=l');
  $size = $bytes !== '' ? @getimagesizefromstring($bytes) : false;
  if ($size && in_array($size[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
    $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$size[2]];
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $name = preg_replace('~[^a-z0-9]~', '', $id) . '.' . $ext;
    if (is_dir($dir) && @file_put_contents($dir . '/' . $name, $bytes) !== false) {
      $out['thumb'] = basename($dir) . '/' . $name;
    }
  }
  // Reel : on garde aussi la vidéo, pour la lire directement dans la page
  if (strpos($url, '/reel/') !== false) {
    $v = $info['video'];
    if ($v === '') $v = ig_video_url(ig_http(rtrim($url, '/') . '/embed/captioned/'));
    $bytes = $v !== '' ? ig_http($v, 90000000, 45) : '';
    if (strlen($bytes) > 1000 && substr($bytes, 4, 4) === 'ftyp') {
      if (!is_dir($dir)) @mkdir($dir, 0755, true);
      $name = preg_replace('~[^a-z0-9]~', '', $id) . '.mp4';
      if (is_dir($dir) && @file_put_contents($dir . '/' . $name, $bytes) !== false) $out['video'] = basename($dir) . '/' . $name;
    }
  }
  return $out;
}
