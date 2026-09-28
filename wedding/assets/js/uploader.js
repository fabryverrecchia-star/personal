/* ==========================================================================
   Chunked uploader — sends photos & videos in small pieces so that big
   phone videos survive weak venue Wi-Fi / 4G and PHP size limits.
   Each chunk is retried with back-off; two files upload in parallel.
   ========================================================================== */
(function () {
  "use strict";

  var ENDPOINT = "api/upload.php";
  var CHUNK = 4 * 1024 * 1024;       // 4 MB — below PHP's default 8 MB post_max_size
  var PARALLEL = 2;
  var RETRIES = 5;

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
    var a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  function sendChunk(item, index, total, blob, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      item.xhr = xhr;
      xhr.open("POST", ENDPOINT, true);
      xhr.timeout = 120000;
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("X-Upload-Id", item.id);
      xhr.setRequestHeader("X-Chunk-Index", String(index));
      xhr.setRequestHeader("X-Chunk-Total", String(total));
      xhr.setRequestHeader("X-File-Name", encodeURIComponent(item.file.name || "file"));
      xhr.setRequestHeader("X-File-Size", String(item.file.size));
      xhr.setRequestHeader("X-File-Type", item.file.type || "");
      xhr.setRequestHeader("X-Guest-Name", encodeURIComponent(item.guest || ""));
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded); };
      xhr.onload = function () {
        var res = null;
        try { res = JSON.parse(xhr.responseText); } catch (e) { /* ignore */ }
        if (xhr.status >= 200 && xhr.status < 300 && res && res.ok) resolve(res);
        else {
          var err = new Error((res && res.error) || ("HTTP " + xhr.status));
          // 4xx (except timeout/rate-limit) are final: do not retry
          err.fatal = xhr.status >= 400 && xhr.status < 500 && xhr.status !== 408 && xhr.status !== 429;
          err.code = res && res.code;
          reject(err);
        }
      };
      xhr.onerror = function () { reject(new Error("network")); };
      xhr.ontimeout = function () { reject(new Error("timeout")); };
      xhr.onabort = function () { var e = new Error("aborted"); e.aborted = true; reject(e); };
      xhr.send(blob);
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function Uploader(opts) {
    this.opts = opts || {};
    this.items = [];
    this.active = 0;
  }

  Uploader.prototype.add = function (files, guest) {
    var self = this;
    Array.prototype.forEach.call(files, function (file) {
      var item = {
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
    var total = Math.max(1, Math.ceil(file.size / CHUNK));
    item.status = "uploading";
    this.emit("update", item);

    var index = 0;
    function nextChunk() {
      if (item.status === "cancelled") return Promise.resolve();
      if (index >= total) return Promise.resolve();
      var start = index * CHUNK;
      var blob = file.slice(start, Math.min(file.size, start + CHUNK));
      var attempt = 0;

      function tryOnce() {
        return sendChunk(item, index, total, blob, function (loaded) {
          item.sent = start + loaded;
          self.emit("update", item);
          self.emit("progress");
        }).then(function () {
          item.sent = start + blob.size;
          index++;
          return nextChunk();
        }, function (err) {
          if (item.status === "cancelled" || err.aborted) return;
          if (err.fatal || attempt >= RETRIES) throw err;
          attempt++;
          // exponential back-off: 1s 2s 4s 8s 16s — survives a dead zone in the venue
          return wait(1000 * Math.pow(2, attempt - 1)).then(tryOnce);
        });
      }
      return tryOnce();
    }

    return nextChunk().then(function () {
      if (item.status === "cancelled") return;
      item.status = "done";
      item.sent = file.size;
      self.emit("update", item);
    }).catch(function (err) {
      item.status = "error";
      item.error = err;
      self.emit("update", item);
    });
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

  window.WeddingUploader = Uploader;
})();
