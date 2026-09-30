<?php
/*
 * Espace admin 18H22 : ajouter, titrer, réordonner et supprimer les projets.
 *   admin.php?k=CLÉ          ouvre la session avec le lien privé
 *   admin.php                formulaire de code si pas de session
 *   POST admin.php?api=...   upload | save | logout  (session + jeton CSRF)
 * Données : data/projects.json. À chaque enregistrement, assets/js/projects.js
 * est réécrit : la page d'accueil reste un site statique.
 */
declare(strict_types=1);

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_name('h22admin');
session_start();

header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

$config = require __DIR__ . '/config.php';
$DATA = __DIR__ . '/data/projects.json';
$JS = __DIR__ . '/assets/js/projects.js';
$DIR = 'assets/projects';

function authed(): bool { return !empty($_SESSION['h22_admin']); }

function check_key(string $k, array $config): bool {
  return $k !== '' && password_verify($k, $config['admin_hash']);
}

function login(): void {
  session_regenerate_id(true);
  $_SESSION['h22_admin'] = true;
  $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

function out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function clean_title($s): string {
  $s = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $s)));
  return mb_substr($s, 0, 80, 'UTF-8');
}

function load(string $file): array {
  $d = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
  return is_array($d) && isset($d['projects']) && is_array($d['projects']) ? $d['projects'] : [];
}

// Réglages de l'animation : [min, max, défaut]
const SETTINGS_RANGE = [
  'fade'    => [0.2, 4, 0.9],
  'every'   => [0.4, 6, 1.5],
  'max'     => [2, 10, 6],
  'size'    => [6, 30, 14],
  'variety' => [0, 100, 45],
  'spacing' => [0, 100, 40],
];

function clean_settings($in): array {
  $out = [];
  foreach (SETTINGS_RANGE as $k => [$min, $max, $def]) {
    $v = is_array($in) && isset($in[$k]) && is_numeric($in[$k]) ? (float) $in[$k] : $def;
    $v = max($min, min($max, $v));
    $out[$k] = $k === 'max' ? (int) round($v) : round($v, 2);
  }
  return $out;
}

function load_settings(string $file): array {
  $d = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
  return clean_settings(is_array($d) ? ($d['settings'] ?? []) : []);
}

function write_atomic(string $file, string $content): bool {
  $tmp = $file . '.tmp' . bin2hex(random_bytes(3));
  if (file_put_contents($tmp, $content, LOCK_EX) === false) return false;
  return rename($tmp, $file);
}

