<?php
/*
 * Espace privé des parents : lire le livre d'or, voir et télécharger
 * toutes les photos et vidéos. Mot de passe : 'admin_password' dans api/config.php.
 */
require __DIR__ . '/api/lib.php';

session_name('lou_admin');
$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => $secure]);
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', $secure, true);
}
session_start();

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

$hash = (string) (config()['admin_password_hash'] ?? '');
$plain = (string) (config()['admin_password'] ?? '');
$locked = $hash === '' && $plain === '';
$error = '';

if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: admin.php');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['password'])) {
    if ($locked) {
        $error = 'Écrivez d’abord un mot de passe dans api/config.php.';
    } elseif (!rate_limit('login', 10, 900)) {
        $error = 'Trop d’essais. Réessayez dans 15 minutes.';
    } elseif (($hash !== '' && password_verify((string) $_POST['password'], $hash))
        || ($plain !== '' && hash_equals($plain, (string) $_POST['password']))) {
        session_regenerate_id(true);
        $_SESSION['ok'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $error = 'Mot de passe incorrect.';
    }
}

$authed = !empty($_SESSION['ok']) && !$locked;

/* ───────────── Moderation (hide from the public gallery / delete) ───────────── */

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}
if ($authed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action'], $_POST['id'])) {
    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(403);
        exit('Jeton invalide');
    }
    $id = (string) $_POST['id'];
    if (preg_match('/^[a-f0-9]{16}$/', $id)) {
        $action = (string) $_POST['action'];
        if ($action === 'hide') {
            set_hidden($id, true);
        } elseif ($action === 'show') {
            set_hidden($id, false);
        } elseif ($action === 'delete') {
            media_delete($id);
        }
    }
    header('Location: admin.php?tab=media#m-' . rawurlencode($id));
    exit;
}

/* ───────────── File streaming (with HTTP Range for video / audio) ───────────── */

if ($authed && isset($_GET['f'])) {
    $item = media_find((string) $_GET['f']);
    $path = $item ? storage_dir() . '/' . $item['file'] : '';
    if (!$item || str_contains($item['file'], '..') || !is_file($path)) {
        http_response_code(404);
        exit('Not found');
    }
    stream_file($path, (string) $item['mime'], (string) ($item['original'] ?: basename($path)), isset($_GET['dl']), 'private, max-age=86400');
}

/* ───────────── Tout télécharger (ZIP, sans recompression) ───────────── */

if ($authed && isset($_GET['zip'])) {
    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        exit('L’extension PHP « zip » n’est pas disponible : téléchargez le dossier storage/uploads par FTP.');
    }
    @set_time_limit(0);
    session_write_close();
    $tmp = storage_dir('tmp') . '/album-' . bin2hex(random_bytes(6)) . '.zip';
    $zip = new ZipArchive();
    if ($zip->open($tmp, ZipArchive::CREATE) !== true) {
        http_response_code(500);
        exit('Impossible de créer le fichier ZIP.');
    }
    $used = [];
    foreach (media_all() as $m) {
        $path = storage_dir() . '/' . $m['file'];
        if (str_contains($m['file'], '..') || !is_file($path)) {
            continue;
        }
        $who = preg_replace('/[^A-Za-z0-9 _-]+/', '', (function_exists('iconv') ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string) ($m['guest'] ?: 'invite')) : (string) $m['guest']) ?: 'invite');
        $name = trim($who) . '/' . basename($path);
        if (isset($used[$name])) {
            $name = trim($who) . '/' . $m['id'] . '_' . basename($path);
        }
        $used[$name] = true;
        $zip->addFile($path, $name);
        if (method_exists($zip, 'setCompressionName')) {
            $zip->setCompressionName($name, ZipArchive::CM_STORE);   // photos et vidéos sont déjà compressées
        }
    }
    $msgs = read_jsonl(storage_file('messages.jsonl'));
    if ($msgs) {
        $txt = '';
        foreach ($msgs as $n) {
            $txt .= $n['name'] . ' — ' . $n['time'] . "\n" . $n['message'] . "\n\n";
        }
        $zip->addFromString('livre-d-or.txt', $txt);
    }
    $zip->close();
    if (!is_file($tmp)) {
        exit('Rien à télécharger pour l’instant.');
    }
    register_shutdown_function(function () use ($tmp) { @unlink($tmp); });
    stream_file($tmp, 'application/zip', 'bapteme-lou-album.zip', true, 'private, no-store');
}


