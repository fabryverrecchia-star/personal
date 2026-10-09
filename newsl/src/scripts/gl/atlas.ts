import * as THREE from 'three';

// ------------------------------------------------------------------
// Carte du monde en points (Web Mercator), du Triangle d'or au monde.
// Les positions sont exprimées en radians Mercator, relatives à Paris,
// pour garder la précision du float32 au niveau de la rue.
// ------------------------------------------------------------------

const D2R = Math.PI / 180;
const ORIGIN = { lon: 2.3376, lat: 48.8606 };

export const mercX = (lon: number) => (lon - ORIGIN.lon) * D2R;
const mercYabs = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2));
const ORIGIN_Y = mercYabs(ORIGIN.lat);
export const mercY = (lat: number) => mercYabs(lat) - ORIGIN_Y;
export const invMercY = (y: number) => (2 * Math.atan(Math.exp(y + ORIGIN_Y)) - Math.PI / 2) / D2R;

export interface View {
  lon: number;
  lat: number;
  /** Étendue visible (en degrés de longitude) sur la plus petite dimension de l'écran */
  span: number;
}

const vertex = /* glsl */ `
attribute float aSpacing;
attribute float aEdge;
attribute float aSeed;
uniform vec2 uCenter;
uniform float uScale;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
varying float vAlpha;
void main(){
  vec2 p = (position.xy - uCenter) * uScale;
  gl_Position = vec4(p / (uRes * 0.5), 0.0, 1.0);
  // Niveau de détail : un niveau n'apparaît que si ses points sont espacés de 3 à 50 px
  float ps = aSpacing * uScale;
  float lod = smoothstep(3.0, 7.0, ps) * (1.0 - smoothstep(30.0, 60.0, ps));
  float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 40.0);
  vAlpha = lod * aEdge * twinkle;
  gl_PointSize = clamp(ps * 0.28, 1.8, 3.6) * uDpr;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = 1.0 - smoothstep(0.32, 0.5, d);
  gl_FragColor = vec4(uColor * a * vAlpha, a * vAlpha);
}
`;

interface Region {
  lon: [number, number];
  lat: [number, number];
  fade: number;
}

// Rectangles des niveaux précalculés (scripts/build-map.mjs) : fondu sur les bords
const FILE_LEVELS: { step: number; region?: Region }[] = [
  { step: 1.6 },
  { step: 0.42, region: { lon: [-12, 62], lat: [22, 62], fade: 5 } },
  { step: 0.11, region: { lon: [-5.5, 19], lat: [36, 51.6], fade: 1.6 } },
];

// Niveaux « ville » générés ici : disques de points autour de l'Île-de-France, de Paris et du VIIIe
const CITY_LEVELS = [
  { lon: 2.6, lat: 48.75, radius: 1.5, step: 0.017 },
  { lon: 2.3376, lat: 48.8606, radius: 0.24, step: 0.0035 },
  { lon: 2.3085, lat: 48.8685, radius: 0.034, step: 0.0006 },
];

export class Atlas {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  material: THREE.ShaderMaterial;
  width = 1;
  height = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    data: ArrayBuffer,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true });
    this.renderer.setClearColor(0x000000, 0);

    const pos: number[] = [];
    const spacing: number[] = [];
    const edge: number[] = [];
    const seed: number[] = [];
    const push = (lon: number, lat: number, step: number, e: number) => {
      pos.push(mercX(lon), mercY(lat), 0);
      spacing.push(step * D2R);
      edge.push(e);
      seed.push(Math.random());
    };

    // Niveaux précalculés (terres)
    const counts = new Uint32Array(data, 0, 3);
    const pts = new Int16Array(data, 12);
    let k = 0;
    FILE_LEVELS.forEach(({ step, region }, level) => {
      for (let i = 0; i < counts[level]; i++, k += 2) {
        const lon = pts[k] / 100;
        const lat = pts[k + 1] / 100;
        let e = 1;
        if (region) {
          const d = Math.min(lon - region.lon[0], region.lon[1] - lon, lat - region.lat[0], region.lat[1] - lat);
          e = Math.min(1, Math.max(0, d / region.fade));
        }
        push(lon, lat, step, e);
      }
    });

    // Niveaux ville : disques de points (grille en quinconce, espacement
    // vertical corrigé pour rester régulier en projection Mercator)
    for (const c of CITY_LEVELS) {
      const k = Math.cos(c.lat * D2R);
      const latStep = c.step * 0.866 * k;
      const lonRadius = c.radius / k;
      let row = 0;
      for (let lat = c.lat - c.radius; lat <= c.lat + c.radius; lat += latStep, row++) {
        for (let lon = c.lon - lonRadius + (row % 2) * c.step * 0.5; lon <= c.lon + lonRadius; lon += c.step) {
          const d = Math.hypot((lon - c.lon) * k, lat - c.lat) / c.radius;
          if (d > 1) continue;
          const e = 1 - Math.max(0, (d - 0.5) / 0.5);
          push(lon, lat, c.step, e * e);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aSpacing', new THREE.Float32BufferAttribute(spacing, 1));
    geo.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
      uniforms: {
        uCenter: { value: new THREE.Vector2() },
        uScale: { value: 1 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uDpr: { value: 1 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#e2c99a') },
      },
    });
    const points = new THREE.Points(geo, this.material);
    points.frustumCulled = false;
    this.scene.add(points);
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, r.width);
    this.height = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.material.uniforms.uRes.value.set(this.width, this.height);
    this.material.uniforms.uDpr.value = dpr;
  }

  /** Pixels par radian Mercator pour une vue donnée */
  scaleFor(view: View) {
    return Math.min(this.width, this.height) / (view.span * D2R);
  }

  /** Position écran (px, origine en haut à gauche) d'un point géographique */
  project(view: View, lon: number, lat: number) {
    const s = this.scaleFor(view);
    return {
      x: this.width / 2 + (mercX(lon) - mercX(view.lon)) * s,
      y: this.height / 2 - (mercY(lat) - mercY(view.lat)) * s,
    };
  }

  setColor(hex: string) {
    this.material.uniforms.uColor.value.set(hex);
  }

  render(view: View, time: number) {
    const u = this.material.uniforms;
    u.uCenter.value.set(mercX(view.lon), mercY(view.lat));
    u.uScale.value = this.scaleFor(view);
    u.uTime.value = time;
    this.renderer.render(this.scene, this.camera);
  }
}
