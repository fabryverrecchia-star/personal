<?php
/*
 * Install check — open https://your-site/…/check.php once after uploading.
 * Tells you in plain words what works and what to fix. Delete it afterwards if you like.
 */
declare(strict_types=1);
require __DIR__ . '/api/lib.php';

header('X-Robots-Tag: noindex, nofollow');

// remove the file created by the live test below (only files uploaded as "test-installation.png")
if (isset($_GET['cleanup'])) {
    $m = preg_match('/^[a-f0-9]{16}$/', (string) $_GET['cleanup']) ? media_find((string) $_GET['cleanup']) : null;
    if ($m && ($m['original'] ?? '') === 'test-installation.png') {
        media_delete($m['id']);
    }
    json_out(['ok' => true]);
}

$rows = [];
function row(array &$rows, bool $ok, string $label, string $detail, string $fix = ''): void
{
    $rows[] = [$ok, $label, $detail, $fix];
}

row($rows, PHP_VERSION_ID >= 70200, 'Version de PHP', PHP_VERSION,
    'Il faut PHP 7.2 ou plus : choisissez une version récente dans le panneau de votre hébergeur.');

$dir = storage_dir();
$probe = $dir . '/.write-test';
$canWrite = @file_put_contents($probe, 'ok') !== false;
@unlink($probe);
$canMkdir = $canWrite && is_dir(storage_dir('uploads'));
row($rows, $canWrite && $canMkdir, 'Dossier storage/ inscriptible', $dir,
    'Donnez les droits d’écriture au dossier « storage » (FTP → clic droit → Droits d’accès → 755, ou 775 si 755 ne suffit pas).');

$tmp = ini_get('upload_tmp_dir') ?: sys_get_temp_dir();
row($rows, is_writable($tmp), 'Dossier temporaire de PHP', $tmp, 'Contactez l’hébergeur : PHP ne peut pas écrire les fichiers reçus.');

$up = (string) ini_get('upload_max_filesize');
$post = (string) ini_get('post_max_size');
row($rows, (bool) ini_get('file_uploads'), 'Envoi de fichiers autorisé', 'file_uploads = ' . (ini_get('file_uploads') ? 'On' : 'Off'),
    'Activez « file_uploads » dans les réglages PHP de l’hébergeur.');
row($rows, max_chunk_bytes() >= 256 * 1024, 'Taille des morceaux envoyés',
    round(max_chunk_bytes() / 1048576, 2) . ' Mo par morceau (upload_max_filesize = ' . $up . ', post_max_size = ' . $post . ')',
    'Les limites PHP sont trop basses : augmentez upload_max_filesize et post_max_size (8M ou plus).');

row($rows, extension_loaded('mbstring'), 'Extension mbstring', extension_loaded('mbstring') ? 'disponible' : 'absente (remplacée automatiquement)',
    'Optionnel : activez « mbstring » dans les réglages PHP de l’hébergeur.');
row($rows, function_exists('finfo_open'), 'Vérification du type de fichier (fileinfo)', function_exists('finfo_open') ? 'disponible' : 'absente',
    'Activez l’extension PHP « fileinfo » (sinon certains fichiers peuvent être refusés).');
row($rows, function_exists('imagecreatetruecolor'), 'Miniatures des photos (GD)', function_exists('imagecreatetruecolor') ? 'disponible' : 'absente',
    'Optionnel : activez l’extension « gd » pour des miniatures légères dans la galerie.');
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
row($rows, $https, 'HTTPS', $https ? 'oui' : 'non',
    'Ouvrez le site en https:// — sans cela, le micro (messages vocaux) est bloqué par les téléphones.');
$cfg = config();
$hasPwd = trim((string) ($cfg['admin_password'] ?? '')) !== '' || trim((string) ($cfg['admin_password_hash'] ?? '')) !== '';
row($rows, $hasPwd, 'Mot de passe de l’espace privé (admin.php)', $hasPwd ? 'défini' : 'pas encore défini',
    'Ouvrez api/config.php et écrivez votre mot de passe entre les guillemets de « admin_password ».');
row($rows, true, 'Galerie publique', !empty($cfg['public_gallery']) ? 'activée : les invités voient les photos partagées' : 'désactivée : visible seulement dans admin.php');