function publish(array $projects, array $settings, string $data, string $js): bool {
  $ok = write_atomic($data, json_encode(['settings' => $settings, 'projects' => array_values($projects)], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  $list = array_map(function ($p) {
    return ['src' => $p['src'], 'w' => (int) $p['w'], 'h' => (int) $p['h'], 'title' => $p['title']];
  }, array_values($projects));
  $body = "/* Généré par admin.php — modifier les projets depuis l'admin. */\nwindow.PROJECTS = "
    . json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . ";\n"
    . "window.SETTINGS = " . json_encode($settings, JSON_UNESCAPED_SLASHES) . ";\n";
  return $ok && write_atomic($js, $body);
}

/* ---- Lien privé ---- */
if (isset($_GET['k'])) {
  if (check_key((string) $_GET['k'], $config)) login();
  header('Location: admin.php', true, 303);
  exit;
}

/* ---- Formulaire de code ---- */
$loginError = false;
if (!authed() && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['code'])) {
  usleep(400000); // freine les essais répétés
  if (check_key((string) $_POST['code'], $config)) { login(); header('Location: admin.php', true, 303); exit; }
  $loginError = true;
}

/* ---- API ---- */
if (isset($_GET['api'])) {
  if (!authed()) out(['error' => 'auth'], 401);
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(['error' => 'method'], 405);
  if (!hash_equals($_SESSION['csrf'] ?? '', (string) ($_POST['csrf'] ?? ''))) out(['error' => 'csrf'], 403);
  $api = (string) $_GET['api'];

  if ($api === 'logout') {
    $_SESSION = [];
    session_destroy();
    out(['ok' => true]);
  }

  if ($api === 'upload') {
    $f = $_FILES['image'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > 12 * 1024 * 1024) out(['error' => 'upload'], 400);
    $info = @getimagesize($f['tmp_name']);
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    if (!$info || !isset($types[$info[2]])) out(['error' => 'type'], 400);
    $id = 'u' . date('ymd') . bin2hex(random_bytes(4));
    $src = $DIR . '/' . $id . '.' . $types[$info[2]];
    if (!move_uploaded_file($f['tmp_name'], __DIR__ . '/' . $src)) out(['error' => 'write'], 500);
    @chmod(__DIR__ . '/' . $src, 0644);
    $projects = load($DATA);
    $item = ['id' => $id, 'src' => $src, 'w' => (int) $info[0], 'h' => (int) $info[1], 'title' => clean_title($_POST['title'] ?? '')];
    $projects[] = $item;
    if (!publish($projects, load_settings($DATA), $DATA, $JS)) out(['error' => 'write'], 500);
    out(['ok' => true, 'item' => $item]);
  }

  if ($api === 'save') {
    // Nouvel ordre + titres ; les projets absents de la liste sont supprimés
    $in = json_decode((string) ($_POST['list'] ?? ''), true);
    if (!is_array($in)) out(['error' => 'json'], 400);
    $byId = [];
    foreach (load($DATA) as $p) $byId[$p['id']] = $p;
    $next = [];
    foreach ($in as $row) {
      $id = (string) ($row['id'] ?? '');
      if (!isset($byId[$id]) || isset($next[$id])) continue;
      $p = $byId[$id];
      $p['title'] = clean_title($row['title'] ?? '');
      $next[$id] = $p;
    }
    foreach ($byId as $id => $p) {
      if (isset($next[$id])) continue;
      $path = realpath(__DIR__ . '/' . $p['src']);
      $base = realpath(__DIR__ . '/' . $DIR);
      if ($path && $base && strpos($path, $base . DIRECTORY_SEPARATOR) === 0) @unlink($path);
    }
    $settings = isset($_POST['settings']) ? clean_settings(json_decode((string) $_POST['settings'], true)) : load_settings($DATA);
    if (!publish(array_values($next), $settings, $DATA, $JS)) out(['error' => 'write'], 500);
    out(['ok' => true, 'count' => count($next)]);
  }

  out(['error' => 'action'], 400);
}

$projects = authed() ? load($DATA) : [];
$settings = load_settings($DATA);
$csrf = $_SESSION['csrf'] ?? '';
$writable = is_writable(__DIR__ . '/data') && is_writable(__DIR__ . '/' . $DIR) && is_writable(dirname($JS));
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#f1eee6">
  <title>18H22 · Admin</title>
  <link rel="icon" href="assets/brand/18h22-mark.svg" type="image/svg+xml">
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/admin.css">
</head>
<body>
<?php if (!authed()): ?>
  <main class="login">
    <img class="login__mark" src="assets/brand/18h22-mark.svg" alt="18H22">
    <form method="post" class="login__form">
      <label for="code">Code d'accès</label>
      <input id="code" name="code" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Entrer</button>
      <?php if ($loginError): ?><p class="err">Code incorrect.</p><?php endif; ?>
    </form>
  </main>
<?php else: ?>
  <header class="bar">
    <img src="assets/brand/18h22-mark.svg" alt="18H22">
    <h1>Projets <sup id="count"><?= count($projects) ?></sup></h1>
    <nav>
      <a href="./" target="_blank" rel="noopener">Voir le site</a>
      <button type="button" id="logout">Quitter</button>
    </nav>
  </header>

  <main class="wrap">
    <?php if (!$writable): ?>
      <p class="warn">Le serveur n'autorise pas l'écriture dans data/, assets/projects/ ou assets/js/. Donnez les droits d'écriture (755 ou 775) à ces dossiers.</p>
    <?php endif; ?>

    <label class="drop" id="drop">
      <input type="file" id="file" accept="image/jpeg,image/png,image/webp" multiple>
      <span class="drop__title">Ajouter des projets</span>
      <span class="drop__hint">Touchez pour choisir des images, ou glissez-les ici. JPEG, PNG ou WebP.</span>
    </label>
    <div class="queue" id="queue"></div>

    <section class="settings" id="settings" aria-labelledby="settingsTitle">
      <h2 id="settingsTitle">Animation</h2>
      <div class="settings__grid">
        <label class="range"><span>Vitesse des fondus <output data-for="fade"></output></span>
          <input type="range" id="set-fade" data-key="fade" data-unit=" s" min="0.2" max="4" step="0.1">
          <small><i>Rapide</i><i>Lent</i></small></label>
        <label class="range"><span>Apparition <output data-for="every"></output></span>
          <input type="range" id="set-every" data-key="every" data-unit=" s" data-prefix="toutes les ~" min="0.4" max="6" step="0.1">
          <small><i>Souvent</i><i>Rarement</i></small></label>
        <label class="range"><span>Projets à l'écran <output data-for="max"></output></span>
          <input type="range" id="set-max" data-key="max" min="2" max="10" step="1">
          <small><i>2</i><i>10 (3 max sur mobile)</i></small></label>
        <label class="range"><span>Taille moyenne <output data-for="size"></output></span>
          <input type="range" id="set-size" data-key="size" data-unit=" %" min="6" max="30" step="1">
          <small><i>Petites</i><i>Grandes</i></small></label>
        <label class="range"><span>Variété des tailles <output data-for="variety"></output></span>
          <input type="range" id="set-variety" data-key="variety" min="0" max="100" step="1">
          <small><i>Toutes pareilles</i><i>Vignettes et grands formats</i></small></label>
        <label class="range"><span>Espace entre les projets <output data-for="spacing"></output></span>
          <input type="range" id="set-spacing" data-key="spacing" min="0" max="100" step="1">
          <small><i>Serrés</i><i>Aérés</i></small></label>
      </div>
      <button type="button" class="linkbtn" id="resetSettings">Revenir aux réglages d'origine</button>
    </section>

    <p class="help">Glissez les cartes (ou utilisez les flèches) pour changer l'ordre. Le titre est facultatif et s'affiche sous l'image.</p>
    <ol class="list" id="list"></ol>

    <div class="savebar" id="savebar" hidden>
      <span>Modifications non enregistrées</span>
      <button type="button" id="save">Enregistrer</button>
    </div>
    <p class="toast" id="toast" role="status" aria-live="polite"></p>
  </main>

  <script>
    window.ADMIN = { csrf: <?= json_encode($csrf) ?>, settings: <?= json_encode($settings) ?>, defaults: <?= json_encode(array_map(fn($r) => $r[2], SETTINGS_RANGE)) ?>, projects: <?= json_encode(array_values($projects), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) ?> };
  </script>
  <script src="assets/js/admin.js"></script>
<?php endif; ?>
</body>
</html>
