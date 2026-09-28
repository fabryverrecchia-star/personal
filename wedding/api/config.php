<?php
/*
 * Lindsey & Andrea — server settings.
 * Edit this file after uploading the site to your server.
 */
return [
    // Where messages, photos and videos are stored. Ideally a folder OUTSIDE
    // the public web root, e.g. '/home/you/wedding-storage'. The default
    // "storage" folder next to the site is protected by .htaccess (Apache).
    'storage_dir' => dirname(__DIR__) . '/storage',

    // Largest single file a guest may upload (MB). Keep in sync with MAX_BYTES in assets/js/app.js.
    'max_file_mb' => 2048,

    // Password for admin.php (the couple's private gallery). Put a HASH here, never the plain password.
    // Generate one on any machine with PHP:
    //   php -r 'echo password_hash("your-password", PASSWORD_DEFAULT), "\n";'
    // While empty, admin.php stays locked.
    'admin_password_hash' => '',

    // Optional: receive an e-mail for every guestbook message (uses PHP mail()). Leave '' to disable.
    'notify_email' => '',

    // Anti-spam limits per visitor (per hour).
    'max_messages_per_hour' => 12,
    'max_chunks_per_hour'   => 6000,   // 6000 × 4 MB ≈ 24 GB — generous for a phone full of videos
];
