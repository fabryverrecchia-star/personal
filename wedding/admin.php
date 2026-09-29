<?php
/*
 * Private page for Lindsey & Andrea: read the guestbook, browse and
 * download every photo and video. Set 'admin_password_hash' in api/config.php.
 */
require __DIR__ . '/api/lib.php';

session_name('la_admin');
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
        $error = 'Set admin_password in api/config.php first.';
    } elseif (!rate_limit('login', 10, 900)) {
        $error = 'Too many attempts. Try again in 15 minutes.';
    } elseif (($hash !== '' && password_verify((string) $_POST['password'], $hash))
        || ($plain !== '' && hash_equals($plain, (string) $_POST['password']))) {
        session_regenerate_id(true);
        $_SESSION['ok'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $error = 'Wrong password.';
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
        exit('Invalid token');
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

/* ───────────── Data ───────────── */

$messages = $authed ? array_reverse(read_jsonl(storage_file('messages.jsonl'))) : [];
$media = $authed ? array_reverse(media_all()) : [];
$hidden = $authed ? array_flip(hidden_ids()) : [];
$tab = ($_GET['tab'] ?? 'messages') === 'media' ? 'media' : 'messages';
$totalBytes = array_sum(array_map(function ($m) { return (int) $m['size']; }, $media));

function human_size(int $b): string
{
    if ($b < 1048576) {
        return max(1, round($b / 1024)) . ' KB';
    }
    if ($b < 1073741824) {
        return round($b / 1048576, 1) . ' MB';
    }
    return round($b / 1073741824, 2) . ' GB';
}
function when(string $iso): string
{
    $t = strtotime($iso);
    return $t ? date('d.m.Y · H:i', $t) : '';
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>L &amp; A · Private</title>
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<style>
  @font-face { font-family: "Cormorant"; src: url("assets/fonts/cormorant.woff2") format("woff2"); font-weight: 300 700; font-display: swap; }
  @font-face { font-family: "Cormorant"; src: url("assets/fonts/cormorant-italic.woff2") format("woff2"); font-weight: 300 700; font-style: italic; font-display: swap; }
  @font-face { font-family: "Pinyon"; src: url("assets/fonts/pinyon.woff2") format("woff2"); font-display: swap; }
  :root { color-scheme: light; --ivory:#f7f3ec; --paper:#fbf8f3; --navy:#14295a; --soft:rgba(20,41,90,.66); --line:rgba(20,41,90,.16); }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--ivory); color:var(--navy); font:18px/1.5 "Cormorant", Garamond, serif; -webkit-font-smoothing:antialiased; }
  a { color:inherit; }
  .wrap { max-width:1100px; margin:0 auto; padding: calc(20px + env(safe-area-inset-top)) 16px 60px; }
  header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px; }
  .mono { font-size:26px; font-weight:500; text-decoration:none; }
  .mono i { font-size:.6em; vertical-align:.35em; }
  .small { font-size:12px; letter-spacing:.24em; text-transform:uppercase; color:var(--soft); }
  h1 { font-family:"Pinyon", cursive; font-weight:400; font-size:clamp(46px,12vw,72px); line-height:1.1; margin:18px 0 4px; text-align:center; }
  .stats { text-align:center; margin-bottom:24px; }
  nav.tabs { display:flex; justify-content:center; gap:6px; margin:0 auto 28px; padding:4px; border:1px solid var(--line); border-radius:999px; width:max-content; }
  nav.tabs a { text-decoration:none; padding:10px 20px; border-radius:999px; font-size:12px; letter-spacing:.22em; text-transform:uppercase; }
  nav.tabs a.on { background:var(--navy); color:var(--ivory); }
  .notes { display:grid; gap:14px; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); }
  .note { background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:22px 20px; }
  .note p { margin:0 0 14px; white-space:pre-wrap; font-size:19px; }
  .note b { font-weight:600; }
  .grid { display:grid; gap:8px; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); }
  .tile { position:relative; background:#ebe4d8; border-radius:8px; overflow:hidden; aspect-ratio:1; }
  .tile img, .tile video { width:100%; height:100%; object-fit:cover; display:block; }
  .tile .cap { position:absolute; left:0; right:0; bottom:0; padding:18px 8px 6px; font-size:13px; color:#fff; background:linear-gradient(transparent, rgba(10,20,45,.7)); display:flex; justify-content:space-between; gap:6px; }
  .tile .cap a { text-decoration:none; }
  .tile .badge { position:absolute; top:6px; left:6px; background:rgba(20,41,90,.8); color:#fff; font-size:11px; letter-spacing:.14em; padding:2px 7px; border-radius:99px; text-transform:uppercase; }
  .tile.is-hidden > :not(.mod):not(.badge--hidden) { opacity:.35; }
  .tile .badge--hidden { left:auto; right:6px; background:#9a3b3b; }
  .tile--audio { background:var(--navy); color:var(--ivory); }
  .voice { height:100%; display:grid; place-content:center; gap:10px; padding:10px; text-align:center; }
  .voice .script { font-family:"Pinyon", cursive; font-size:30px; }
  .voice audio { width:100%; max-width:100%; }
  .mod { position:absolute; top:6px; right:6px; display:flex; gap:4px; opacity:0; transition:opacity .2s; }
  .tile:hover .mod, .tile:focus-within .mod, .tile.is-hidden .mod { opacity:1; }
  @media (hover:none) { .mod { opacity:1; } }
  .tile.is-hidden .mod { top:32px; }
  .mod button { min-height:30px; padding:0 10px; font-size:10px; letter-spacing:.16em; background:rgba(247,243,236,.92); color:var(--navy); }
  .mod button.del { background:rgba(154,59,59,.92); color:#fff; }
  .mod button.armed { background:#9a3b3b; color:#fff; }
  .empty { text-align:center; font-style:italic; color:var(--soft); padding:40px 0; }
  form.login { max-width:340px; margin:14vh auto 0; text-align:center; display:grid; gap:16px; }
  input[type=password] { font:inherit; font-size:19px; padding:12px 2px; border:0; border-bottom:1px solid var(--line); background:none; text-align:center; outline:none; }
  button { font:inherit; font-size:13px; letter-spacing:.24em; text-transform:uppercase; min-height:52px; border-radius:999px; border:0; background:var(--navy); color:var(--ivory); cursor:pointer; }
  .err { color:#9a3b3b; font-style:italic; }
</style>
</head>
<body>
<div class="wrap">
<?php if (!$authed): ?>
  <form class="login" method="post">
    <div class="mono" style="font-size:56px">L<i>&amp;</i>A</div>
    <span class="small">Private area</span>
    <input type="password" name="password" placeholder="Password" autocomplete="current-password" required autofocus>
    <button type="submit">Enter</button>
    <?php if ($error): ?><p class="err"><?= h($error) ?></p><?php endif; ?>
    <?php if ($locked): ?><p class="err">Espace verrouillé : écrivez un mot de passe dans <code>admin_password</code> (fichier <code>api/config.php</code>).</p><?php endif; ?>
  </form>
<?php else: ?>
  <header>
    <a class="mono" href="./">L<i>&amp;</i>A</a>
    <a class="small" href="?logout=1">Log out</a>
  </header>
  <h1>Our Favorite People</h1>
  <p class="stats small"><?= count($messages) ?> notes · <?= count($media) ?> files<?= $hidden ? ' (' . count($hidden) . ' hidden)' : '' ?> · <?= human_size($totalBytes) ?></p>
  <nav class="tabs">
    <a href="?tab=messages" class="<?= $tab === 'messages' ? 'on' : '' ?>">Guestbook</a>
    <a href="?tab=media" class="<?= $tab === 'media' ? 'on' : '' ?>">Photos, videos &amp; voice</a>
  </nav>

  <?php if ($tab === 'messages'): ?>
    <?php if (!$messages): ?><p class="empty">No notes yet.</p><?php endif; ?>
    <div class="notes">
      <?php foreach ($messages as $m): ?>
        <article class="note">
          <p><?= h($m['message']) ?></p>
          <div><b><?= h($m['name']) ?></b> <span class="small">· <?= h(when($m['time'])) ?></span></div>
        </article>
      <?php endforeach; ?>
    </div>
  <?php else: ?>
    <?php if (!$media): ?><p class="empty">No photos or videos yet.</p><?php endif; ?>
    <div class="grid">
      <?php foreach ($media as $m): $src = 'admin.php?f=' . rawurlencode($m['id']); $isHidden = isset($hidden[$m['id']]); ?>
        <div class="tile<?= $isHidden ? ' is-hidden' : '' ?><?= $m['kind'] === 'audio' ? ' tile--audio' : '' ?>" id="m-<?= h($m['id']) ?>">
          <?php if ($m['kind'] === 'video'): ?>
            <video src="<?= h($src) ?>#t=0.1" preload="metadata" controls playsinline></video>
            <span class="badge">Video</span>
          <?php elseif ($m['kind'] === 'audio'): ?>
            <div class="voice">
              <span class="script">Voice note</span>
              <audio src="<?= h($src) ?>" preload="none" controls></audio>
            </div>
            <span class="badge">Audio</span>
          <?php elseif (preg_match('/image\/(jpeg|png|gif|webp|avif)/', (string) $m['mime'])): ?>
            <a href="<?= h($src) ?>" target="_blank" rel="noopener"><img src="<?= h($src) ?>" loading="lazy" alt=""></a>
          <?php else: ?>
            <a href="<?= h($src) ?>&amp;dl=1" style="display:grid;place-items:center;height:100%;text-decoration:none" class="small"><?= h(strtoupper(pathinfo($m['file'], PATHINFO_EXTENSION))) ?></a>
          <?php endif; ?>
          <?php if ($isHidden): ?><span class="badge badge--hidden">Hidden</span><?php endif; ?>
          <div class="cap">
            <span><?= h($m['guest'] ?: '—') ?> · <?= human_size((int) $m['size']) ?></span>
            <a href="<?= h($src) ?>&amp;dl=1" aria-label="Download">⤓</a>
          </div>
          <form method="post" class="mod">
            <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
            <input type="hidden" name="id" value="<?= h($m['id']) ?>">
            <button name="action" value="<?= $isHidden ? 'show' : 'hide' ?>"><?= $isHidden ? 'Show' : 'Hide' ?></button>
            <button name="action" value="delete" class="del" data-confirm>Delete</button>
          </form>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
<?php endif; ?>
</div>
<script>
  // Delete asks twice, in the page (no browser dialog): first tap arms the button.
  document.querySelectorAll('[data-confirm]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      if (b.classList.contains('armed')) return;
      e.preventDefault();
      b.classList.add('armed');
      b.textContent = 'Sure?';
      setTimeout(function () { b.classList.remove('armed'); b.textContent = 'Delete'; }, 3000);
    });
  });
</script>
</body>
</html>