/* ───────────── Livre d'or à imprimer (→ « Enregistrer en PDF ») ───────────── */

$months = [1 => 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
$fr = function ($iso, $withTime = true) use ($months) {
    $t = strtotime((string) $iso);
    return $t ? date('j', $t) . ' ' . $months[(int) date('n', $t)] . ' ' . date('Y', $t) . ($withTime ? ' · ' . date('H:i', $t) : '') : '';
};

$fonts = '@font-face { font-family: "Cormorant"; src: url("assets/fonts/cormorant.woff2") format("woff2"); font-weight: 300 700; font-display: swap; }
  @font-face { font-family: "Cormorant"; src: url("assets/fonts/cormorant-italic.woff2") format("woff2"); font-weight: 300 700; font-style: italic; font-display: swap; }';

if ($authed && isset($_GET['export'])) {
    $notes = read_jsonl(storage_file('messages.jsonl'));          // du plus ancien au plus récent, comme un livre
    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Livre d’or · Lou · 31.10.2026</title>
<style>
  <?= $fonts ?>
  @page { size: A4; margin: 18mm 18mm 20mm; }
  :root { --ink: #6f6968; --strong: #4f4a49; --soft: #8f8988; --line: rgba(111, 105, 104, .22); --sage: #6d8770; }
  * { box-sizing: border-box; }
  html { background: #eeebe7; }
  body { margin: 0; color: var(--ink); font: 13pt/1.55 "Cormorant", Garamond, "Times New Roman", serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { background: #fcfaf8; max-width: 210mm; margin: 0 auto; padding: 18mm; }
  .bar { position: sticky; top: 0; z-index: 2; display: flex; gap: 10px; justify-content: center; padding: 12px 16px; background: #2f4a3c; }
  .bar button, .bar a { font: 14px/1 Georgia, serif; letter-spacing: .08em; padding: 12px 18px; border-radius: 99px; border: 1px solid rgba(255, 255, 255, .5); background: #fcfaf8; color: #2f4a3c; text-decoration: none; cursor: pointer; }
  .bar a { background: transparent; color: #fcfaf8; }
  .cover { min-height: 250mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .cover img { width: 120mm; max-width: 80%; }
  .cover .pre { font-style: italic; font-size: 18pt; margin: 8mm 0 0; color: var(--soft); }
  .cover h1 { font-weight: 400; font-size: 54pt; letter-spacing: .16em; padding-left: .16em; margin: 0; line-height: 1.1; color: var(--ink); text-transform: uppercase; }
  .cover .date { font-style: italic; font-size: 16pt; color: var(--soft); margin: 2mm 0 0; }
  .cover .count { margin-top: 14mm; font-size: 11pt; letter-spacing: .3em; text-transform: uppercase; color: var(--sage); }
  .notes { page-break-before: always; break-before: page; }
  .note { break-inside: avoid; page-break-inside: avoid; padding: 9mm 0 8mm; border-bottom: 1px solid var(--line); }
  .note:last-child { border-bottom: 0; }
  .note p { margin: 0 0 4mm; white-space: pre-wrap; font-size: 15pt; color: var(--strong); }
  .who { display: flex; justify-content: space-between; align-items: baseline; gap: 8mm; }
  .who b { font-style: italic; font-weight: 500; font-size: 17pt; }
  .who span { font-size: 9.5pt; letter-spacing: .12em; text-transform: uppercase; color: var(--soft); white-space: nowrap; }
  .end { text-align: center; font-style: italic; font-size: 26pt; margin: 12mm 0 0; }
  .empty { text-align: center; font-style: italic; color: var(--soft); padding: 30mm 0; }
  @media print { html { background: none; } .bar { display: none; } .sheet { padding: 0; max-width: none; background: none; } }
  @media screen and (max-width: 600px) { .sheet { padding: 8mm; } .cover { min-height: 150mm; } }
</style>
</head>
<body>
  <div class="bar">
    <button type="button" onclick="window.print()">Enregistrer en PDF</button>
    <a href="admin.php">Retour</a>
  </div>
  <div class="sheet">
    <section class="cover">
      <div style="position:relative;width:120mm;max-width:80%;aspect-ratio:775/745"><img src="assets/img/vines.webp" alt="" style="position:absolute;inset:0;width:100%"><img src="assets/img/church.webp" alt="" style="position:absolute;inset:0;width:100%"></div>
      <p class="pre">le livre d’or de</p>
      <h1>Lou</h1>
      <p class="date">son baptême, le 31 octobre 2026</p>
      <p class="count"><?= count($notes) ?> message<?= count($notes) > 1 ? 's' : '' ?></p>
    </section>
    <section class="notes">
      <?php if (!$notes): ?><p class="empty">Aucun message pour l’instant.</p><?php endif; ?>
      <?php foreach ($notes as $m): ?>
        <article class="note">
          <p><?= h($m['message']) ?></p>
          <div class="who"><b><?= h($m['name']) ?></b><span><?= h($fr($m['time'])) ?></span></div>
        </article>
      <?php endforeach; ?>
      <?php if ($notes): ?><p class="end">Merci</p><?php endif; ?>
    </section>
  </div>
  <script>
    if (location.hash === '#print' && document.fonts) document.fonts.ready.then(function () { setTimeout(function () { window.print(); }, 400); });
  </script>
</body>
</html>
<?php
    exit;
}

/* ───────────── Données ───────────── */

$messages = $authed ? array_reverse(read_jsonl(storage_file('messages.jsonl'))) : [];
$media = $authed ? array_reverse(media_all()) : [];
$hidden = $authed ? array_flip(hidden_ids()) : [];
$tab = ($_GET['tab'] ?? 'messages') === 'media' ? 'media' : 'messages';
$totalBytes = array_sum(array_map(function ($m) { return (int) $m['size']; }, $media));
$photos = count(array_filter($media, function ($m) { return $m['kind'] === 'photo'; }));
$videos = count(array_filter($media, function ($m) { return $m['kind'] === 'video'; }));

function human_size(int $b): string
{
    if ($b < 1048576) {
        return max(1, round($b / 1024)) . ' Ko';
    }
    if ($b < 1073741824) {
        return str_replace('.', ',', (string) round($b / 1048576, 1)) . ' Mo';
    }
    return str_replace('.', ',', (string) round($b / 1073741824, 2)) . ' Go';
}
function plural(int $n, string $one, string $many): string
{
    return $n . ' ' . ($n > 1 ? $many : $one);
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#fcfaf8">
<title>Espace privé · Baptême de Lou</title>
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<style>
  <?= $fonts ?>
  :root { color-scheme: light; --paper:#fcfaf8; --card:#fff; --ink:#6f6968; --strong:#4f4a49; --soft:#8f8988; --line:rgba(111,105,104,.18); --sage:#6d8770; --forest:#2f4a3c; --terra:#cf7a62; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:19px/1.5 "Cormorant", Garamond, serif; -webkit-font-smoothing:antialiased; }
  a { color:inherit; }
  .wrap { max-width:1100px; margin:0 auto; padding: calc(16px + env(safe-area-inset-top)) 16px 60px; }
  header { display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; font-size:20px; letter-spacing:.24em; text-transform:uppercase; color:var(--strong); }
  .brand img { width:44px; }
  .small { font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--soft); }
  .hero { text-align:center; margin: 18px 0 22px; }
  .crest { position:relative; width:min(260px,62vw); aspect-ratio:775/745; margin:0 auto; }
  .crest img { position:absolute; inset:0; width:100%; height:100%; }
  h1 { font-weight:400; font-size:clamp(36px,10vw,52px); line-height:1.05; margin:6px 0 4px; color:var(--strong); }
  h1 i { color:var(--ink); }
  .stats { display:flex; justify-content:center; flex-wrap:wrap; gap:8px; margin:14px 0 22px; }
  .stats span { background:var(--card); border:1px solid var(--line); border-radius:999px; padding:6px 14px; font-size:16px; }
  nav.tabs { display:flex; justify-content:center; gap:4px; margin:0 auto 22px; padding:4px; border:1px solid var(--line); border-radius:999px; width:max-content; max-width:100%; background:var(--card); }
  nav.tabs a { text-decoration:none; padding:10px 18px; border-radius:999px; font-size:12px; letter-spacing:.18em; text-transform:uppercase; white-space:nowrap; }
  nav.tabs a.on { background:var(--forest); color:var(--paper); }
  .tools { display:flex; justify-content:center; flex-wrap:wrap; gap:8px; margin:-6px 0 24px; }
  .pill { display:inline-flex; align-items:center; gap:8px; font-size:12px; letter-spacing:.2em; text-transform:uppercase; text-decoration:none; padding:12px 20px; border:1px solid rgba(47,74,60,.35); color:var(--forest); border-radius:999px; background:var(--card); }
  .notes { display:grid; gap:14px; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); }
  .note { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:22px 20px; box-shadow:0 10px 30px -18px rgba(79,74,73,.3); }
  .note p { margin:0 0 14px; white-space:pre-wrap; font-size:20px; color:var(--strong); }
  .note b { font-style:italic; font-weight:500; font-size:20px; }
  .grid { display:grid; gap:8px; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); }
  .tile { position:relative; background:#efeae6; border-radius:12px; overflow:hidden; aspect-ratio:1; }
  .tile img, .tile video { width:100%; height:100%; object-fit:cover; display:block; }
  .tile .cap { position:absolute; left:0; right:0; bottom:0; padding:20px 8px 6px; font-size:14px; color:#fff; background:linear-gradient(transparent, rgba(40,36,35,.7)); display:flex; justify-content:space-between; gap:6px; }
  .tile .cap a { text-decoration:none; font-size:18px; line-height:1; }
  .tile .badge { position:absolute; top:6px; left:6px; background:rgba(47,74,60,.85); color:#fff; font-size:11px; letter-spacing:.14em; padding:2px 8px; border-radius:99px; text-transform:uppercase; }
  .tile.is-hidden > :not(.mod):not(.badge--hidden) { opacity:.35; }
  .tile .badge--hidden { left:auto; right:6px; background:var(--terra); }
  .mod { position:absolute; top:6px; right:6px; display:flex; gap:4px; opacity:0; transition:opacity .2s; }
  .tile:hover .mod, .tile:focus-within .mod, .tile.is-hidden .mod { opacity:1; }
  @media (hover:none) { .mod { opacity:1; } }
  .tile.is-hidden .mod { top:32px; }
  .mod button { min-height:30px; padding:0 10px; font-size:10px; letter-spacing:.14em; background:rgba(252,250,248,.94); color:var(--forest); }
  .mod button.del { background:rgba(207,122,98,.95); color:#fff; }
  .mod button.armed { background:#a8503a; color:#fff; }
  .empty { text-align:center; font-style:italic; color:var(--soft); padding:40px 0; }
  form.login { max-width:340px; margin:10vh auto 0; text-align:center; display:grid; gap:16px; }
  form.login img { width:200px; margin:0 auto; }
  input[type=password] { font:inherit; font-size:20px; padding:12px 2px; border:0; border-bottom:1px solid var(--line); background:none; text-align:center; outline:none; color:var(--strong); }
  input[type=password]:focus { border-color:var(--sage); }
  button { font:inherit; font-size:13px; letter-spacing:.22em; text-transform:uppercase; min-height:52px; border-radius:999px; border:0; background:var(--forest); color:var(--paper); cursor:pointer; }
  .err { color:var(--terra); font-style:italic; }
</style>
</head>
<body>
<div class="wrap">
<?php if (!$authed): ?>
  <form class="login" method="post">
    <img src="assets/img/dove.webp" alt="">
    <h1>Lou</h1>
    <span class="small">Espace privé</span>
    <input type="password" name="password" placeholder="Mot de passe" autocomplete="current-password" required autofocus>
    <button type="submit">Entrer</button>
    <?php if ($error): ?><p class="err"><?= h($error) ?></p><?php endif; ?>
    <?php if ($locked): ?><p class="err">Espace verrouillé : écrivez un mot de passe dans <code>admin_password</code> (fichier <code>api/config.php</code>).</p><?php endif; ?>
  </form>
<?php else: ?>
  <header>
    <a class="brand" href="./"><img src="assets/img/dove.webp" alt="">Lou</a>
    <a class="small" href="?logout=1">Se déconnecter</a>
  </header>
  <div class="hero">
    <div class="crest"><img src="assets/img/vines.webp" alt=""><img src="assets/img/church.webp" alt=""></div>
    <h1>Les souvenirs <i>de Lou</i></h1>
  </div>
  <p class="stats">
    <span><?= plural(count($messages), 'message', 'messages') ?></span>
    <span><?= plural($photos, 'photo', 'photos') ?></span>
    <span><?= plural($videos, 'vidéo', 'vidéos') ?></span>
    <span><?= human_size($totalBytes) ?></span>
    <?php if ($hidden): ?><span><?= plural(count($hidden), 'masquée', 'masquées') ?></span><?php endif; ?>
  </p>
  <nav class="tabs">
    <a href="?tab=messages" class="<?= $tab === 'messages' ? 'on' : '' ?>">Livre d’or</a>
    <a href="?tab=media" class="<?= $tab === 'media' ? 'on' : '' ?>">Photos &amp; vidéos</a>
  </nav>

  <?php if ($tab === 'messages'): ?>
    <?php if ($messages): ?><p class="tools"><a class="pill" href="admin.php?export=1#print">Exporter en PDF</a></p><?php endif; ?>
    <?php if (!$messages): ?><p class="empty">Pas encore de message.</p><?php endif; ?>
    <div class="notes">
      <?php foreach ($messages as $m): ?>
        <article class="note">
          <p><?= h($m['message']) ?></p>
          <div><b><?= h($m['name']) ?></b> <span class="small">· <?= h($fr($m['time'])) ?></span></div>
        </article>
      <?php endforeach; ?>
    </div>
  <?php else: ?>
    <?php if ($media): ?><p class="tools"><a class="pill" href="admin.php?zip=1">Tout télécharger (ZIP · <?= human_size($totalBytes) ?>)</a></p><?php endif; ?>
    <?php if (!$media): ?><p class="empty">Pas encore de photo ni de vidéo.</p><?php endif; ?>
    <div class="grid">
      <?php foreach ($media as $m): $src = 'admin.php?f=' . rawurlencode($m['id']); $isHidden = isset($hidden[$m['id']]); ?>
        <div class="tile<?= $isHidden ? ' is-hidden' : '' ?>" id="m-<?= h($m['id']) ?>">
          <?php if ($m['kind'] === 'video'): ?>
            <video src="<?= h($src) ?>#t=0.1" preload="metadata" controls playsinline></video>
            <span class="badge">Vidéo</span>
          <?php elseif ($m['kind'] === 'audio'): ?>
            <audio src="<?= h($src) ?>" preload="none" controls style="width:100%;margin-top:40%"></audio>
            <span class="badge">Audio</span>
          <?php elseif (preg_match('/image\/(jpeg|png|gif|webp|avif)/', (string) $m['mime'])): ?>
            <a href="<?= h($src) ?>" target="_blank" rel="noopener"><img src="<?= h($src) ?>" loading="lazy" alt=""></a>
          <?php else: ?>
            <a href="<?= h($src) ?>&amp;dl=1" style="display:grid;place-items:center;height:100%;text-decoration:none" class="small"><?= h(strtoupper(pathinfo($m['file'], PATHINFO_EXTENSION))) ?></a>
          <?php endif; ?>
          <?php if ($isHidden): ?><span class="badge badge--hidden">Masquée</span><?php endif; ?>
          <div class="cap">
            <span><?= h($m['guest'] ?: '—') ?> · <?= human_size((int) $m['size']) ?></span>
            <a href="<?= h($src) ?>&amp;dl=1" aria-label="Télécharger">⤓</a>
          </div>
          <form method="post" class="mod">
            <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
            <input type="hidden" name="id" value="<?= h($m['id']) ?>">
            <button name="action" value="<?= $isHidden ? 'show' : 'hide' ?>"><?= $isHidden ? 'Afficher' : 'Masquer' ?></button>
            <button name="action" value="delete" class="del" data-confirm>Supprimer</button>
          </form>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
<?php endif; ?>
</div>
<script>
  // Supprimer demande confirmation dans la page : le premier appui arme le bouton.
  document.querySelectorAll('[data-confirm]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      if (b.classList.contains('armed')) return;
      e.preventDefault();
      b.classList.add('armed');
      b.textContent = 'Sûr ?';
      setTimeout(function () { b.classList.remove('armed'); b.textContent = 'Supprimer'; }, 3000);
    });
  });
</script>
</body>
</html>
