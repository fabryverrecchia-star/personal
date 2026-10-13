<?php
// Formulaire de devis : envoie la demande par e-mail à Benjamin Landry.
// Aucune donnée n'est enregistrée sur le serveur (seul l'e-mail est envoyé).
declare(strict_types=1);

const DESTINATAIRE = 'benjaminlandry10@gmail.com';
const EXPEDITEUR = 'noreply@benjaminlandry.fr';

$json = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
function fin(bool $ok, string $msg, bool $json): never {
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? '/merci/' : '/?envoi=erreur#contact'), true, 303);
    }
    exit;
}
// Nettoyage : une ligne, sans caractères de contrôle (évite l'injection d'en-têtes)
function ligne(string $v, int $max): string {
    return mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v)), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fin(false, 'Méthode non autorisée.', $json);

// Anti-spam : champ piège invisible et délai minimal de saisie
if (!empty($_POST['site_web'])) fin(true, 'Merci, votre demande a bien été envoyée.', $json);
$t = (int)($_POST['t'] ?? 0);
if ($t > 0 && (time() * 1000 - $t) < 3000) fin(false, 'Envoi trop rapide, merci de réessayer.', $json);

// Anti-abus : une demande toutes les 30 secondes par visiteur
session_start();
if (isset($_SESSION['dernier_envoi']) && time() - $_SESSION['dernier_envoi'] < 30) fin(false, 'Merci de patienter quelques secondes avant un nouvel envoi.', $json);

$nom = ligne($_POST['nom'] ?? '', 100);
$tel = ligne($_POST['tel'] ?? '', 30);
$email = ligne($_POST['email'] ?? '', 150);
$commune = ligne($_POST['commune'] ?? '', 100);
$travaux = array_map(fn($x) => ligne((string)$x, 80), (array)($_POST['travaux'] ?? []));
$message = mb_substr(trim(str_replace("\r", '', (string)($_POST['message'] ?? ''))), 0, 3000);
$consent = !empty($_POST['consentement']);

if ($nom === '' || !preg_match('/^[0-9 +().-]{10,20}$/', $tel)) fin(false, 'Merci d’indiquer votre nom et un numéro de téléphone valide.', $json);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fin(false, 'L’adresse e-mail n’est pas valide.', $json);
if (!$consent) fin(false, 'Merci d’accepter l’utilisation de vos données pour traiter votre demande.', $json);

$corps = "Nouvelle demande de devis depuis benjaminlandry.fr\n\n"
    . "Nom : $nom\nTéléphone : $tel\n"
    . 'E-mail : ' . ($email ?: 'non indiqué') . "\n"
    . 'Commune du chantier : ' . ($commune ?: 'non précisée') . "\n"
    . 'Travaux : ' . ($travaux ? implode(', ', $travaux) : 'non précisés') . "\n\n"
    . "Projet :\n" . ($message ?: '(aucun message)') . "\n\n"
    . '— Envoyé le ' . date('d/m/Y à H:i') . ". Le visiteur a accepté que ses données servent à traiter sa demande.\n";

$entetes = [
    'From: Site benjaminlandry.fr <' . EXPEDITEUR . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
];
if ($email !== '') $entetes[] = 'Reply-To: ' . $email;
$sujet = '=?UTF-8?B?' . base64_encode('Demande de devis — ' . ($commune ?: $nom)) . '?=';

if (!mail(DESTINATAIRE, $sujet, $corps, implode("\r\n", $entetes), '-f' . EXPEDITEUR)) {
    fin(false, 'L’envoi a échoué. Appelez le 06 58 38 78 37 ou écrivez à ' . DESTINATAIRE . '.', $json);
}
$_SESSION['dernier_envoi'] = time();
fin(true, 'Merci, votre demande a bien été envoyée. Benjamin vous rappelle sous 48 heures.', $json);
