/* ==========================================================================
   Illustrated flight map — Lannion (LFRO) → the Pink Granite Coast → Bréhat.
   Drawn in SVG from real coordinates (simplified coastline), engraved-map
   style: navy ink on ivory. A little plane flies the route, the "camera"
   follows it, each viewpoint lights up as it is passed, then the map zooms
   out to the whole flight. Tap the map to fly again.
   ========================================================================== */
(function () {
  "use strict";

  // projection: equirectangular around 48.8°N, 1000 units wide
  var LON0 = -3.64, LON1 = -2.90, LAT_TOP = 48.915, LAT_BOT = 48.695;
  var K = 1000 / ((LON1 - LON0) * Math.cos(48.8 * Math.PI / 180));
  var H = Math.round((LAT_TOP - LAT_BOT) * K);           // ≈ 470
  function P(lon, lat) { return [(lon - LON0) * Math.cos(48.8 * Math.PI / 180) * K, (LAT_TOP - lat) * K]; }

  // simplified mainland coastline (clockwise from the south-west)
  var COAST = [
    [-3.585, 48.560], [-2.780, 48.560], [-2.780, 48.700], [-2.900, 48.712], [-2.935, 48.728], [-2.97, 48.748], [-3.00, 48.764],
    [-3.028, 48.775], [-3.045, 48.786], [-3.032, 48.800], [-3.024, 48.815], [-3.048, 48.826], [-3.065, 48.829],
    [-3.071, 48.820], [-3.077, 48.821], [-3.082, 48.836], [-3.092, 48.851], [-3.099, 48.866], [-3.108, 48.873],
    [-3.135, 48.869], [-3.163, 48.862], [-3.182, 48.850], [-3.195, 48.840], [-3.202, 48.832], [-3.209, 48.842],
    [-3.216, 48.857], [-3.226, 48.871], [-3.246, 48.866], [-3.268, 48.856], [-3.292, 48.847], [-3.312, 48.840],
    [-3.333, 48.830], [-3.355, 48.820], [-3.380, 48.810], [-3.405, 48.800], [-3.424, 48.806], [-3.440, 48.815],
    [-3.455, 48.824], [-3.472, 48.832], [-3.487, 48.837], [-3.503, 48.833], [-3.517, 48.829], [-3.538, 48.822],
    [-3.560, 48.812], [-3.584, 48.806], [-3.596, 48.797], [-3.586, 48.788], [-3.580, 48.778], [-3.572, 48.765],
    [-3.560, 48.750], [-3.548, 48.738], [-3.556, 48.728], [-3.567, 48.721], [-3.575, 48.705]
  ];
  var ISLANDS = [
    // Île de Bréhat
    [[-3.012, 48.842], [-2.998, 48.836], [-2.986, 48.842], [-2.989, 48.853], [-2.996, 48.862], [-3.008, 48.858], [-3.014, 48.850]],
    // Les Sept-Îles
    [[-3.500, 48.877], [-3.492, 48.875], [-3.490, 48.880], [-3.498, 48.882]],
    [[-3.478, 48.881], [-3.470, 48.880], [-3.469, 48.885], [-3.476, 48.886]],
    [[-3.457, 48.874], [-3.451, 48.873], [-3.450, 48.877], [-3.456, 48.878]],
    // Île Milliau
    [[-3.596, 48.769], [-3.589, 48.767], [-3.587, 48.772], [-3.594, 48.774]]
  ];
  var SILLON = [[-3.108, 48.873], [-3.096, 48.882], [-3.084, 48.891]];

  var BASE = { name: "Lannion, aéroport (LFRO)", lon: -3.4717, lat: 48.7544 };
  var STOPS = [
    { name: "Île de Bréhat", lon: -3.000, lat: 48.849, dx: 0, dy: -16, a: "middle" },
    { name: "Sillon de Talbert", lon: -3.088, lat: 48.887, dx: 0, dy: -14, a: "middle" },
    { name: "Plougrescant", lon: -3.228, lat: 48.878, dx: 0, dy: -14, a: "middle" },
    { name: "Port-Blanc", lon: -3.312, lat: 48.846, dx: 0, dy: -14, a: "middle" },
    { name: "Perros-Guirec", lon: -3.445, lat: 48.824, dx: 10, dy: 22, a: "start" },
    { name: "Ploumanac’h", lon: -3.487, lat: 48.843, dx: 0, dy: -14, a: "middle" },
    { name: "Trégastel", lon: -3.519, lat: 48.835, dx: -6, dy: 24, a: "end" },
    { name: "Île-Grande", lon: -3.600, lat: 48.803, dx: -12, dy: 4, a: "end" },
    { name: "Trébeurden", lon: -3.586, lat: 48.772, dx: -12, dy: 4, a: "end" }
  ];
  var TOWNS = [
    { name: "Lannion", lon: -3.455, lat: 48.733 },
    { name: "Paimpol", lon: -3.047, lat: 48.778 },
    { name: "Tréguier", lon: -3.232, lat: 48.787 }
  ];

  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmt(n) { return Math.round(n * 10) / 10; }
  // closed, softly rounded outline through the given coordinates (Catmull-Rom)
  function closedPath(pts) {
    var q = pts.map(function (p) { return P(p[0], p[1]); }), n = q.length, t = 0.16;
    var d = "M" + fmt(q[0][0]) + " " + fmt(q[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
      d += "C" + fmt(p1[0] + (p2[0] - p0[0]) * t) + " " + fmt(p1[1] + (p2[1] - p0[1]) * t) + " " +
        fmt(p2[0] - (p3[0] - p1[0]) * t) + " " + fmt(p2[1] - (p3[1] - p1[1]) * t) + " " + fmt(p2[0]) + " " + fmt(p2[1]);
    }
    return d + "Z";
  }
  // smooth curve through points (Catmull-Rom → cubic Bézier)
  function smooth(pts) {
    var d = "M" + fmt(pts[0][0]) + " " + fmt(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var t = 0.18;
      d += "C" + fmt(p1[0] + (p2[0] - p0[0]) * t) + " " + fmt(p1[1] + (p2[1] - p0[1]) * t) + " " +
        fmt(p2[0] - (p3[0] - p1[0]) * t) + " " + fmt(p2[1] - (p3[1] - p1[1]) * t) + " " + fmt(p2[0]) + " " + fmt(p2[1]);
    }
    return d;
  }

  function FlightMap(root, list) {
    this.root = root;
    this.list = list;
    this.build();
    var self = this;
    root.addEventListener("click", function () { self.play(); });
    window.addEventListener("resize", function () { if (!self.flying) self.setView(self.full()); }, { passive: true });
  }

  FlightMap.prototype.build = function () {
    var svg = this.svg = el("svg", { viewBox: "0 0 1000 " + H, preserveAspectRatio: "xMidYMid meet", role: "img" });
    var defs = el("defs", {}, svg);
    var waves = el("pattern", { id: "waves", width: 26, height: 14, patternUnits: "userSpaceOnUse" }, defs);
    el("path", { d: "M0 9 Q6.5 4 13 9 T26 9", fill: "none", stroke: "#14295a", "stroke-opacity": ".08", "stroke-width": "1" }, waves);
    var dots = el("pattern", { id: "dots", width: 9, height: 9, patternUnits: "userSpaceOnUse" }, defs);
    el("circle", { cx: 2, cy: 2, r: ".8", fill: "#14295a", "fill-opacity": ".09" }, dots);

    el("rect", { x: -3000, y: -3000, width: 7000, height: 7000, fill: "#e8eef6" }, svg);
    el("rect", { x: -3000, y: -3000, width: 7000, height: 7000, fill: "url(#waves)" }, svg);
    var sea = el("text", { x: 470, y: 60, "text-anchor": "middle", "class": "m-sea" }, svg);
    sea.textContent = "La Manche";

    var landD = closedPath(COAST);
    var islandsD = ISLANDS.map(closedPath).join("");
    // engraved-map halo along the shore, then land, then the ink line
    el("path", { d: landD + islandsD, fill: "none", stroke: "#14295a", "stroke-opacity": ".07", "stroke-width": "14", "stroke-linejoin": "round" }, svg);
    el("path", { d: landD + islandsD, fill: "none", stroke: "#14295a", "stroke-opacity": ".08", "stroke-width": "6", "stroke-linejoin": "round" }, svg);
    el("path", { d: landD + islandsD, fill: "#f7f3ec" }, svg);
    el("path", { d: landD + islandsD, fill: "url(#dots)" }, svg);
    el("path", { d: landD + islandsD, fill: "none", stroke: "#14295a", "stroke-width": "1.3", "stroke-linejoin": "round" }, svg);
    el("path", { d: "M" + SILLON.map(function (p) { var q = P(p[0], p[1]); return fmt(q[0]) + " " + fmt(q[1]); }).join("L"),
      fill: "none", stroke: "#14295a", "stroke-width": "2.2", "stroke-linecap": "round" }, svg);

    TOWNS.forEach(function (t) {
      var q = P(t.lon, t.lat);
      el("circle", { cx: fmt(q[0]), cy: fmt(q[1]), r: 2.2, fill: "#14295a", "fill-opacity": ".5" }, svg);
      var tx = el("text", { x: fmt(q[0]), y: fmt(q[1] + 16), "text-anchor": "middle", "class": "m-town" }, svg);
      tx.textContent = t.name;
    });

    // compass
    var c = el("g", { transform: "translate(950 " + (H - 54) + ")", "class": "m-compass" }, svg);
    el("circle", { r: 18, fill: "none", stroke: "#14295a", "stroke-opacity": ".35" }, c);
    el("path", { d: "M0 -15 L4 0 L0 15 L-4 0Z", fill: "#14295a", "fill-opacity": ".55" }, c);
    var n = el("text", { y: -22, "text-anchor": "middle", "class": "m-n" }, c);
    n.textContent = "N";

    // route: Lannion → stops → Lannion
    var base = P(BASE.lon, BASE.lat);
    var pts = [base].concat(STOPS.map(function (s) { return P(s.lon, s.lat); })).concat([base]);
    var d = smooth(pts);
    el("path", { d: d, fill: "none", stroke: "#14295a", "stroke-opacity": ".28", "stroke-width": "1.4", "stroke-dasharray": "2 6", "stroke-linecap": "round" }, svg);
    this.route = el("path", { d: d, fill: "none", stroke: "#14295a", "stroke-width": "2.2", "stroke-linecap": "round" }, svg);
    this.len = this.route.getTotalLength();
    this.route.style.strokeDasharray = this.len + " " + this.len;
    this.route.style.strokeDashoffset = this.len;

    // stops: marker + label, and where along the route each one is passed
    var self = this;
    this.marks = STOPS.map(function (s) {
      var q = P(s.lon, s.lat);
      var g = el("g", { "class": "m-stop" }, svg);
      var ring = el("circle", { cx: fmt(q[0]), cy: fmt(q[1]), r: 5.5, fill: "#f7f3ec", stroke: "#14295a", "stroke-width": "1.4" }, g);
      var label = el("text", { x: fmt(q[0] + s.dx), y: fmt(q[1] + s.dy), "text-anchor": s.a, "class": "m-label" }, g);
      label.textContent = s.name;
      label.style.opacity = 0;
      return { ring: ring, label: label, at: self.lengthNear(q), on: false };
    });

    // airport
    var ap = el("g", { transform: "translate(" + fmt(base[0]) + " " + fmt(base[1]) + ")" }, svg);
    el("circle", { r: 13, fill: "#14295a" }, ap);
    el("path", { d: "M-7 1.5l6-1.6 3.4-6.4h1.5l-2 5.7 4.2-1.1 1.3-1.8h1.2l-.8 2.7.8 2.7h-1.2l-1.3-1.8-4.2-1.1 2 5.7h-1.5l-3.4-6.4-6-1.6z", fill: "#f7f3ec", transform: "scale(.95) translate(-1 -1)" }, ap);
    var apl = el("text", { x: 0, y: 30, "text-anchor": "middle", "class": "m-ap" }, ap);
    apl.textContent = "LFRO";

    // the plane
    this.plane = el("g", { "class": "m-plane" }, svg);
    el("circle", { r: 15, fill: "#f7f3ec", "fill-opacity": ".85", stroke: "#14295a", "stroke-opacity": ".25" }, this.plane);
    el("path", { d: "M-11 2.2l9-2.4 5-9.6h2.2l-2.9 8.5 6.3-1.7 2-2.7h1.8l-1.2 4 1.2 4h-1.8l-2-2.7-6.3-1.7 2.9 8.5h-2.2l-5-9.6-9-2.4z", fill: "#14295a" }, this.plane);
    this.plane.style.opacity = 0;

    var style = el("style", {}, svg);
    style.textContent =
      ".m-sea{font:italic 22px 'Cormorant',Garamond,serif;fill:#14295a;fill-opacity:.35;letter-spacing:.3em}" +
      ".m-town{font:600 12.5px 'Cormorant',Garamond,serif;fill:#14295a;fill-opacity:.5;letter-spacing:.16em;text-transform:uppercase}" +
      ".m-label{font:600 17px 'Cormorant',Garamond,serif;fill:#14295a;paint-order:stroke;stroke:#f7f3ec;stroke-width:4px;stroke-linejoin:round}" +
      ".m-ap{font:600 12.5px 'Cormorant',Garamond,serif;fill:#14295a;letter-spacing:.2em;paint-order:stroke;stroke:#f7f3ec;stroke-width:3px}" +
      ".m-n{font:600 11px 'Cormorant',Garamond,serif;fill:#14295a;fill-opacity:.6}";

    this.root.appendChild(svg);

    // the list under the map
    var html = '<li class="is-base">Départ : ' + BASE.name + "</li>";
    STOPS.forEach(function (s) { html += "<li>" + s.name + "</li>"; });
    html += '<li class="is-base">Retour : Lannion</li>';
    this.list.innerHTML = html;
    this.items = Array.prototype.slice.call(this.list.querySelectorAll("li:not(.is-base)"));
    this.base = base;
    this.setView(this.full());
  };

  FlightMap.prototype.lengthNear = function (q) {
    var best = 0, bestD = Infinity, step = this.len / 400;
    for (var l = 0; l <= this.len; l += step) {
      var p = this.route.getPointAtLength(l);
      var dd = (p.x - q[0]) * (p.x - q[0]) + (p.y - q[1]) * (p.y - q[1]);
      if (dd < bestD) { bestD = dd; best = l; }
    }
    return best;
  };

  FlightMap.prototype.aspect = function () {
    var r = this.root.getBoundingClientRect();
    return r.width && r.height ? r.width / r.height : 1;
  };
  FlightMap.prototype.full = function () {
    var a = this.aspect(), w = 1000, h = w / a;
    if (h < H) { h = H; w = h * a; }
    return { x: 500 - w / 2, y: H / 2 - h / 2, w: w, h: h };
  };
  FlightMap.prototype.setView = function (v) {
    this.view = v;
    this.svg.setAttribute("viewBox", fmt(v.x) + " " + fmt(v.y) + " " + fmt(v.w) + " " + fmt(v.h));
  };

  FlightMap.prototype.reset = function () {
    this.route.style.strokeDashoffset = this.len;
    this.marks.forEach(function (m) { m.on = false; m.ring.setAttribute("fill", "#f7f3ec"); m.ring.setAttribute("r", 5.5); m.label.style.opacity = 0; });
    this.items.forEach(function (li) { li.classList.remove("is-on"); });
    this.plane.style.opacity = 0;
  };

  FlightMap.prototype.play = function () {
    var gsap = window.gsap, self = this;
    if (this.flying) return;
    this.reset();
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gsap || reduce) {                         // no animation: show the finished flight
      this.route.style.strokeDashoffset = 0;
      this.marks.forEach(function (m, i) { self.light(m, i); });
      this.setView(this.full());
      return;
    }
    this.flying = true;
    var full = this.full();
    var a = this.aspect();
    var zw = Math.min(full.w, 400 * Math.max(1, a));  // close-up window following the plane
    var zh = zw / a;
    var cam = { x: this.base[0] - zw / 2, y: this.base[1] - zh / 2 };
    var st = { p: 0 };
    gsap.set(this.plane, { opacity: 1 });

    var tl = gsap.timeline({ onComplete: function () { self.flying = false; } });
    // 1 · zoom from the whole map onto the airport
    var v0 = { x: full.x, y: full.y, w: full.w, h: full.h };
    tl.to(v0, { x: cam.x, y: cam.y, w: zw, h: zh, duration: 1.6, ease: "power2.inOut", onUpdate: function () { self.setView(v0); } });
    // 2 · the flight, camera following the plane
    tl.to(st, {
      p: 1, duration: 13, ease: "power1.inOut",
      onUpdate: function () {
        var l = st.p * self.len;
        var pt = self.route.getPointAtLength(l);
        var ahead = self.route.getPointAtLength(Math.min(self.len, l + 2));
        var behind = self.route.getPointAtLength(Math.max(0, l - 2));
        var ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
        self.plane.setAttribute("transform", "translate(" + fmt(pt.x) + " " + fmt(pt.y) + ") rotate(" + fmt(ang) + ")");
        self.route.style.strokeDashoffset = self.len - l;
        cam.x += (pt.x - zw / 2 - cam.x) * 0.08;
        cam.y += (pt.y - zh / 2 - cam.y) * 0.08;
        cam.x = Math.max(full.x, Math.min(full.x + full.w - zw, cam.x));
        cam.y = Math.max(full.y - 40, Math.min(full.y + full.h - zh + 40, cam.y));
        self.setView({ x: cam.x, y: cam.y, w: zw, h: zh });
        self.marks.forEach(function (m, i) { if (!m.on && l >= m.at - 2) self.light(m, i); });
      }
    });
    // 3 · back to the whole flight
    var v1 = {};
    tl.add(function () { v1.x = self.view.x; v1.y = self.view.y; v1.w = self.view.w; v1.h = self.view.h; });
    tl.to(v1, { x: full.x, y: full.y, w: full.w, h: full.h, duration: 1.8, ease: "power2.inOut", onUpdate: function () { if (v1.w) self.setView(v1); } });
    tl.to(this.plane, { opacity: 0, duration: 0.6 }, "<");
  };

  FlightMap.prototype.light = function (m, i) {
    m.on = true;
    m.ring.setAttribute("fill", "#14295a");
    if (window.gsap) {
      window.gsap.fromTo(m.ring, { attr: { r: 11 } }, { attr: { r: 5.5 }, duration: 0.8, ease: "expo.out" });
      window.gsap.to(m.label, { opacity: 1, duration: 0.8 });
    } else m.label.style.opacity = 1;
    if (this.items[i]) this.items[i].classList.add("is-on");
  };

  window.FlightMap = FlightMap;
})();
