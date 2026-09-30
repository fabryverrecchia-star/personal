<?php
/* Formulaire de contact : reçoit le POST de la page et envoie un e-mail. */

// Adresse qui reçoit les messages
const CONTACT_TO = 'contact@18h22.com';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false]);
  exit;
}

// Champ piège : rempli uniquement par les robots
if (!empty($_POST['website'])) {
  echo json_encode(['ok' => true]);
  exit;
}

$clean = function ($key, $max) {
  $v = trim((string)($_POST[$key] ?? ''));
  return mb_substr($v, 0, $max);
};
$name = str_replace(["\r", "\n"], ' ', $clean('name', 120));
$email = $clean('email', 160);
$phone = str_replace(["\r", "\n"], ' ', $clean('phone', 40));
$message = $clean('message', 5000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false]);
  exit;
}

$host = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['HTTP_HOST'] ?? '18h22.com');
$subject = '=?UTF-8?B?' . base64_encode('18H22 · Nouveau message de ' . $name) . '?=';
$body = "Nom : $name\nE-mail : $email\nTéléphone : " . ($phone ?: '—') . "\n\n$message\n";
$headers = "From: 18H22 <no-reply@$host>\r\n"
  . "Reply-To: $email\r\n"
  . "MIME-Version: 1.0\r\n"
  . "Content-Type: text/plain; charset=UTF-8\r\n";

$ok = @mail(CONTACT_TO, $subject, $body, $headers);
echo json_encode(['ok' => (bool)$ok]);
