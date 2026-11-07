<?php
/*
 * GET api/drive_img.php?id=<fichier Drive>&s=600|2400|4000
 * Plan B du reportage (photos pas encore importées) : ce serveur va chercher l'image
 * chez Google une seule fois, la garde dans storage/drivecache/, puis la sert lui-même.
 * Seules les photos du dossier du reportage sont acceptées (pas un relais ouvert).
 */
require __DIR__ . '/lib.php';

$id = (string) ($_GET['id'] ?? '');
$size = (int) ($_GET['s'] ?? 0);
if (!preg_match('/^[A-Za-z0-9_-]{10,}$/', $id) || !in_array($size, [600, 2400, 4000], true)) {
    http_response_code(400);
    exit('Bad request');
}
$known = false;
foreach (drive_fallback_items() as $it) {
    if (($it['drive'] ?? '') === $id) {
        $known = true;
        break;
    }
}
if (!$known) {
    http_response_code(404);
    exit('Not found');
}

$dir = storage_dir('drivecache');
$file = $dir . '/' . $id . '_' . $size . '.jpg';
if (!is_file($file)) {
    time_limit(300);
    // 1) l'aperçu fabriqué par Google (rapide) — Google n'en fait pas pour les photos de plus de 50 Mo
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.part';
    [$ok] = http_download('https://drive.google.com/thumbnail?id=' . rawurlencode($id) . '&sz=w' . $size, $tmp, 40 * 1048576);
    $info = $ok ? @getimagesize($tmp) : false;
    if ($info && in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
        @rename($tmp, $file);
    } else {
        @unlink($tmp);
        // 2) sinon : l'original, réduit ici une fois pour toutes (les trois tailles d'un coup)
        $lock = @fopen($dir . '/' . $id . '.lock', 'c');
        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
            header('Retry-After: 4');
            http_response_code(503);             // déjà en préparation par une autre demande
            exit('Retry');
        }
        if (!is_file($file)) {
            $orig = $dir . '/' . $id . '.orig.part';
            [$ok2] = http_download('https://drive.usercontent.google.com/download?id=' . rawurlencode($id) . '&export=download&confirm=t', $orig, (int) config()['max_file_mb'] * 1048576);
            if ($ok2 && @getimagesize($orig)) {
                $big = $dir . '/' . $id . '_4000.jpg';
                $mid = $dir . '/' . $id . '_2400.jpg';
                $small = $dir . '/' . $id . '_600.jpg';
                if (make_thumb($orig, $big, 4000, 86)) {
                    make_thumb($big, $mid, 2400, 85);
                    make_thumb($mid, $small, 600, 80);
                }
            }
            @unlink($orig);
        }
        flock($lock, LOCK_UN);
        fclose($lock);
        @unlink($dir . '/' . $id . '.lock');
        if (!is_file($file)) {
            header('Retry-After: 5');
            http_response_code(503);
            exit('Retry');
        }
    }
}
stream_file($file, (string) (getimagesize($file)['mime'] ?? 'image/jpeg'), basename($file), false, 'public, max-age=2592000');
