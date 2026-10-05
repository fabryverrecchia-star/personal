// ------------------------------------------------------------------
// GLSL partagé
// ------------------------------------------------------------------

/** Bruit simplex 3D (Ashima Arts / Stefan Gustavson, licence MIT) + fbm */
export const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*snoise(p); p*=2.02; a*=0.5; }
  return v;
}
`;

/** UV « object-fit: cover » */
const cover = /* glsl */ `
vec2 coverUv(vec2 uv, vec2 plane, vec2 img){
  float rp = plane.x / plane.y;
  float ri = img.x / img.y;
  vec2 s = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
`;

// ------------------------------------------------------------------
// Fond « velours » : plein écran, espace clip
// ------------------------------------------------------------------
export const bgVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const bgFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uTone;
uniform float uAudio;
uniform vec2 uMouse;
uniform float uIntro;
varying vec2 vUv;
${noise}
void main(){
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.035;

  // Domaine déformé (Inigo Quilez) : plis de velours lents
  vec2 q = vec2(fbm(vec3(p * 1.1, t)), fbm(vec3(p * 1.1 + 5.2, t)));
  vec2 r = vec2(
    fbm(vec3(p * 1.3 + 3.5 * q + vec2(1.7, 9.2), t * 1.4)),
    fbm(vec3(p * 1.3 + 3.5 * q + vec2(8.3, 2.8), t * 1.4))
  );
  float f = fbm(vec3(p * 1.5 + 3.5 * r, t * 1.8 + uAudio * 0.15));

  vec3 ink = vec3(0.027, 0.035, 0.031);
  vec3 gold = vec3(0.78, 0.64, 0.42);

  float body = smoothstep(-0.25, 0.85, f);
  vec3 col = mix(ink, uTone, body * 0.95);

  // Reflets dorés dans les creux du tissu
  float sheen = pow(clamp(length(r) * 0.9, 0.0, 1.0), 3.0);
  col += gold * sheen * (0.12 + uAudio * 0.35);

  // Plis verticaux discrets (rideau)
  float folds = sin(p.x * 11.0 + f * 5.0 + t * 3.0) * 0.5 + 0.5;
  col *= 0.86 + 0.24 * pow(folds, 4.0);

  // Halo sous la souris
  vec2 m = uMouse * 0.5 * vec2(uRes.x / uRes.y, 1.0);
  float glow = smoothstep(0.75, 0.0, length(p - m));
  col += mix(uTone, gold, 0.35) * glow * 0.18;

  // Vignette + intro
  col *= smoothstep(1.3, 0.15, length(p * vec2(0.9, 1.1)));
  col *= uIntro;

  gl_FragColor = vec4(col, 1.0);
}
`;

// ------------------------------------------------------------------
// Poussière dorée (points, espace clip)
// ------------------------------------------------------------------
export const dustVertex = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uAudio;
uniform float uPixel;
uniform float uScroll;
varying float vAlpha;
void main(){
  float speed = 0.012 + aSeed.z * 0.03;
  float y = fract(aSeed.y + uTime * speed + uScroll * (0.2 + aSeed.z * 0.6)) * 2.4 - 1.2;
  float x = aSeed.x * 2.2 - 1.1 + sin(uTime * 0.3 + aSeed.y * 12.0) * 0.03;
  gl_Position = vec4(x, y, 0.0, 1.0);
  float twinkle = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed.z * 3.0) + aSeed.x * 40.0);
  gl_PointSize = (1.0 + aSeed.z * 2.6) * uPixel * (1.0 + uAudio * 1.6);
  vAlpha = (0.15 + 0.6 * twinkle) * (0.35 + aSeed.z * 0.65) * (0.6 + uAudio);
}
`;

export const dustFragment = /* glsl */ `
precision highp float;
uniform float uIntro;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.89, 0.79, 0.6) * a * vAlpha * uIntro, a * vAlpha * uIntro);
}
`;

// ------------------------------------------------------------------
// Médias synchronisés au DOM
// ------------------------------------------------------------------
export const mediaVertex = /* glsl */ `
uniform vec2 uBend;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
const float PI = 3.141592653589793;
void main(){
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  // Courbure selon la vitesse de défilement
  world.y -= sin(uv.x * PI) * uBend.y;
  world.x -= sin(uv.y * PI) * uBend.x;
  // Bombé au survol
  world.z += sin(uv.x * PI) * sin(uv.y * PI) * uHover * 36.0;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const mediaFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uPlane;
uniform vec2 uImage;
uniform float uReveal;
uniform float uHover;
uniform float uShift;
uniform float uTime;
uniform float uAlpha;
varying vec2 vUv;
${noise}
${cover}
void main(){
  vec2 uv = coverUv(vUv, uPlane, uImage);
  float zoom = 1.0 - 0.07 * uHover - 0.18 * (1.0 - uReveal);
  uv = (uv - 0.5) * zoom + 0.5;

  // Ondulation légère au survol
  uv += vec2(snoise(vec3(vUv * 3.0, uTime * 0.4))) * 0.006 * uHover;

  float s = uShift;
  vec3 col;
  col.r = texture2D(uTex, uv + vec2(s, 0.0)).r;
  col.g = texture2D(uTex, uv).g;
  col.b = texture2D(uTex, uv - vec2(s, 0.0)).b;

  // Étalonnage : contraste doux, ombres vers le vert sapin
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, col * vec3(0.92, 1.0, 0.95), (1.0 - lum) * 0.35);
  col = mix(vec3(lum), col, 0.92 + 0.08 * uHover);

  // Révélation par le bas, bord bruité et liseré doré
  float n = snoise(vec3(vUv * 2.6, uTime * 0.15)) * 0.5 + 0.5;
  float d = (1.0 - vUv.y) * 0.7 + n * 0.3;
  float p = uReveal * 1.2 - 0.1;
  float mask = smoothstep(d - 0.06, d + 0.06, p);
  float edge = mask * (1.0 - mask) * 4.0;
  col += vec3(0.85, 0.66, 0.38) * edge * 0.9;

  // Vignette
  col *= 0.82 + 0.18 * smoothstep(0.9, 0.2, length(vUv - 0.5));

  float a = mask * uAlpha;
  gl_FragColor = vec4(col * a, a);
}
`;

// ------------------------------------------------------------------
// Vidéo d'ouverture
// ------------------------------------------------------------------
export const heroVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const heroFragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uPlane;
uniform vec2 uImage;
uniform float uTime;
uniform float uIntro;
uniform float uScroll;
uniform float uAudio;
uniform vec2 uMouse;
uniform float uMouseForce;
uniform float uShift;
varying vec2 vUv;
${noise}
${cover}
void main(){
  vec2 aspect = vec2(uPlane.x / uPlane.y, 1.0);
  vec2 uv = coverUv(vUv, uPlane, uImage);

  // Zoom lent + recul au défilement
  uv = (uv - 0.5) * (1.12 - 0.12 * uIntro - uScroll * 0.1) + 0.5;

  // Respiration du velours, amplifiée par la musique
  float n = snoise(vec3(vUv * 2.2, uTime * 0.25));
  uv += vec2(n, snoise(vec3(vUv * 2.2 + 7.0, uTime * 0.25))) * (0.004 + uAudio * 0.012);

  // Ondes sous la souris
  vec2 mp = (vUv - uMouse) * aspect;
  float md = length(mp);
  float ripple = sin(md * 46.0 - uTime * 5.0) * smoothstep(0.42, 0.0, md);
  uv += normalize(mp + 1e-5) * ripple * 0.0045 * uMouseForce;

  float s = uShift + uScroll * 0.012 + uAudio * 0.002;
  vec3 col;
  col.r = texture2D(uTex, uv + vec2(s, 0.0)).r;
  col.g = texture2D(uTex, uv).g;
  col.b = texture2D(uTex, uv - vec2(s, 0.0)).b;

  // Étalonnage maison : noirs verts, hautes lumières dorées
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 forest = vec3(0.04, 0.09, 0.07);
  vec3 bordeaux = vec3(0.36, 0.07, 0.12);
  vec3 gold = vec3(0.95, 0.8, 0.58);
  vec3 grade = lum < 0.5 ? mix(forest, bordeaux, lum * 2.0) : mix(bordeaux, gold, lum * 2.0 - 1.0);
  col = mix(col, grade, 0.38);
  col *= 0.86;

  // Lisibilité du texte : haut et bas assombris
  col *= mix(0.45, 1.0, smoothstep(0.0, 0.35, vUv.y));
  col *= mix(0.62, 1.0, smoothstep(1.0, 0.72, vUv.y));
  col *= smoothstep(1.35, 0.25, length((vUv - 0.5) * aspect * 0.9));

  // Sortie : on s'enfonce dans le noir
  col *= 1.0 - uScroll * 0.75;

  // Entrée : ouverture circulaire au bord bruité
  float r = length((vUv - 0.5) * aspect);
  float edgeN = snoise(vec3(vUv * 4.0, uTime * 0.3)) * 0.08;
  float open = smoothstep(r - 0.05, r + 0.05, uIntro * 1.25 + edgeN);
  col *= open;
  col += vec3(0.85, 0.66, 0.38) * open * (1.0 - open) * 2.0;

  gl_FragColor = vec4(col, open);
}
`;
