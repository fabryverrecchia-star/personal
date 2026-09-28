# Lindsey & Andrea — 03.10.2026

Mobile-first wedding page: WebGL silk & rose-petal scene, monogram preloader,
guestbook, and photo/video upload straight to your own server. EN / IT / FR.

No build step, no external services — plain HTML/CSS/JS + PHP 8.

## Deploy

1. Upload the whole `wedding/` folder to your server (any PHP ≥ 8.0 host, Apache or Nginx).
2. Make `storage/` writable by PHP (`chmod 775 storage`).
3. Edit `api/config.php`:
   - `admin_password_hash` — create one with
     `php -r 'echo password_hash("your-password", PASSWORD_DEFAULT), "\n";'`
   - optional `notify_email` to get each guestbook note by e-mail
   - optional `storage_dir` to keep uploads **outside** the web root (recommended)
4. Use HTTPS (needed for the screen wake-lock during uploads and for secure cookies).

Guests open `https://your-domain/…/`.
You open `https://your-domain/…/admin.php` to read notes and download photos & videos.

### Nginx

`.htaccess` files are Apache-only. On Nginx add:

```nginx
client_max_body_size 16m;
location ~ /(storage|api/(config|lib)\.php) { deny all; return 404; }
```

## Where things are stored

```
storage/
  messages.jsonl        one guestbook note per line
  media.jsonl           one uploaded file per line (guest name, original name, size…)
  uploads/YYYY-MM-DD/   the photos & videos, original quality
```

To grab everything at once, download the `storage/uploads` folder via FTP/SFTP.

## How uploads work

Files are sent in 4 MB chunks (`assets/js/uploader.js`) with automatic retries and
exponential back-off, two files in parallel — so large phone videos survive weak
venue Wi-Fi and default PHP limits (`post_max_size = 8M` is enough).
The server re-assembles them, checks the real file type (only images & videos are
kept) and records them. Max file size: 2 GB (`max_file_mb` in `api/config.php`
and `MAX_BYTES` in `assets/js/app.js`).

## Files

| Path | What |
|---|---|
| `index.html` | the page |
| `assets/js/scene.js` | WebGL scene (silk shader + GPU petals, adaptive resolution) |
| `assets/js/app.js` | preloader, translations, countdown, forms, upload UI |
| `assets/js/uploader.js` | chunked upload engine |
| `assets/css/style.css` | styles |
| `api/message.php` | guestbook endpoint |
| `api/upload.php` | upload endpoint |
| `admin.php` | private gallery for the couple |