$allOk = true;
foreach ($rows as $r) {
    $allOk = $allOk && $r[0];
}
$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/') . '/';
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Vérification · L &amp; A</title>
<style>
  body { margin: 0; background: #f7f3ec; color: #14295a; font: 17px/1.5 Georgia, "Times New Roman", serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 60px; }
  h1 { font-weight: 400; font-size: 30px; margin: 0 0 6px; }
  .sum { margin: 0 0 24px; font-style: italic; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  li { background: #fbf8f3; border: 1px solid rgba(20, 41, 90, .15); border-radius: 10px; padding: 14px 16px; display: grid; grid-template-columns: 28px 1fr; gap: 4px 10px; }
  .i { grid-row: span 3; font-size: 20px; line-height: 1.2; }
  .ok .i { color: #3f6b4f; } .ko .i { color: #9a3b3b; }
  b { font-weight: 600; } small { color: rgba(20, 41, 90, .65); word-break: break-all; }
  .fix { color: #9a3b3b; }
  code { font-size: 14px; background: rgba(20, 41, 90, .06); padding: 1px 5px; border-radius: 4px; }
  #live { margin-top: 26px; }
  button { font: inherit; font-size: 15px; padding: 12px 20px; border-radius: 99px; border: 0; background: #14295a; color: #f7f3ec; cursor: pointer; }
  pre { white-space: pre-wrap; font-size: 14px; background: #fbf8f3; border: 1px solid rgba(20, 41, 90, .15); border-radius: 10px; padding: 12px; }
</style>
</head>
<body>
<main>
  <h1>Vérification de l’installation</h1>
  <p class="sum"><?= $allOk ? 'Tout est prêt. Les invités peuvent envoyer messages, photos, vidéos et vocaux.' : 'Quelques points sont à corriger (en rouge) :' ?></p>
  <ul>
    <?php foreach ($rows as [$ok, $label, $detail, $fix]): ?>
      <li class="<?= $ok ? 'ok' : 'ko' ?>">
        <span class="i"><?= $ok ? '✓' : '✗' ?></span>
        <b><?= h($label) ?></b>
        <small><?= h($detail) ?></small>
        <?php if (!$ok && $fix): ?><span class="fix"><?= h($fix) ?></span><?php endif; ?>
      </li>
    <?php endforeach; ?>
  </ul>

  <div id="live">
    <p>Test réel depuis ce navigateur (envoie une petite image de test, puis la supprime) :</p>
    <button type="button" id="run">Lancer le test</button>
    <pre id="out" hidden></pre>
  </div>
  <p><small>Page d’accueil : <code><?= h($base) ?></code> · Espace privé : <code><?= h($base) ?>admin.php</code></small></p>
</main>
<script>
document.getElementById('run').onclick = async function () {
  var out = document.getElementById('out'); out.hidden = false; out.textContent = '';
  function log(s) { out.textContent += s + '\n'; }
  try {
    var st = await fetch('api/status.php', { cache: 'no-store' });
    var sj = await st.json().catch(function () { return null; });
    log('api/status.php → HTTP ' + st.status + (sj ? ' · morceaux de ' + Math.round(sj.chunk / 1024) + ' Ko · storage ' + (sj.writable ? 'OK' : 'NON inscriptible') : ' · réponse illisible (PHP ne s’exécute pas ?)'));
    var c = document.createElement('canvas'); c.width = c.height = 8;
    var blob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
    var fd = new FormData();
    var id = Array.from(crypto.getRandomValues(new Uint8Array(16)), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    fd.append('uploadId', id); fd.append('index', '0'); fd.append('total', '1');
    fd.append('name', 'test-installation.png'); fd.append('size', String(blob.size)); fd.append('type', 'image/png');
    fd.append('guest', 'Test'); fd.append('chunk', blob, 'chunk.bin');
    var up = await fetch('api/upload.php', { method: 'POST', body: fd });
    var uj = await up.json().catch(function () { return null; });
    log('api/upload.php → HTTP ' + up.status + ' · ' + (uj ? JSON.stringify(uj).slice(0, 160) : 'réponse illisible'));
    var ok = uj && uj.ok && uj.done;
    if (ok) {
      var cl = await fetch('check.php?cleanup=' + encodeURIComponent(uj.item ? uj.item.id : ''), { cache: 'no-store' });
      log('nettoyage du fichier de test → HTTP ' + cl.status);
    }
    log(ok ? '\n✓ Les envois fonctionnent.' : '\n✗ L’envoi a échoué : copiez ces lignes et envoyez-les.');
  } catch (e) { log('Erreur réseau : ' + e.message); }
};
</script>
</body>
</html>
