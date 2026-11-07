/* ==========================================================================
   Envoi par morceaux — les photos et vidéos partent en petits morceaux pour
   passer les réseaux faibles et les limites de l'hébergeur.
   · reprise : un envoi coupé (réseau, page fermée, blocage) repart du dernier
     morceau reçu par le serveur, même après avoir rechargé la page et
     re-choisi le même fichier
   · un refus du pare-feu de l'hébergeur (HTTP 403 / 406…) n'arrête plus tout :
     on attend un peu, on renvoie le morceau sous une autre forme (corps brut
     au lieu d'un formulaire), et on réessaie plusieurs fois avant d'abandonner
   ========================================================================== */
(function () {
  "use strict";

  var ENDPOINT = "api/upload.php";
  var MIN_CHUNK = 256 * 1024;
  var CHUNK = 1536 * 1024;           // jusqu'à ce que le serveur donne sa limite (tient dans 2 Mo)
  var PARALLEL = 2;
  var RETRIES = 6;                   // erreurs réseau / serveur
  var BLOCK_RETRIES = 9;             // refus du pare-feu : on insiste plus longtemps, plus lentement
  var BLOCK_WAITS = [3, 8, 15, 30, 45, 60, 90, 120, 180];   // secondes

  // Mode d'envoi : "form" (multipart, le plus courant) ou "raw" (octet-stream).
  // Retenu d'une visite à l'autre dès que le pare-feu a refusé le mode formulaire.
  var mode = "form";
  try { if (localStorage.getItem("lou_upload_mode") === "raw") mode = "raw"; } catch (e) { /* */ }
  function setMode(m) {
    mode = m;
    try { localStorage.setItem("lou_upload_mode", m); } catch (e) { /* */ }
  }

  var serverInfo = null;
  function ready() {
    if (!serverInfo) {
      serverInfo = fetch("api/status.php", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (info) {
          if (info && info.chunk > 0) CHUNK = Math.max(MIN_CHUNK, Math.min(4 * 1024 * 1024, info.chunk));
          return info;
        })
        .catch(function () { return null; });
    }
    return serverInfo;
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
    var a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  // Le même fichier re-choisi plus tard garde le même identifiant d'envoi.
  function fileKey(f) { return "lou_up_" + [f.name, f.size, f.lastModified || 0].join("|"); }
  function rememberId(f, id) { try { localStorage.setItem(fileKey(f), id); } catch (e) { /* */ } }
  function rememberedId(f) { try { return localStorage.getItem(fileKey(f)); } catch (e) { return null; } }
  function forget(f) { try { localStorage.removeItem(fileKey(f)); } catch (e) { /* */ } }

  // Demande au serveur ce qu'il a déjà reçu de ce fichier.
  function askResume(item) {
    var f = item.file;
    var q = "api/resume.php?name=" + encodeURIComponent(encodeURIComponent(f.name || "file")) +
      "&size=" + f.size + "&guest=" + encodeURIComponent(encodeURIComponent(item.guest || "")) +
      "&id=" + encodeURIComponent(item.id || rememberedId(f) || "");
    return fetch(q, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function params(item, index, total) {
    var meta = item.meta || {};
    var p = {
      uploadId: item.id, index: String(index), total: String(total),
      name: encodeURIComponent(item.file.name || "file"), size: String(item.file.size),
      type: item.file.type || "", guest: encodeURIComponent(item.guest || "")
    };
    if (item.fields) Object.keys(item.fields).forEach(function (k) { p[k] = String(item.fields[k]); });
    if (meta.w && meta.h) { p.w = String(meta.w); p.h = String(meta.h); }
    if (meta.duration) p.duration = String(meta.duration);
    return p;
  }

  function sendChunk(item, index, total, blob, onProgress) {
    return new Promise(function (resolve, reject) {
      var p = params(item, index, total);
      var xhr = new XMLHttpRequest();
      item.xhr = xhr;
      var body;
      if (mode === "raw") {
        var qs = Object.keys(p).map(function (k) { return k + "=" + encodeURIComponent(p[k]); }).join("&");
        xhr.open("POST", ENDPOINT + "?" + qs, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        body = blob;
      } else {
        body = new FormData();
        Object.keys(p).forEach(function (k) { body.append(k, p[k]); });
        body.append("chunk", blob, "chunk.bin");
        xhr.open("POST", ENDPOINT, true);
      }
      xhr.timeout = 120000;
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(Math.min(blob.size, e.loaded)); };
      xhr.onload = function () {
        var res = null;
        try { res = JSON.parse(xhr.responseText); } catch (e) { /* pas du JSON : page d'erreur de l'hébergeur */ }
        if (xhr.status >= 200 && xhr.status < 300 && res && res.ok) { resolve(res); return; }
        var err = new Error((res && res.error) || ("HTTP " + xhr.status));
        err.status = xhr.status;
        err.code = (res && res.code) || (xhr.status === 413 ? "chunk_too_big" : null);
        // Réponse qui ne vient pas de notre PHP (pas de JSON) avec 403/406/429/5xx :
        // pare-feu ou anti-flood de l'hébergeur → temporaire, on réessaie.
        err.blocked = !res && (xhr.status === 403 || xhr.status === 406 || xhr.status === 429 || xhr.status === 503 || xhr.status === 508 || xhr.status >= 520);
        err.fatal = !err.blocked && (
          (xhr.status >= 400 && xhr.status < 500 && xhr.status !== 408 && xhr.status !== 429 && xhr.status !== 409)
          || (xhr.status >= 500 && !!(res && res.error)));
        reject(err);
      };
      xhr.onerror = function () { var e = new Error("network"); e.status = 0; reject(e); };
      xhr.ontimeout = function () { var e = new Error("timeout"); e.status = 0; reject(e); };
      xhr.onabort = function () { var e = new Error("aborted"); e.aborted = true; reject(e); };
      xhr.send(body);
    });
  }

  function wait(ms, item) {
    return new Promise(function (r) {
      var t = setTimeout(r, ms);
      item.wake = function () { clearTimeout(t); r(); };
    });
  }

  function Uploader(opts) {
    this.opts = opts || {};
    this.items = [];
    this.active = 0;
  }

  Uploader.prototype.add = function (files, guest, meta) {
    var self = this;
    Array.prototype.forEach.call(files, function (file) {
      var item = {
        meta: meta || file._meta || null,
        fields: self.opts.fields || null,
        id: rememberedId(file) || uid(),
        file: file,
        guest: guest,
        sent: 0,
        status: "queued",   // queued | uploading | done | error | cancelled
        note: "",           // ex. « reprise à 18 % », « l'hébergeur freine, nouvel essai dans 30 s »
        error: null,
        xhr: null
      };
      self.items.push(item);
      self.emit("add", item);
    });
    this.pump();
  };

  Uploader.prototype.cancel = function (item) {
    if (item.status === "done") return;
    item.status = "cancelled";
    if (item.xhr) item.xhr.abort();
    if (item.wake) item.wake();
    this.emit("update", item);
    this.pump();
  };

  // Réessayer garde le même identifiant : on repart des morceaux déjà reçus.
  Uploader.prototype.retry = function (item) {
    if (item.status !== "error") return;
    item.status = "queued";
    item.error = null;
    item.note = "";
    this.emit("update", item);
    this.pump();
  };

  Uploader.prototype.pump = function () {
    var self = this;
    while (this.active < PARALLEL) {
      var next = this.items.find(function (i) { return i.status === "queued"; });
      if (!next) break;
      this.active++;
      this.run(next).then(function () {
        self.active--;
        self.pump();
        self.emit("progress");
        if (!self.busy()) self.emit("idle");
      });
    }
    this.emit("progress");
  };

  Uploader.prototype.run = function (item) {
    var self = this;
    item.status = "uploading";
    this.emit("update", item);

    return ready().then(function () { return self.send(item); }).then(function () {
      if (item.status === "cancelled") return;
      item.status = "done";
      item.note = "";
      item.sent = item.file.size;
      forget(item.file);
      self.emit("update", item);
      self.emit("done", item);
    }).catch(function (err) {
      if (item.status === "cancelled") return;
      item.status = "error";
      item.error = err;
      item.note = "";
      self.emit("update", item);
    });
  };

  Uploader.prototype.send = function (item) {
    var self = this;
    var file = item.file;
    var size = CHUNK;
    var total = Math.max(1, Math.ceil(file.size / size));
    var have = {};

    return askResume(item).then(function (r) {
      if (r && r.found && r.total === total && r.received && r.received.length) {
        item.id = r.id;
        r.received.forEach(function (i) { have[i] = true; });
        // tout est déjà là mais l'assemblage n'a pas eu lieu : on renvoie le dernier morceau pour le déclencher
        if (r.received.length >= total) delete have[total - 1];
        var got = Object.keys(have).length;
        item.sent = Math.min(file.size, got * size);
        if (got) item.note = "Reprise à " + Math.round(item.sent / file.size * 100) + " %";
        self.emit("update", item);
        self.emit("progress");
      }
      rememberId(file, item.id);
      return loop(0);
    });

    function doneBytes(index) {
      var n = 0;
      for (var k in have) if (Number(k) !== index) n += Math.min(size, file.size - Number(k) * size);
      return n;
    }

    function loop(index) {
      if (item.status === "cancelled") return Promise.resolve();
      while (index < total && have[index]) index++;
      if (index >= total) return Promise.resolve();
      var start = index * size;
      var blob = file.slice(start, Math.min(file.size, start + size));
      var attempt = 0, blocks = 0;

      function tryOnce() {
        return sendChunk(item, index, total, blob, function (loaded) {
          item.sent = doneBytes(index) + loaded;
          self.emit("update", item);
          self.emit("progress");
        }).then(function (res) {
          if (res && res.item) item.result = res.item;
          have[index] = true;
          item.sent = doneBytes(-1);
          if (item.note && !/^Reprise/.test(item.note)) { item.note = ""; }
          return loop(index + 1);
        }, function (err) {
          if (item.status === "cancelled" || err.aborted) return;
          // morceau trop gros pour le serveur : moitié plus petit, et on recommence ce fichier
          if (err.code === "chunk_too_big" && size > MIN_CHUNK) {
            CHUNK = Math.max(MIN_CHUNK, Math.floor(size / 2));
            item.id = uid();
            item.sent = 0;
            return self.send(item);
          }
          // l'envoi en cours sur le serveur ne correspond plus (taille des morceaux changée) : nouvel envoi
          if (err.status === 409 && err.code === "upload_mismatch") {
            item.id = uid();
            item.sent = 0;
            return self.send(item);
          }
          if (err.blocked) {
            if (blocks >= BLOCK_RETRIES) throw err;
            // 1er refus en mode formulaire : on passe en corps brut, que les pare-feux laissent mieux passer
            if (blocks === 0 && mode === "form") setMode("raw");
            else if (blocks === 3) setMode(mode === "raw" ? "form" : "raw");   // puis on alterne
            var secs = BLOCK_WAITS[Math.min(blocks, BLOCK_WAITS.length - 1)];
            blocks++;
            return countdown(secs).then(tryOnce);
          }
          if (err.fatal || attempt >= RETRIES) throw err;
          attempt++;
          // réseau coupé : 1 s 2 s 4 s 8 s 16 s 30 s
          return wait(Math.min(30000, 1000 * Math.pow(2, attempt - 1)), item).then(tryOnce);
        });
      }

      function countdown(secs) {
        var left = secs;
        function tick() {
          item.note = "L'hébergeur freine l'envoi · nouvel essai dans " + left + " s";
          self.emit("update", item);
        }
        tick();
        return new Promise(function (resolve) {
          var iv = setInterval(function () {
            left--;
            if (left <= 0 || item.status === "cancelled") { clearInterval(iv); item.note = "Nouvel essai…"; self.emit("update", item); resolve(); return; }
            tick();
          }, 1000);
          item.wake = function () { clearInterval(iv); resolve(); };
        });
      }

      return tryOnce();
    }
  };

  Uploader.prototype.busy = function () {
    return this.items.some(function (i) { return i.status === "queued" || i.status === "uploading"; });
  };

  Uploader.prototype.stats = function () {
    var live = this.items.filter(function (i) { return i.status !== "cancelled"; });
    var total = 0, sent = 0, done = 0;
    live.forEach(function (i) {
      total += i.file.size;
      sent += Math.min(i.sent, i.file.size);
      if (i.status === "done") done++;
    });
    return { count: live.length, done: done, total: total, sent: sent, pct: total ? sent / total : 0 };
  };

  Uploader.prototype.emit = function (name, item) {
    var fn = this.opts["on" + name.charAt(0).toUpperCase() + name.slice(1)];
    if (fn) fn(item);
  };

  Uploader.chunkSize = function () { return CHUNK; };
  Uploader.describe = function (err) {
    if (!err) return "";
    if (err.status === 0) return err.message === "timeout" ? "délai dépassé" : "pas de connexion";
    if (err.blocked) return "bloqué par l'hébergeur (HTTP " + err.status + ")";
    var s = err.status ? "HTTP " + err.status : "";
    var m = err.message && !/^HTTP \d+$/.test(err.message) ? err.message : "";
    return [s, m].filter(Boolean).join(" · ");
  };

  window.LouUploader = Uploader;
})();
