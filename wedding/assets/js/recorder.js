/* ==========================================================================
   Voice message recorder — MediaRecorder + a live waveform on canvas.
   idle → recording → review (play · redo · send) → sending → sent
   Records webm/opus on Android & desktop, mp4/aac on iPhone.
   ========================================================================== */
(function () {
  "use strict";

  var MAX_SECONDS = 180;
  var PEAK_EVERY = 0.06;        // one waveform bar every 60 ms

  function pickMime() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
    var list = ["audio/webm;codecs=opus", "audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/ogg;codecs=opus", "audio/webm"];
    for (var i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported(list[i])) return list[i];
    return "";
  }
  function extFor(mime) {
    if (/mp4|aac|m4a/.test(mime)) return "m4a";
    if (/ogg/.test(mime)) return "ogg";
    return "webm";
  }
  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }

  /**
   * opts: root (element), t (translate fn), guest (fn → name), uploader (WeddingUploader
   * instance for voice notes), onSent (fn(result))
   */
  function Recorder(opts) {
    this.o = opts;
    var r = opts.root;
    this.el = {
      canvas: r.querySelector(".voice__wave"),
      time: r.querySelector(".voice__time"),
      rec: r.querySelector(".voice__rec"),
      recLabel: r.querySelector(".voice__rec-label"),
      review: r.querySelector(".voice__review"),
      play: r.querySelector("[data-voice=play]"),
      redo: r.querySelector("[data-voice=redo]"),
      send: r.querySelector("[data-voice=send]"),
      status: r.querySelector(".voice__status")
    };
    this.state = "idle";
    this.peaks = [];
    this.duration = 0;
    this.progress = 0;       // playback or upload progress, 0..1
    this.bind();
    this.resize();
    this.draw();
    var self = this;
    window.addEventListener("resize", function () { self.resize(); self.draw(); }, { passive: true });
  }

  Recorder.prototype.bind = function () {
    var self = this, e = this.el;
    e.rec.addEventListener("click", function () {
      if (self.state === "recording") self.stop();
      else if (self.state === "idle" || self.state === "sent") self.start();
    });
    e.play.addEventListener("click", function () { self.togglePlay(); });
    e.redo.addEventListener("click", function () { self.reset(); self.start(); });
    e.send.addEventListener("click", function () { self.send(); });
  };

  Recorder.prototype.setState = function (s) {
    this.state = s;
    this.o.root.setAttribute("data-state", s);
    var t = this.o.t, e = this.el;
    e.review.hidden = !(s === "review" || s === "sending" || s === "error");
    e.rec.hidden = s === "review" || s === "sending" || s === "error";
    e.rec.setAttribute("aria-label", s === "recording" ? t("voice.stop") : t("voice.record"));
    e.recLabel.textContent = s === "recording" ? t("voice.stop") : s === "sent" ? t("voice.again") : t("voice.record");
    e.send.disabled = e.redo.disabled = s === "sending";
    e.send.classList.toggle("is-busy", s === "sending");
    this.updateTime();
  };

  Recorder.prototype.status = function (msg, kind) {
    this.el.status.textContent = msg || "";
    this.el.status.className = "voice__status" + (kind ? " is-" + kind : "");
  };

  Recorder.prototype.updateTime = function () {
    var s = this.state;
    if (s === "recording") this.el.time.textContent = fmt(this.elapsed()) + " / " + fmt(MAX_SECONDS);
    else if (s === "review" || s === "sending" || s === "error") {
      this.el.time.textContent = this.audio && !this.audio.paused
        ? fmt(this.audio.currentTime) + " / " + fmt(this.duration)
        : fmt(this.duration);
    } else this.el.time.textContent = fmt(0) + " / " + fmt(MAX_SECONDS);
  };

  Recorder.prototype.elapsed = function () {
    return this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0;
  };

  /* ───────── recording ───────── */

  Recorder.prototype.start = function () {
    var self = this, t = this.o.t;
    this.reset();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      this.status(t("voice.unsupported"), "err");
      return;
    }
    this.status(t("voice.allow"));
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(function (stream) { self.begin(stream); })
      .catch(function (err) {
        var name = err && err.name;
        self.status(t(name === "NotFoundError" ? "voice.noMic" : name === "NotAllowedError" || name === "SecurityError" ? "voice.denied" : "voice.unsupported"), "err");
        self.setState("idle");
      });
  };

  Recorder.prototype.begin = function (stream) {
    var self = this;
    this.stream = stream;
    this.mime = pickMime();
    try {
      this.mr = this.mime ? new MediaRecorder(stream, { mimeType: this.mime, audioBitsPerSecond: 96000 }) : new MediaRecorder(stream);
    } catch (e) {
      this.mr = new MediaRecorder(stream);
    }
    this.mime = (this.mr.mimeType || this.mime || "audio/webm").split(";")[0];
    this.chunks = [];
    this.mr.ondataavailable = function (e) { if (e.data && e.data.size) self.chunks.push(e.data); };
    this.mr.onstop = function () { self.finish(); };

    // analyser for the live waveform
    var AC = window.AudioContext || window.webkitAudioContext;
    try {
      this.ctx = new AC();
      var src = this.ctx.createMediaStreamSource(stream);
      this.an = this.ctx.createAnalyser();
      this.an.fftSize = 1024;
      src.connect(this.an);
      this.buf = new Uint8Array(this.an.fftSize);
    } catch (e) { this.an = null; }

    this.mr.start(1000);
    this.startedAt = performance.now();
    this.lastPeak = 0;
    this.peaks = [];
    this.status("");
    this.setState("recording");
    if (navigator.vibrate) navigator.vibrate(12);
    this.tick();
  };

  Recorder.prototype.tick = function () {
    var self = this;
    if (this.state !== "recording") return;
    var el = this.elapsed();
    if (el - this.lastPeak >= PEAK_EVERY) {
      this.lastPeak = el;
      var peak = 0;
      if (this.an) {
        this.an.getByteTimeDomainData(this.buf);
        var sum = 0;
        for (var i = 0; i < this.buf.length; i++) { var v = (this.buf[i] - 128) / 128; sum += v * v; }
        peak = Math.min(1, Math.sqrt(sum / this.buf.length) * 3.2);
      }
      this.peaks.push(peak);
    }
    this.updateTime();
    this.draw();
    if (el >= MAX_SECONDS) { this.stop(); return; }
    requestAnimationFrame(function () { self.tick(); });
  };

  Recorder.prototype.stop = function () {
    if (this.state !== "recording") return;
    this.duration = this.elapsed();
    this.startedAt = 0;
    if (this.mr && this.mr.state !== "inactive") this.mr.stop();
    if (this.stream) this.stream.getTracks().forEach(function (tr) { tr.stop(); });   // mic indicator off
    if (this.ctx) this.ctx.close().catch(function () {});
    if (navigator.vibrate) navigator.vibrate(12);
  };

  Recorder.prototype.finish = function () {
    if (!this.chunks.length || this.duration < 0.8) {
      this.status(this.o.t("voice.tooShort"), "err");
      this.setState("idle");
      this.draw();
      return;
    }
    this.blob = new Blob(this.chunks, { type: this.mime });
    this.url = URL.createObjectURL(this.blob);
    var self = this;
    this.audio = new Audio(this.url);
    this.audio.preload = "auto";
    this.audio.addEventListener("ended", function () { self.progress = 0; self.el.play.classList.remove("is-playing"); self.updateTime(); self.draw(); });
    this.progress = 0;
    this.setState("review");
    this.draw();
  };

  /* ───────── review ───────── */

  Recorder.prototype.togglePlay = function () {
    var self = this, a = this.audio;
    if (!a) return;
    if (a.paused) {
      a.play().catch(function () {});
      this.el.play.classList.add("is-playing");
      (function loop() {
        if (a.paused) return;
        self.progress = Math.min(1, a.currentTime / (self.duration || 1));
        self.updateTime();
        self.draw();
        requestAnimationFrame(loop);
      })();
    } else {
      a.pause();
      this.el.play.classList.remove("is-playing");
    }
  };

  Recorder.prototype.reset = function () {
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
    this.blob = null;
    this.peaks = [];
    this.progress = 0;
    this.duration = 0;
    this.el.play.classList.remove("is-playing");
    this.status("");
    this.setState("idle");
    this.draw();
  };

  /* ───────── sending ───────── */

  Recorder.prototype.send = function () {
    var self = this, t = this.o.t;
    if (!this.blob || this.state === "sending") return;
    if (this.audio) { this.audio.pause(); this.el.play.classList.remove("is-playing"); }
    var guest = this.o.guest();
    var slug = (guest || "guest").normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "guest";
    var name = "voice-" + slug + "-" + Date.now() + "." + extFor(this.mime);
    var file;
    try { file = new File([this.blob], name, { type: this.mime }); }
    catch (e) { file = this.blob; file.name = name; }   // very old Safari

    this.progress = 0;
    this.setState("sending");
    this.status(t("voice.sending"));
    this.o.uploader.opts.onUpdate = function (item) {
      self.progress = item.file.size ? item.sent / item.file.size : 0;
      self.draw();
      if (item.status === "error") {
        self.setState("error");
        var why = window.WeddingUploader.describe ? window.WeddingUploader.describe(item.error) : "";
        self.status(t("voice.failed") + (why ? " (" + why + ")" : ""), "err");
      }
    };
    this.o.uploader.opts.onDone = function (item) {
      self.progress = 1;
      self.status(t("voice.sent"), "ok");
      if (self.o.onSent) self.o.onSent(item.result, item);
      if (navigator.vibrate) navigator.vibrate([16, 60, 16]);
      if (self.audio) self.audio.pause();
      self.audio = null;
      self.blob = null;
      self.setState("sent");
      self.draw();
    };
    this.o.uploader.add([file], guest, { duration: Math.round(this.duration * 10) / 10 });
  };

  /* ───────── drawing ───────── */

  Recorder.prototype.resize = function () {
    var c = this.el.canvas;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = c.clientWidth || 300, h = c.clientHeight || 72;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.dpr = dpr;
  };

  Recorder.prototype.draw = function () {
    var c = this.el.canvas, g = c.getContext("2d");
    if (!g) return;
    var W = c.width, H = c.height, dpr = this.dpr || 1;
    g.clearRect(0, 0, W, H);
    var navy = "rgba(20,41,90,1)", faint = "rgba(20,41,90,0.22)";
    var bar = 3 * dpr, gap = 2.5 * dpr, step = bar + gap;
    var n = Math.floor(W / step);
    var mid = H / 2;
    var peaks = this.peaks, s = this.state, data = [];

    if (s === "recording") {
      data = peaks.slice(-n);                          // scrolling live view
    } else if (peaks.length) {
      for (var i = 0; i < n; i++) {                    // whole message squeezed to fit
        var a = Math.floor(i / n * peaks.length), b = Math.max(a + 1, Math.floor((i + 1) / n * peaks.length));
        var m = 0;
        for (var j = a; j < b; j++) m = Math.max(m, peaks[j] || 0);
        data.push(m);
      }
    }

    var played = Math.round(this.progress * n);
    for (var k = 0; k < n; k++) {
      var p = data[k];
      var x = k * step;
      var hgt;
      if (p == null) {                                // resting dotted line
        g.fillStyle = faint;
        g.fillRect(x, mid - dpr * 0.75, bar, dpr * 1.5);
        continue;
      }
      hgt = Math.max(2 * dpr, p * (H - 6 * dpr));
      g.fillStyle = s === "recording" ? navy : k < played ? navy : faint;
      var y = mid - hgt / 2, r = bar / 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, bar, hgt, r); else g.rect(x, y, bar, hgt);
      g.fill();
    }
  };

  window.WeddingRecorder = Recorder;
})();
