<?php
/*
 * Espace privé : l'IBAN saisi par Lindsey et toutes les réponses du quiz.
 * Mot de passe : 'admin_password' dans api/config.php.
 */
require __DIR__ . '/api/lib.php';

$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => $secure]);
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', $secure, true);
}
session_name('busta_admin');
session_start();
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

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
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

// delete one entry
if ($authed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['delete'])) {
    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(403);
        exit('Jeton invalide');
    }
    $id = (string) $_POST['delete'];
    $file = storage_file('entries.jsonl');
    $fp = @fopen($file, 'c+');
    if ($fp) {
        flock($fp, LOCK_EX);
        $keep = '';
        while (($line = fgets($fp)) !== false) {
            $row = json_decode($line, true);
            if (is_array($row) && hash_equals((string) $row['id'], $id)) {
                continue;
            }
            $keep .= $line;
        }
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $keep);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
    header('Location: admin.php');
    exit;
}

$entries = $authed ? array_reverse(read_jsonl(storage_file('entries.jsonl'))) : [];
function when_fr($iso)
{
    $t = strtotime((string) $iso);
    return $t ? date('d.m.Y · H:i', $t) : '';
}
function iban_groups($iban)
{
    return trim(chunk_split((string) $iban, 4, ' '));
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Espace privé · La bustarella</title>
<style>
  @font-face { font-family: "Cormorant"; src: url("assets/fonts/cormorant.woff2") format("woff2"); font-weight: 300 700; }
  @font-face { font-family: "Pinyon"; src: url("assets/fonts/pinyon.woff2") format("woff2"); }
  :root { color-scheme: light; --ivory: #f7f3ec; --paper: #fbf8f3; --navy: #14295a; --soft: rgba(20, 41, 90, .62); --line: rgba(20, 41, 90, .16); --wax: #7d1f2c; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--ivory); color: var(--navy); font: 18px/1.5 "Cormorant", Garamond, serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: calc(20px + env(safe-area-inset-top)) 16px 60px; }
  header { display: flex; justify-content: space-between; align-items: center; }
  .small { font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--soft); }
  h1 { font-family: "Pinyon", cursive; font-weight: 400; font-size: clamp(42px, 11vw, 64px); margin: 18px 0 4px; text-align: center; line-height: 1.1; }
  .sub { text-align: center; margin: 0 0 28px; }
  .list { display: grid; gap: 14px; }
  .entry { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 20px; }
  .entry h2 { margin: 0 0 12px; font-size: 13px; letter-spacing: .26em; text-transform: uppercase; font-weight: 600; display: flex; justify-content: space-between; gap: 10px; }
  .entry h2 span { color: var(--soft); font-weight: 400; letter-spacing: .08em; }
  .iban { font: 600 21px/1.3 ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: .04em; word-break: break-all; margin: 6px 0; }
  .row { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; }
  .k { display: block; font-size: 11px; letter-spacing: .24em; text-transform: uppercase; color: var(--soft); }
  .qa { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
  .qa li { border-top: 1px solid var(--line); padding-top: 10px; }
  .qa li:first-child { border-top: 0; padding-top: 0; }
  .qa b { color: var(--wax); font-weight: 600; }
  button, .btn { font: inherit; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; min-height: 40px; padding: 0 16px; border-radius: 99px; border: 1px solid var(--navy); background: var(--navy); color: var(--ivory); cursor: pointer; }
  button.ghost { background: none; color: var(--navy); }
  button.del { background: none; color: var(--wax); border-color: rgba(125, 31, 44, .5); }
  button.armed { background: var(--wax); color: #fff; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
  .empty { text-align: center; font-style: italic; color: var(--soft); padding: 40px 0; }
  form.login { max-width: 340px; margin: 14vh auto 0; text-align: center; display: grid; gap: 16px; }
  input[type=password] { font: inherit; font-size: 19px; padding: 12px 2px; border: 0; border-bottom: 1px solid var(--line); background: none; text-align: center; outline: none; }
  .err { color: var(--wax); font-style: italic; }
  .note { font-style: italic; margin: 8px 0 0; }
</style>
</head>
<body>
<div class="wrap">
<?php if (!$authed): ?>
  <form class="login" method="post">
    <div style="font-family:Pinyon,cursive;font-size:44px;line-height:1">La bustarella</div>
    <span class="small">Espace privé</span>
    <input type="password" name="password" placeholder="Mot de passe" autocomplete="current-password" required autofocus>
    <button type="submit">Entrer</button>
    <?php if ($error): ?><p class="err"><?= h($error) ?></p><?php endif; ?>
    <?php if ($locked): ?><p class="err">Espace verrouillé : écrivez un mot de passe dans <code>admin_password</code> (fichier <code>api/config.php</code>).</p><?php endif; ?>
  </form>
<?php else: ?>
  <header><span class="small">Fabrizio, Emilie, Naël &amp; Lou</span><a class="small" href="?logout=1">Déconnexion</a></header>
  <h1>Les réponses</h1>
  <p class="sub small"><?= count($entries) ?> entrée<?= count($entries) > 1 ? 's' : '' ?></p>
  <?php if (!$entries): ?><p class="empty">Rien pour l’instant. Les entrées apparaîtront ici dès que Lindsey et Andrea auront ouvert la bustarella.</p><?php endif; ?>
  <div class="list">
  <?php foreach ($entries as $e): ?>
    <article class="entry">
      <?php if ($e['type'] === 'iban'): ?>
        <h2>IBAN pour le virement <span><?= h(when_fr($e['time'])) ?></span></h2>
        <span class="k">Titulaire</span>
        <div><?= h($e['holder']) ?></div>
        <span class="k" style="margin-top:10px">IBAN</span>
        <div class="row"><div class="iban" id="i-<?= h($e['id']) ?>"><?= h(iban_groups($e['iban'])) ?></div>
          <button class="ghost" type="button" data-copy="<?= h($e['iban']) ?>">Copier</button></div>
        <?php if (!empty($e['note'])): ?><p class="note">« <?= h($e['note']) ?> »</p><?php endif; ?>
      <?php else: ?>
        <h2>Réponses au quiz <span><?= h(when_fr($e['time'])) ?></span></h2>
        <ul class="qa">
          <?php foreach (($e['answers'] ?? []) as $a): ?>
            <li><span class="k"><?= h($a['who']) ?> · <?= h($a['q']) ?></span><b><?= h($a['answer']) ?></b></li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
      <form method="post" class="actions">
        <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
        <button class="del" name="delete" value="<?= h($e['id']) ?>" data-confirm>Supprimer</button>
      </form>
    </article>
  <?php endforeach; ?>
  </div>
<?php endif; ?>
</div>
<script>
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
        b.textContent = 'Copié ✓'; setTimeout(function () { b.textContent = 'Copier'; }, 2000);
      }).catch(function () {
        var r = document.createRange(); r.selectNodeContents(b.previousElementSibling);
        var s = getSelection(); s.removeAllRanges(); s.addRange(r);
      });
    });
  });
  document.querySelectorAll('[data-confirm]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      if (b.classList.contains('armed')) return;
      e.preventDefault(); b.classList.add('armed'); b.textContent = 'Sûr ?';
      setTimeout(function () { b.classList.remove('armed'); b.textContent = 'Supprimer'; }, 3000);
    });
  });
</script>
</body>
</html>
