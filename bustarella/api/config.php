<?php
/*
 * La bustarella digitale — réglages du serveur.
 */
return [
    // Dossier où sont enregistrés l'IBAN et les réponses du quiz (protégé par .htaccess).
    'storage_dir' => dirname(__DIR__) . '/storage',

    // Mot de passe de l'espace privé admin.php — écrivez-le entre les guillemets.
    'admin_password' => '',

    // (Avancé, optionnel) un hash à la place du mot de passe ci-dessus.
    'admin_password_hash' => '',
];
