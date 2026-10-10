// Outils de la direction artistique « organique / analogique » :
// papier fait main (bords déchirés), pierres, ficelle, ombre de feuillage, filtres d'impression.
(() => {
  // Générateur pseudo-aléatoire reproductible : un rendu identique à chaque génération
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // Filtres SVG partagés : encre pressée (letterpress), grain du papier, relief de pierre
  const defs = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id="press" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="holes"/>
      <feComposite in="SourceGraphic" in2="holes" operator="in" result="eroded"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="9" result="w"/>
      <feDisplacementMap in="eroded" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="press-soft" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="2" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1 1.45" result="holes"/>
      <feComposite in="SourceGraphic" in2="holes" operator="in"/>
    </filter>
  </svg>`;
  document.body.insertAdjacentHTML('afterbegin', defs);

  // Bords de papier déchiré : polygone irrégulier sur les côtés demandés (data-deckle="trbl")
  document.querySelectorAll('[data-deckle]').forEach((el, k) => {
    const r = rng(101 + k * 37);
    const sides = el.dataset.deckle || 'trbl';
    const amp = +(el.dataset.amp || 0.9); // amplitude en % de la dimension
    const pts = [];
    const step = 0.6;
    const j = (on) => (on ? r() * amp : 0);
    for (let x = 0; x <= 100; x += step) pts.push([x, j(sides.includes('t'))]);
    for (let y = 0; y <= 100; y += step) pts.push([100 - j(sides.includes('r')), y]);
    for (let x = 100; x >= 0; x -= step) pts.push([x, 100 - j(sides.includes('b'))]);
    for (let y = 100; y >= 0; y -= step) pts.push([j(sides.includes('l')), y]);
    el.style.clipPath = `polygon(${pts.map(([a, b]) => `${a.toFixed(2)}% ${b.toFixed(2)}%`).join(',')})`;
  });

  // Pierres : forme organique + relief éclairé (turbulence + lumière diffuse)
  document.querySelectorAll('[data-stone]').forEach((el, k) => {
    const w = el.clientWidth, h = el.clientHeight;
    const r = rng(7 + k * 53);
    const cx = w / 2, cy = h / 2;
    let pts;
    if (el.dataset.shape === 'block') {
      // Bloc taillé : rectangle aux arêtes légèrement irrégulières
      const m = 0.02, q = [[m, m], [0.5, m * 0.6], [1 - m, m], [1 - m * 0.5, 0.5], [1 - m, 1 - m], [0.5, 1 - m * 0.4], [m, 1 - m], [m * 0.6, 0.5]];
      pts = q.map(([a, b]) => [w * a + (r() - 0.5) * w * 0.012, h * b + (r() - 0.5) * h * 0.03]);
    } else {
      const n = 14;
      pts = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const rad = 0.42 + r() * 0.08;
        return [cx + Math.cos(a) * w * rad, cy + Math.sin(a) * h * rad * (0.92 + r() * 0.1)];
      });
    }
    const n = pts.length;
    // Courbe lissée passant par les points (Catmull-Rom → Bézier)
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    const [c1, c2] = (el.dataset.stone || '#c9c0b2,#9d9384').split(',');
    const id = 'st' + k;
    const freq = el.dataset.freq || '0.035';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block;overflow:visible">
      <defs>
        <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="5" seed="${k * 7 + 3}" result="t"/>
          <feDiffuseLighting in="t" surfaceScale="${el.dataset.relief || 5}" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting>
          <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" result="lit"/>
          <feComposite in="lit" in2="SourceAlpha" operator="in"/>
        </filter>
        <radialGradient id="${id}g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
      </defs>
      <path d="${d}" fill="rgb(40 32 24 / .35)" transform="translate(${w * 0.03},${h * 0.07})" style="filter:blur(${Math.round(w / 28)}px)"/>
      <path d="${d}" fill="url(#${id}g)" filter="url(#${id})"/>
    </svg>`;
  });
})();
