// Hero « Peindre juste » : un pinceau révèle l'après par-dessus l'avant.
// Canvas 2D : un masque accumule les coups de pinceau (texture de poils),
// puis l'image « après » est découpée par ce masque au-dessus de l'« avant ».
import { gsap } from 'gsap';

type Pt = { x: number; y: number };

export function initPaint(root: HTMLElement, reduced: boolean) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-paint]');
  const before = root.querySelector<HTMLImageElement>('[data-paint-before]');
  const after = root.querySelector<HTMLImageElement>('[data-paint-after]');
  const pctEl = root.querySelector<HTMLElement>('[data-paint-pct]');
  const allBtn = root.querySelector<HTMLButtonElement>('[data-paint-all]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !before || !after || !ctx) {
    root.classList.add('no-canvas');
    return { intro: () => {} };
  }

  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d')!;
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d')!;
  const probe = document.createElement('canvas');
  probe.width = 48;
  probe.height = 32;
  const pctx = probe.getContext('2d', { willReadFrequently: true })!;

  let W = 0;
  let H = 0;
  let R = 60; // rayon du pinceau (px CSS)
  let dirty = true;
  let visible = true;
  let done = false;
  let last: Pt | null = null;
  let lastT = 0;
  let stamp: HTMLCanvasElement;

  // Tampon « poils de pinceau » : une tache aux bords irréguliers et striés
  const makeStamp = (r: number) => {
    const s = document.createElement('canvas');
    const size = Math.ceil(r * 2 * dpr);
    s.width = s.height = size;
    const c = s.getContext('2d')!;
    const cx = size / 2;
    const g = c.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    // poils
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = cx * (0.55 + Math.random() * 0.45);
      c.fillStyle = `rgba(0,0,0,${0.25 + Math.random() * 0.5})`;
      c.beginPath();
      c.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, cx * (0.05 + Math.random() * 0.12), 0, Math.PI * 2);
      c.fill();
    }
    return s;
  };

  const cover = (img: HTMLImageElement, c: CanvasRenderingContext2D) => {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw) return;
    const s = Math.max(c.canvas.width / iw, c.canvas.height / ih);
    const w = iw * s;
    const h = ih * s;
    c.drawImage(img, (c.canvas.width - w) / 2, (c.canvas.height - h) / 2, w, h);
  };

  const resize = () => {
    const r = root.getBoundingClientRect();
    const nw = Math.round(r.width * dpr);
    const nh = Math.round(r.height * dpr);
    if (nw === canvas.width && nh === canvas.height) return;
    // on conserve le masque existant en le redimensionnant
    const old = document.createElement('canvas');
    old.width = mask.width;
    old.height = mask.height;
    if (mask.width) old.getContext('2d')!.drawImage(mask, 0, 0);
    W = r.width;
    H = r.height;
    for (const c of [canvas, mask, layer]) {
      c.width = nw;
      c.height = nh;
    }
    if (old.width) mctx.drawImage(old, 0, 0, nw, nh);
    R = Math.max(38, Math.min(W, H) * 0.085);
    stamp = makeStamp(R);
    dirty = true;
  };

  const dab = (p: Pt, scale = 1) => {
    const sz = R * 2 * scale * dpr;
    mctx.globalAlpha = 0.85;
    mctx.drawImage(stamp, p.x * dpr - sz / 2, p.y * dpr - sz / 2, sz, sz);
    mctx.globalAlpha = 1;
  };

  // Trait entre deux points, épaisseur modulée par la vitesse
  const stroke = (a: Pt, b: Pt, speed = 0) => {
    const scale = Math.max(0.55, 1.15 - speed * 0.25);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const step = Math.max(2, R * 0.18 * scale);
    const n = Math.ceil(dist / step);
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      dab({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, scale * (0.92 + Math.random() * 0.16));
    }
    dirty = true;
  };

  const render = () => {
    if (!dirty || !visible) return;
    dirty = false;
    ctx.globalCompositeOperation = 'source-over';
    cover(before, ctx);
    ctx.fillStyle = 'rgba(14,13,12,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, layer.width, layer.height);
    cover(after, lctx);
    lctx.globalCompositeOperation = 'destination-in';
    lctx.drawImage(mask, 0, 0);
    ctx.drawImage(layer, 0, 0);
  };

  // Part de l'écran repeinte
  let pct = 0;
  const measure = () => {
    pctx.clearRect(0, 0, probe.width, probe.height);
    pctx.drawImage(mask, 0, 0, probe.width, probe.height);
    const d = pctx.getImageData(0, 0, probe.width, probe.height).data;
    let sum = 0;
    for (let i = 3; i < d.length; i += 4) sum += d[i];
    const v = Math.min(100, Math.round((sum / (255 * probe.width * probe.height)) * 100));
    if (v !== pct) {
      pct = v;
      if (pctEl) pctEl.textContent = String(pct);
    }
    if (pct >= 62 && !done) fillAll();
  };

  // Termine le travail : grands coups de pinceau jusqu'à couvrir l'écran
  function fillAll() {
    if (done) return;
    done = true;
    const rows = Math.ceil(H / (R * 1.1)) + 1;
    const path: Pt[] = [];
    for (let i = 0; i < rows; i++) {
      const y = (i / (rows - 1)) * H;
      path.push(i % 2 ? { x: W + R, y } : { x: -R, y });
      path.push(i % 2 ? { x: -R, y: y + R * 0.4 } : { x: W + R, y: y + R * 0.4 });
    }
    const st = { t: 0 };
    let prev = path[0];
    gsap.to(st, {
      t: path.length - 1,
      duration: reduced ? 0 : 1.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        const i = Math.floor(st.t);
        const f = st.t - i;
        const a = path[i];
        const b = path[Math.min(i + 1, path.length - 1)];
        const p = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
        stroke(prev, p);
        prev = p;
      },
      onComplete: () => {
        mctx.fillStyle = '#000';
        mctx.fillRect(0, 0, mask.width, mask.height);
        dirty = true;
        pct = 100;
        if (pctEl) pctEl.textContent = '100';
        if (allBtn) allBtn.textContent = 'Recommencer';
      },
    });
  }

  const reset = () => {
    mctx.clearRect(0, 0, mask.width, mask.height);
    done = false;
    pct = 0;
    if (pctEl) pctEl.textContent = '0';
    if (allBtn) allBtn.textContent = 'Tout repeindre';
    dirty = true;
  };

  // Pointeur (souris, stylet, doigt : les glissés horizontaux peignent)
  const local = (e: PointerEvent): Pt => {
    const r = root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && !e.buttons && e.pressure === 0) return;
    const p = local(e);
    const now = performance.now();
    if (last) {
      const dt = Math.max(1, now - lastT);
      stroke(last, p, Math.hypot(p.x - last.x, p.y - last.y) / dt);
    }
    last = p;
    lastT = now;
  });
  root.addEventListener('pointerleave', () => (last = null));
  root.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && (last = null));
  root.addEventListener('pointerdown', (e) => {
    last = local(e);
    lastT = performance.now();
    dab(last);
    dirty = true;
  });
  allBtn?.addEventListener('click', () => (pct >= 100 ? reset() : fillAll()));

  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(root);
  addEventListener('resize', () => {
    resize();
  });

  const tick = () => render();
  gsap.ticker.add(tick);
  setInterval(() => visible && measure(), 400);

  const ready = Promise.all(
    [before, after].map((img) => (img.complete && img.naturalWidth ? Promise.resolve() : img.decode().catch(() => {}))),
  ).then(() => {
    resize();
    dirty = true;
    render();
  });

  // Coup de pinceau d'introduction, comme une signature
  const intro = () => {
    ready.then(() => {
      if (reduced) return;
      const pts: Pt[] = [
        { x: W * 0.12, y: H * 0.46 },
        { x: W * 0.46, y: H * 0.34 },
        { x: W * 0.82, y: H * 0.4 },
        { x: W * 0.62, y: H * 0.52 },
        { x: W * 0.28, y: H * 0.6 },
        { x: W * 0.72, y: H * 0.64 },
      ];
      const st = { t: 0 };
      let prev = pts[0];
      gsap.to(st, {
        t: pts.length - 1,
        duration: 2.1,
        ease: 'power2.inOut',
        onUpdate: () => {
          const i = Math.floor(st.t);
          const f = st.t - i;
          const a = pts[i];
          const b = pts[Math.min(i + 1, pts.length - 1)];
          // courbe douce (lissage simple)
          const e = f * f * (3 - 2 * f);
          const p = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * f };
          stroke(prev, p, 0.6);
          prev = p;
        },
      });
    });
  };

  return { intro };
}
