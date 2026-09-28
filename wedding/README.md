# Lindsey & Andrea — 03.10.2026

Mobile-first wedding page: WebGL silk & rose-petal scene, monogram preloader,
guestbook, voice messages recorded in the page, photo/video upload straight to
your own server, a live masonry gallery of everything guests share, and a
floating share button. EN / IT / FR.

No build step, no external services — plain HTML/CSS/JS + PHP 8.
Motion uses GSAP 3.13 + ScrollTrigger, stored in `assets/vendor/` (served from your server).

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

## Gallery & moderation

Everything guests share (photos, videos, voice notes) appears in the "Through your
eyes" gallery on the page, newest first, and refreshes by itself every 45 s while
it is on screen, which is handy on a screen at the reception.

- In `admin.php` → *Photos, videos & voice*, each tile has **Hide** (removes it from
  the public gallery, keeps the file) and **Delete** (removes it for good).
- To keep all uploads private, set `'public_gallery' => false` in `api/config.php`.

Photo thumbnails are made with PHP's GD extension (standard on most hosts). HEIC
photos from iPhones are stored in original quality. Safari shows them in the
gallery; other browsers show a placeholder tile instead.

## Voice messages

Recorded with the browser's MediaRecorder (up to 3 minutes; `MAX_SECONDS` in
`assets/js/recorder.js`). The microphone only works over **HTTPS**. Recordings
are stored as `.webm` (Android/desktop) or `.m4a` (iPhone).

## Where things are stored

```
storage/
  messages.jsonl        one guestbook note per line
  media.jsonl           one uploaded file per line (guest name, original name, size…)
  hidden.json           ids hidden from the public gallery
  uploads/YYYY-MM-DD/   the photos, videos & voice notes, original quality
  thumbs/               small previews for the gallery
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
| `assets/js/scene.js` | WebGL scene (low-res silk pass + GPU petals, adaptive resolution) |
| `assets/js/motion.js` | intro (names written in ink) and scroll-scrubbed animations (GSAP) |
| `assets/vendor/` | GSAP + ScrollTrigger |
| `assets/js/app.js` | loading, translations, countdown, forms, upload UI |
| `assets/js/uploader.js` | chunked upload engine |
| `assets/js/recorder.js` | voice message recorder with live waveform |
| `assets/js/gallery.js` | masonry gallery, live refresh, full-screen viewer |
| `assets/css/style.css` | styles |
| `api/message.php` | guestbook endpoint |
| `api/upload.php` | upload endpoint |
| `api/gallery.php` | list of shared items for the gallery |
| `api/media.php` | serves one shared item (Range-enabled for video/audio) |
| `admin.php` | private gallery for the couple |
