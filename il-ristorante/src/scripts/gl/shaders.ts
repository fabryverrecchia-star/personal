// Shaders GLSL. Les plans sont exprimés en pixels : 1 unité = 1 px à l'écran.

const noise = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

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
`;

export const mediaVertex = /* glsl */ `
uniform float uVel;
uniform float uHover;
uniform vec2 uViewport;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  // Courbure au défilement : le centre du plan prend du retard
  float bend = clamp(uVel, -60.0, 60.0);
  w.y += sin(uv.x * 3.14159) * bend * 0.9;
  w.y += cos(w.x / uViewport.x * 3.14159) * bend * 0.6;
  // Léger relief au survol
  w.z += sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * uHover * 24.0;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const mediaFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec2 uPlane;
uniform vec2 uMouse;
uniform vec4 uRadius;
uniform vec3 uTint;
uniform float uReveal;
uniform float uHover;
uniform float uTime;
uniform float uVel;
uniform float uLoaded;
varying vec2 vUv;
${noise}
${common}
void main() {
  float zoom = 1.0 - 0.07 * uHover - 0.18 * (1.0 - uReveal);
  vec2 c = (vUv - 0.5) * zoom + 0.5;

  // Ondulation autour du pointeur
  vec2 d = vUv - uMouse;
  float dist = length(d * vec2(uPlane.x / uPlane.y, 1.0));
  c += normalize(d + 1e-4) * sin(dist * 26.0 - uTime * 3.2) * 0.007 * uHover * smoothstep(0.5, 0.0, dist);

  vec2 uv = cover(c, uPlane, uImg);
  float shift = clamp(uVel, -60.0, 60.0) * 0.0004 + uHover * 0.0025;
  vec3 col = vec3(
    texture2D(uTex, uv + vec2(0.0, shift)).r,
    texture2D(uTex, uv).g,
    texture2D(uTex, uv - vec2(0.0, shift)).b
  );

  // Révélation par le bas, bord organique, liseré de couleur de marque
  float n = noise(vUv * vec2(3.5, 2.0) + uTime * 0.12) * 0.28;
  float edge = uReveal * 1.45 - 0.15;
  float y = vUv.y + n;
  float m = 1.0 - smoothstep(edge - 0.02, edge, y);
  float band = smoothstep(edge - 0.16, edge - 0.02, y) * step(uReveal, 0.999);
  col = mix(col, uTint, band);

  vec2 p = (vUv - 0.5) * uPlane;
  float a = 1.0 - smoothstep(-1.0, 0.5, sdRound(p, uPlane * 0.5, uRadius));
  gl_FragColor = vec4(col, m * a * uLoaded);
}
`;

export const heroFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uFlow;
uniform vec2 uImg;
uniform vec2 uPlane;
uniform vec2 uResolution;
uniform vec3 uTint;
uniform float uReveal;
uniform float uScroll;
uniform float uTime;
uniform float uLoaded;
varying vec2 vUv;
${noise}
${common}
void main() {
  vec2 screen = gl_FragCoord.xy / uResolution;
  vec2 flow = texture2D(uFlow, screen).rg;

  // Entrée : léger dézoom ; défilement : parallaxe et zoom
  float zoom = 1.0 - 0.22 * (1.0 - uReveal) - 0.1 * uScroll;
  vec2 c = (vUv - 0.5) * zoom + 0.5;
  c.y += uScroll * 0.12;
  c += vec2(noise(vUv * 2.0 + uTime * 0.05) - 0.5) * 0.004;
  c -= flow * 0.07;

  vec2 uv = cover(c, uPlane, uImg);
  float s = length(flow) * 0.03;
  vec3 col = vec3(
    texture2D(uTex, uv + flow * s).r,
    texture2D(uTex, uv).g,
    texture2D(uTex, uv - flow * s).b
  );
  col *= 1.0 - uScroll * 0.45;

  // Révélation en vague diagonale
  float n = noise(vUv * vec2(2.5, 1.5) + uTime * 0.1) * 0.3;
  float edge = uReveal * 1.7 - 0.2;
  float y = vUv.y * 0.75 + (1.0 - vUv.x) * 0.25 + n;
  float m = 1.0 - smoothstep(edge - 0.02, edge, y);
  float band = smoothstep(edge - 0.2, edge - 0.02, y) * step(uReveal, 0.999);
  col = mix(col, uTint, band);
  gl_FragColor = vec4(col, m * uLoaded);
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
  // Inclinaison selon la vitesse du pointeur
  p.x += (uv.y - 0.5) * uVelocity.x * -0.0014;
  p.y += sin(uv.x * 3.14159) * uVelocity.y * -0.001;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const followFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec2 uPlane;
uniform vec2 uVelocity;
uniform float uAlpha;
uniform float uSwap;
varying vec2 vUv;
${common}
void main() {
  vec2 c = (vUv - 0.5) * (1.0 - 0.12 * uSwap) + 0.5;
  vec2 uv = cover(c, uPlane, uImg);
  vec2 sh = uVelocity * 0.0015;
  vec3 col = vec3(texture2D(uTex, uv + sh).r, texture2D(uTex, uv).g, texture2D(uTex, uv - sh).b);
  vec2 p = (vUv - 0.5) * uPlane;
  float r = uPlane.x * 0.5;
  float a = 1.0 - smoothstep(-1.0, 0.5, sdRound(p, uPlane * 0.5, vec4(r, 8.0, r, 8.0)));
  // Apparition en iris
  float iris = 1.0 - smoothstep(uAlpha * 0.9 - 0.05, uAlpha * 0.9, length((vUv - 0.5) * vec2(1.0, uPlane.y / uPlane.x)));
  gl_FragColor = vec4(col, a * iris);
}
`;
