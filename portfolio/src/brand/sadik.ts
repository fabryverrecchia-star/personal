// Logo SADIK — source unique (SVG statique + composition WebGL).
// Reconstruit à partir de l'image d'origine (1662 × 442) : chaque contour a été mesuré puis
// redessiné en géométrie propre. Toutes les frontières de couleur sont des coupes
// horizontales / verticales ou des arcs de cercle (collage au compas).

export const VIEW = { w: 1662, h: 442 } as const;

export type Shape = { d: string; rule?: 'evenodd' };
export type Piece = {
  id: string;
  kind: 'bg' | 'letter' | 'line';
  fill: string;
  /** Intersection de formes (la pièce = zone commune à toutes). */
  clips: Shape[];
  /** Trait (fissures noires) : la pièce est un tracé, pas une surface. */
  stroke?: { d: string; width: number };
  letter?: LetterId;
};
export type LetterId = 'S' | 'A' | 'D' | 'I' | 'K';

/* ------------------------------------------------------------ primitives */
const PAD = 60;
const r1 = (n: number) => Math.round(n * 10) / 10;
const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `M${r1(x0)} ${r1(y0)}H${r1(x1)}V${r1(y1)}H${r1(x0)}Z`;
const circlePath = (cx: number, cy: number, r: number) =>
  `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const FULL = rect(-PAD, -PAD, VIEW.w + PAD, VIEW.h + PAD);

type Circle = [cx: number, cy: number, r: number];
const inside = ([cx, cy, r]: Circle): Shape => ({ d: circlePath(cx, cy, r) });
const outside = ([cx, cy, r]: Circle): Shape => ({ d: FULL + circlePath(cx, cy, r), rule: 'evenodd' });
const insideAny = (...cs: Circle[]): Shape => ({ d: cs.map(([x, y, r]) => circlePath(x, y, r)).join('') });
const above = (y: number): Shape => ({ d: rect(-PAD, -PAD, VIEW.w + PAD, y) });
const below = (y: number): Shape => ({ d: rect(-PAD, y, VIEW.w + PAD, VIEW.h + PAD) });
const box = (x0: number, y0: number, x1: number, y1: number): Shape => ({ d: rect(x0, y0, x1, y1) });

/* ---------------------------------------------------------------- lettres */
export const LETTERS: Record<LetterId, Shape> = {
  S: {
    d: 'M58.5 326.6L114.6 277.2C130.4 285.6 141.2 305.8 170.1 310.1C180.3 311.6 194.3 310.5 202.1 303.1C207.2 298.4 209.8 291.3 209.2 284.4C205.9 245.4 91.8 248 72 177.7C66 156.6 67.2 133.3 77 113.6C112.2 42.6 214.6 46.4 270.7 87.9C278.9 94 289.7 100.7 293.5 110.3L238.1 159C220.2 150.8 200.9 116.8 167.2 127.3C159.6 129.7 152.9 135.1 151.2 143.2C142.1 185.5 268.2 180.9 288.1 257.1C293 275.9 292.4 295.7 285.9 314C275.7 342.5 251 364.1 221.8 372C213 374.4 205 376.3 197.9 377.1C159.5 382.7 113.5 372.4 81.9 349.9C73.4 343.7 63 336.3 58.5 326.6Z',
  },
  A: {
    d: 'M446.9 67H553.1L666.7 370H582.8L555.6 297.5H444.4L417.3 370H333.3ZM499.5 144.5L469 233.5H530Z',
    rule: 'evenodd',
  },
  D: {
    d: 'M732 67H868A161 151.5 0 0 1 868 370H732ZM813 137V300H863A83 81.5 0 0 0 863 137Z',
    rule: 'evenodd',
  },
  I: { d: 'M1107 67H1188V370H1107Z' },
  K: { d: 'M1294 67H1375V182L1491 67H1586V72L1459 196.5L1587.5 370H1490.5L1403.5 251L1375 278V370H1294Z' },
};

const K_ARMS = 'M1375 182L1491 67H1586V72L1459 196.5L1587.5 370H1490.5L1403.5 251L1375 278Z';

/* ------------------------------------------------------- cercles mesurés */
const A_TOP: Circle = [696.2, 138.2, 200.9]; // sépare vert / orange clair en haut du A
const A_RIGHT: Circle = [721.4, 155.3, 219.2]; // jambe droite orange
const A_LEFT: Circle = [683.3, 178.1, 323]; // pointe orange de la jambe gauche
const D_ARC: Circle = [730.3, 152.6, 225.2]; // croissant vert d'eau du D
const BG_LEFT: Circle = [-112.6, 135.5, 298.6];
const BG_LEFT_TOP: Circle = [44.6, 72.1, 138];
const BG_RIGHT_BIG: Circle = [1938.4, 118.8, 531.5];
const BG_RIGHT_SMALL: Circle = [1928.8, 113.7, 322.6];

/* ------------------------------------------------------------- couleurs */
export const COLORS = {
  orange: '#d76f00',
  teal: '#357d5e',
  amber: '#f89000',
  red: '#c63f00',
  tangerine: '#ec6900',
  ochre: '#d96a00',
  yellow: '#fdb501',
  saffron: '#f18a01',
  mint: '#7eae8f',
  mintShade: '#6a9e84',
  petrol: '#00685b',
  cream: '#edce87',
  sage: '#6e8c53',
  ink: '#0e100d',
} as const;

const L = (id: LetterId) => LETTERS[id];

/** Couleur dominante de chaque lettre découpée : aplat posé sous les pièces pour masquer les jointures. */
export const LETTER_BASE: Partial<Record<LetterId, string>> = {
  A: COLORS.red,
  D: COLORS.saffron,
  I: COLORS.mint,
  K: COLORS.sage,
};

/* ---------------------------------------------------------------- pièces */
export const PIECES: Piece[] = [
  // Fond : papiers superposés (ordre de peinture)
  { id: 'bg', kind: 'bg', fill: '#1b231c', clips: [box(0, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-strip', kind: 'bg', fill: '#18201b', clips: [box(166, 0, 378, 108)] },
  { id: 'bg-petrol', kind: 'bg', fill: '#061313', clips: [box(378, 0, 602, 106)] },
  { id: 'bg-sand', kind: 'bg', fill: '#2f2a1e', clips: [box(602, 0, 766, 106)] },
  { id: 'bg-moss', kind: 'bg', fill: '#171b10', clips: [box(766, 0, 1142, VIEW.h)] },
  { id: 'bg-umber', kind: 'bg', fill: '#281700', clips: [box(1142, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-seam', kind: 'bg', fill: '#2f2a1e', clips: [box(1139.5, 0, 1142, VIEW.h)] },
  { id: 'bg-left-top', kind: 'bg', fill: '#302509', clips: [inside(BG_LEFT_TOP), above(114), box(0, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-left-bottom', kind: 'bg', fill: '#2e1c00', clips: [inside(BG_LEFT), below(114), box(0, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-right-top', kind: 'bg', fill: '#0f1913', clips: [inside(BG_RIGHT_BIG), above(110), box(0, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-right-bottom', kind: 'bg', fill: '#240f02', clips: [inside(BG_RIGHT_BIG), below(110), box(0, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-disc-top', kind: 'bg', fill: '#2f1d01', clips: [inside(BG_RIGHT_SMALL), above(110), box(0, 0, VIEW.w, VIEW.h)] },
  { id: 'bg-disc-bottom', kind: 'bg', fill: '#281700', clips: [inside(BG_RIGHT_SMALL), below(110), box(0, 0, VIEW.w, VIEW.h)] },

  // S
  { id: 'S', kind: 'letter', letter: 'S', fill: COLORS.orange, clips: [L('S')] },
  // A
  { id: 'A-teal', kind: 'letter', letter: 'A', fill: COLORS.teal, clips: [L('A'), above(138), outside(A_TOP)] },
  { id: 'A-amber', kind: 'letter', letter: 'A', fill: COLORS.amber, clips: [L('A'), above(138), inside(A_TOP)] },
  { id: 'A-red', kind: 'letter', letter: 'A', fill: COLORS.red, clips: [L('A'), below(138), outside(A_TOP), outside(A_RIGHT), inside(A_LEFT)] },
  { id: 'A-tangerine', kind: 'letter', letter: 'A', fill: COLORS.tangerine, clips: [L('A'), below(138), insideAny(A_TOP, A_RIGHT)] },
  { id: 'A-ochre', kind: 'letter', letter: 'A', fill: COLORS.ochre, clips: [L('A'), below(138), outside(A_LEFT)] },
  // D
  { id: 'D-yellow', kind: 'letter', letter: 'D', fill: COLORS.yellow, clips: [L('D'), above(139), inside(D_ARC)] },
  { id: 'D-saffron', kind: 'letter', letter: 'D', fill: COLORS.saffron, clips: [L('D'), below(139), inside(D_ARC)] },
  { id: 'D-mint-top', kind: 'letter', letter: 'D', fill: COLORS.mintShade, clips: [L('D'), above(139), outside(D_ARC)] },
  { id: 'D-mint', kind: 'letter', letter: 'D', fill: COLORS.mint, clips: [L('D'), below(139), outside(D_ARC)] },
  // I
  { id: 'I-petrol', kind: 'letter', letter: 'I', fill: COLORS.petrol, clips: [L('I'), above(136.5)] },
  { id: 'I-mint', kind: 'letter', letter: 'I', fill: COLORS.mint, clips: [L('I'), below(136.5)] },
  // K
  // (fût et bras décrits séparément : une coupe confondue avec le bord du fût laisserait un fil)
  { id: 'K-cream', kind: 'letter', letter: 'K', fill: COLORS.cream, clips: [box(1294, 67, 1375, 135)] },
  { id: 'K-mint', kind: 'letter', letter: 'K', fill: COLORS.mint, clips: [box(1294, 135, 1375, 370)] },
  { id: 'K-sage', kind: 'letter', letter: 'K', fill: COLORS.sage, clips: [{ d: K_ARMS }] },

  // Fissures noires
  {
    id: 'line-S',
    kind: 'line',
    fill: COLORS.ink,
    clips: [],
    stroke: { d: 'M175.5 311C187 321 197.5 336 203.5 352C207.5 362.5 209.5 370 208.5 377', width: 3.4 },
  },
  {
    id: 'line-I',
    kind: 'line',
    fill: COLORS.ink,
    clips: [],
    stroke: { d: 'M1183 369C1192 381 1199 392 1203.5 405C1208 418 1210.5 430 1210 443', width: 3.8 },
  },
];

/* ------------------------------------------------------------- SVG statique */
type SvgOptions = { id?: string; title?: string; grain?: boolean; attrs?: string };

/** Logo complet en SVG (autonome, aux proportions exactes 1662 × 442). */
export function sadikSvg({ id = 'sadik', title = 'SADIK', grain = true, attrs = '' }: SvgOptions = {}) {
  const defs: string[] = [];
  const body: string[] = [];
  let n = 0;
  const clipId = (shape: Shape) => {
    const cid = `${id}-c${n++}`;
    defs.push(`<clipPath id="${cid}"><path d="${shape.d}"${shape.rule ? ` clip-rule="${shape.rule}"` : ''}/></clipPath>`);
    return cid;
  };

  // Chaque lettre reçoit d'abord un aplat de sa couleur dominante : aucun liseré entre les pièces
  const base = LETTER_BASE;
  const drawnBase = new Set<LetterId>();

  for (const p of PIECES) {
    if (p.stroke) {
      body.push(
        `<path d="${p.stroke.d}" fill="none" stroke="${p.fill}" stroke-width="${p.stroke.width}" stroke-linecap="round"/>`,
      );
      continue;
    }
    if (p.letter && base[p.letter] && !drawnBase.has(p.letter)) {
      drawnBase.add(p.letter);
      const s = LETTERS[p.letter];
      body.push(`<path d="${s.d}"${s.rule ? ` fill-rule="${s.rule}"` : ''} fill="${base[p.letter]}"/>`);
    }
    const [last, ...rest] = [...p.clips].reverse();
    let el = `<path d="${last.d}"${last.rule ? ` fill-rule="${last.rule}"` : ''} fill="${p.fill}"/>`;
    for (const c of rest) el = `<g clip-path="url(#${clipId(c)})">${el}</g>`;
    body.push(el);
  }

  if (grain) {
    defs.push(
      `<filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.55"/></filter>`,
    );
    body.push(
      `<rect width="${VIEW.w}" height="${VIEW.h}" filter="url(#${id}-grain)" opacity="0.28" style="mix-blend-mode:overlay"/>`,
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}" role="img" aria-labelledby="${id}-title"${attrs ? ` ${attrs}` : ''}>` +
    `<title id="${id}-title">${title}</title><defs>${defs.join('')}</defs>` +
    `<g clip-path="url(#${id}-frame)">${body.join('')}</g>` +
    `<clipPath id="${id}-frame"><rect width="${VIEW.w}" height="${VIEW.h}"/></clipPath></svg>`
  );
}
