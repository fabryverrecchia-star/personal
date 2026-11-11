// Shaders GLSL. Les plans sont exprimés en pixels : 1 unité = 1 px à l'écran.
// Parti pris : des effets sobres et signifiants. Les images s'ouvrent dans un ovale,
// la forme du médaillon et des stickers de la marque ; pas d'aberration chromatique.

const common = /* glsl */ `
// UV "object-fit: cover"
vec2 cover(vec2 uv, vec2 plane, vec2 img) {
  vec2 r = plane / img;
  float s = max(r.x, r.y);
  vec2 size = img * s;
  return uv * plane / size + (size - plane) * 0.5 / size;
}
// Rectangle arrondi (rayons : tr, br, tl, bl en px)
float sdRound(vec2 p, vec2 b, vec4 r) {
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x = (p.y > 0.0) ? r.x : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}
// Ouverture en ovale (médaillon) : 0 = fermé, 1 = image entière
float oval(vec2 uv, vec2 plane, float t) {
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= mix(1.0, plane.x / plane.y, 0.35);
  float e = length(p);
  float r = t * 1.75;
  float aa = 2.0 / min(plane.x, plane.y);
  return 1.0 - smoothstep(r - aa, r + aa, e);
}
`;

export const mediaVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

export const mediaFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec2 uPlane;
uniform vec4 uRadius;
uniform float uReveal;
uniform float uHover;
uniform float uParallax;
uniform float uLoaded;
varying vec2 vUv;
${common}
void main() {
  // Marge de zoom pour la parallaxe interne, dézoom à l'ouverture, léger zoom au survol
  float zoom = 0.9 - 0.04 * uHover + 0.2 * (1.0 - uReveal);
  vec2 c = (vUv - 0.5) * zoom + 0.5;
  c.y += uParallax * 0.05;
  vec3 col = texture2D(uTex, cover(c, uPlane, uImg)).rgb;

  vec2 p = (vUv - 0.5) * uPlane;
  float a = 1.0 - smoothstep(-1.0, 0.5, sdRound(p, uPlane * 0.5, uRadius));
  gl_FragColor = vec4(col, a * oval(vUv, uPlane, uReveal) * uLoaded);
}
`;

export const heroFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uTex2;
uniform sampler2D uFlow;
uniform vec2 uImg;
uniform vec2 uImg2;
uniform vec2 uPlane;
uniform vec2 uResolution;
uniform vec4 uRadius;
uniform float uReveal;
uniform float uScroll;
uniform float uLoaded;
uniform float uMix;   // 0 : image courante, 1 : image suivante (slider)
varying vec2 vUv;
${common}
void main() {
  // Le pointeur laisse un léger sillage, comme un doigt sur une nappe
  vec2 flow = texture2D(uFlow, gl_FragCoord.xy / uResolution).rg;
  float zoom = 1.0 - 0.18 * (1.0 - uReveal) - 0.08 * uScroll;
  vec2 c = (vUv - 0.5) * zoom + 0.5;
  c.y += uScroll * 0.1;
  c -= flow * 0.025;

  // Transition de slide : l'image suivante s'ouvre dans un médaillon qui s'agrandit,
  // son bord ondule légèrement et pousse l'image courante vers l'extérieur.
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= mix(1.0, uPlane.x / uPlane.y, 0.35);
  float e = length(p);
  float ang = atan(p.y, p.x);
  float m = uMix;
  float rad = m * 1.95 + sin(ang * 5.0 + m * 7.0) * 0.035 * sin(m * 3.14159);
  float soft = 0.06;
  float k = 1.0 - smoothstep(rad - soft, rad, e);           // 1 dans le médaillon
  float edge = smoothstep(rad - 0.35, rad, e) * (1.0 - smoothstep(rad, rad + 0.25, e));
  vec2 dir = normalize(p + 1e-5);

  vec2 ca = c + dir * edge * 0.035 * sin(m * 3.14159);
  ca = (ca - 0.5) * (1.0 - 0.06 * m) + 0.5;                  // l'image courante recule
  vec3 colA = texture2D(uTex, cover(ca, uPlane, uImg)).rgb;
  vec2 cb = (c - 0.5) * (1.0 + 0.14 * (1.0 - m)) + 0.5;      // la suivante arrive légèrement zoomée
  cb -= dir * edge * 0.02;
  vec3 colB = texture2D(uTex2, cover(cb, uPlane, uImg2)).rgb;
  vec3 col = mix(colA, colB, k * step(0.0001, m));
  col += vec3(1.0, 0.96, 0.88) * edge * 0.12 * sin(m * 3.14159); // liseré lumineux, couleur Dolce

  col *= 1.0 - uScroll * 0.4; // le hero s'assombrit en sortant de l'écran
  vec2 q = (vUv - 0.5) * uPlane;
  float a = 1.0 - smoothstep(-1.0, 0.5, sdRound(q, uPlane * 0.5, uRadius));
  gl_FragColor = vec4(col, a * oval(vUv, uPlane, uReveal) * uLoaded);
}
`;

export const flowFragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform float uAspect;
uniform float uFalloff;
uniform float uAlpha;
uniform float uDissipation;
varying vec2 vUv;
void main() {
  vec4 color = texture2D(tMap, vUv) * uDissipation;
  vec2 cursor = vUv - uMouse;
  cursor.x *= uAspect;
  vec3 stamp = vec3(uVelocity * vec2(1.0, -1.0), 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
  float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;
  color.rgb = mix(color.rgb, stamp, vec3(falloff));
  gl_FragColor = color;
}
`;

export const quadVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const followVertex = /* glsl */ `
uniform vec2 uVelocity;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // Légère inclinaison selon la vitesse du pointeur
  p.x += (uv.y - 0.5) * uVelocity.x * -0.006;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const followFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec2 uPlane;
uniform float uAlpha;
uniform float uSwap;
varying vec2 vUv;
${common}
void main() {
  vec2 c = (vUv - 0.5) * (1.0 - 0.1 * uSwap) + 0.5;
  vec3 col = texture2D(uTex, cover(c, uPlane, uImg)).rgb;
  // Le médaillon : un ovale plein
  vec2 q = (vUv - 0.5) * 2.0;
  float aa = 2.0 / uPlane.x;
  float shape = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, length(q));
  gl_FragColor = vec4(col, shape * oval(vUv, uPlane, uAlpha));
}
`;
