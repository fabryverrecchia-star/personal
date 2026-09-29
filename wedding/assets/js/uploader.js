/* ==========================================================================
   Chunked uploader — sends photos & videos in small pieces so that big
   phone videos survive weak venue Wi-Fi / 4G and PHP size limits.
   Each chunk is retried with back-off; two files upload in parallel.
   ========================================================================== */
(function () {
  "use strict";

  var ENDPOINT = "api/upload.php";
  var MIN_CHUNK = 256 * 1024;
  var CHUNK = 1536 * 1024;           // until the server tells us its limit (fits a 2 MB upload_max_filesize)
  var PARALLEL = 2;
  var RETRIES = 5;

  // Ask the server once how big a chunk it accepts (shared hosts often allow only 2 MB).
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

  // One chunk, sent as a normal form upload: the most compatible format with
  // shared-hosting firewalls (no custom headers, no raw binary body).
  function sendChunk(item, index, total, blob, onProgress) {
    return new Promise(function (resolve, reject) {
      var fd = new FormData();
      var meta = item.meta || {};
      fd.append("uploadId", item.id);
      fd.append("index", String(index));
      fd.append("total", String(total));
      fd.append("name", encodeURIComponent(item.file.name || "file"));
      fd.append("size", String(item.file.size));
      fd.append("type", item.file.type || "");
      fd.append("guest", encodeURIComponent(item.guest || ""));
      if (meta.w && meta.h) { fd.append("w", String(meta.w)); fd.append("h", String(meta.h)); }
      if (meta.duration) fd.append("duration", String(meta.duration));
      fd.append("chunk", blob, "chunk.bin");

      var xhr = new XMLHttpRequest();
      item.xhr = xhr;
      xhr.open("POST", ENDPOINT, true);
      xhr.timeout = 90000;
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(Math.min(blob.size, e.loaded)); };
      xhr.onload = function () {
        var res = null;
        try { res = JSON.parse(xhr.responseText); } catch (e) { /* not JSON: PHP error page, 404… */ }
        if (xhr.status >= 200 && xhr.status < 300 && res && res.ok) resolve(res);
        else {
          var err = new Error((res && res.error) || ("HTTP " + xhr.status));
          err.status = xhr.status;
          err.code = (res && res.code) || (xhr.status === 413 ? "chunk_too_big" : null);
          // final (no retry): 4xx except timeout/rate-limit, and any error the server explained
          // itself (e.g. a PHP problem) — retrying would only hide the reason for minutes
          err.fatal = (xhr.status >= 400 && xhr.status < 500 && xhr.status !== 408 && xhr.status !== 429)
            || (xhr.status >= 500 && !!(res && res.error));
          reject(err);
        }
      };
      xhr.onerror = function () { var e = new Error("network"); e.status = 0; reject(e); };
      xhr.ontimeout = function () { var e = new Error("timeout"); e.status = 0; reject(e); };
      xhr.onabort = function () { var e = new Error("aborted"); e.aborted = true; reject(e); };
      xhr.send(fd);
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function Uploader(opts) {
    this.opts = opts || {};
    this.items = [];
    this.active = 0;
  }

  // files: File[]; guest: name; meta (optional): {w, h, duration} for a single file
  Uploader.prototype.add = function (files, guest, meta) {
    var self = this;
    Array.prototype.forEach.call(files, function (file) {
      var item = {
        meta: meta || file._meta || null,
        id: uid(),
        file: file,
        guest: guest,
        sent: 0,
        status: "queued",   // queued | uploading | done | error | cancelled
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
    this.emit("update", item);
    this.pump();
  };

  Uploader.prototype.retry = function (item) {
    if (item.status !== "error") return;
    item.status = "queued";
    item.error = null;
    item.sent = 0;
    item.id = uid();
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
    var file = item.file;
    item.status = "uploading";
    this.emit("update", item);

    return ready().then(function () { return self.send(item); }).then(function () {
      if (item.status === "cancelled") return;
      item.status = "done";
      item.sent = file.size;
      self.emit("update", item);
      self.emit("done", item);
    }).catch(function (err) {
      item.status = "error";
      item.error = err;
      self.emit("update", item);
    });
  };

  Uploader.prototype.send = function (item) {
    var self = this;
    var file = item.file;
    var size = CHUNK;
    var total = Math.max(1, Math.ceil(file.size / size));
    var index = 0;

    function nextChunk() {
      if (item.status === "cancelled") return Promise.resolve();
      if (index >= total) return Promise.resolve();
      var start = index * size;
      var blob = file.slice(start, Math.min(file.size, start + size));
      var attempt = 0;

      function tryOnce() {
        return sendChunk(item, index, total, blob, function (loaded) {
          item.sent = start + loaded;
          self.emit("update", item);
          self.emit("progress");
        }).then(function (res) {
          if (res && res.item) item.result = res.item;
          item.sent = start + blob.size;
          index++;
          return nextChunk();
        }, function (err) {
          if (item.status === "cancelled" || err.aborted) return;
          // the server refused the chunk as too large: halve the size and start this file again
          if (err.code === "chunk_too_big" && size > MIN_CHUNK) {
            CHUNK = Math.max(MIN_CHUNK, Math.floor(size / 2));
            item.id = uid();
            item.sent = 0;
            return self.send(item);
          }
          if (err.fatal || attempt >= RETRIES) throw err;
          attempt++;
          // exponential back-off: 1s 2s 4s 8s 16s — survives a dead zone in the venue
          return wait(1000 * Math.pow(2, attempt - 1)).then(tryOnce);
        });
      }
      return tryOnce();
    }
    return nextChunk();
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

  // current chunk size (after the server told us its limits)
  Uploader.chunkSize = function () { return CHUNK; };
  // short technical reason, shown next to the friendly error message
  Uploader.describe = function (err) {
    if (!err) return "";
    if (err.status === 0) return err.message === "timeout" ? "timeout" : "no connection";
    var s = err.status ? "HTTP " + err.status : "";
    var m = err.message && !/^HTTP \d+$/.test(err.message) ? err.message : "";
    return [s, m].filter(Boolean).join(" · ");
  };

  window.WeddingUploader = Uploader;
})();
