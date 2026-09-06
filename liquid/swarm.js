/* =========================================================================
   The sheet — the whole screen is liquid metal. Every shape is a signed
   distance field; moving between shapes is a smooth blend of two fields, so
   the metal flows from one form to the next as one continuous surface.

     setBlend(a, b, t)   scroll-driven: t of the way from shape a to b
     setShape(name, dur) timed morph (load-in, hover overrides)
   window.createSwarm(container, options) -> api
   ========================================================================= */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const HE = 1.7;            // half-extent of shape space, world units
const MASK = 1024;         // drawing resolution
const SDF = 512;           // distance-field resolution
const RANGE = 3.0;         // clamp for stored distances, shape units
const DROPS = 24, BARS = 26;

/* ---------- 3d shape builders (rendered once as silhouettes) ---------- */
function merged(parts) {
  const geos = parts.map(([geo, pos = [0, 0, 0], rot = [0, 0, 0]]) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(1, 1, 1)));
    for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
    return g;
  });
  return BufferGeometryUtils.mergeGeometries(geos, false);
}
const GEOS = {
  keycaps() {
    const parts = [];
    for (let i = 0; i < 5; i++) parts.push([new RoundedBoxGeometry(0.46, 0.34, 0.46, 3, 0.09), [(i - 2) * 0.66, 0.14, -0.1], [-0.35, 0, 0]]);
    parts.push([new RoundedBoxGeometry(2.6, 0.3, 0.46, 3, 0.09), [0, -0.42, 0.42], [-0.35, 0, 0]]);
    return merged(parts);
  },
  car() {
    const wheel = () => new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24);
    return merged([
      [new RoundedBoxGeometry(2.0, 0.42, 1.1, 3, 0.08), [0, 0.05, 0]], [new RoundedBoxGeometry(0.9, 0.4, 0.9, 3, 0.08), [-0.15, 0.42, 0]],
      [new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), [0.55, 0.55, 0]], [new THREE.SphereGeometry(0.11, 12, 10), [0.55, 0.88, 0]],
      [wheel(), [0.65, -0.18, 0.55], [Math.PI / 2, 0, 0]], [wheel(), [-0.65, -0.18, 0.55], [Math.PI / 2, 0, 0]],
      [wheel(), [0.65, -0.18, -0.55], [Math.PI / 2, 0, 0]], [wheel(), [-0.65, -0.18, -0.55], [Math.PI / 2, 0, 0]],
    ]);
  },
  sub() {
    return merged([
      [new THREE.CapsuleGeometry(0.42, 1.9, 6, 24), [0, 0, 0], [0, 0, Math.PI / 2]], [new RoundedBoxGeometry(0.6, 0.4, 0.34, 3, 0.06), [0.15, 0.55, 0]],
      [new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), [0.05, 0.95, 0]], [new THREE.BoxGeometry(0.06, 0.5, 1.1), [-1.1, 0, 0]], [new THREE.BoxGeometry(0.06, 0.9, 0.5), [-1.1, 0, 0]],
      [new THREE.TorusGeometry(0.22, 0.04, 8, 24), [-1.42, 0, 0], [0, Math.PI / 2, 0]],
      [new THREE.BoxGeometry(0.02, 0.4, 0.1), [-1.42, 0, 0], [Math.PI / 4, 0, 0]], [new THREE.BoxGeometry(0.02, 0.4, 0.1), [-1.42, 0, 0], [-Math.PI / 4, 0, 0]],
    ]);
  },
};

/* the voice: bar heights follow a spoken-word envelope and keep moving */
const waveEnv = (b) => { const t = b / (BARS - 1); return 0.12 + 0.88 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.7); };
const waveLive = (b, time) => 0.55 + 0.45 * Math.sin(time * 2.7 + b * 0.63 + 0.9 * Math.sin(time * 1.3 + b * 0.21));
const WAVE_H = 1.3, WAVE_SP = 0.115;

/* ---------- 2d sources: a square canvas in shape space ---------- */
const PX = MASK / (2 * HE);
function shapeCanvas(draw) {
  const c = document.createElement("canvas"); c.width = c.height = MASK;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; draw(ctx);
  return c;
}
function drawText(text, font) {
  return (ctx) => {
    const lines = text.split("\n"), size = 0.5 * PX, lh = size * 1.02;
    ctx.font = font || `600 ${size}px Geist, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const top = MASK / 2 - (lh * lines.length) / 2;
    lines.forEach((l, i) => ctx.fillText(l, MASK / 2, top + lh * (i + 0.5)));
  };
}
function drawFn2d(fn) { return (ctx) => { const s = MASK * 0.86, o = (MASK - s) / 2; ctx.save(); ctx.translate(o, o); fn(ctx, s); ctx.restore(); }; }

/* ---------- signed distance fields (Felzenszwalb EDT) ---------- */
const INF = 1e12;
function edt1d(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function edt2d(grid, n) {
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < n; x++) { for (let y = 0; y < n; y++) f[y] = grid[y * n + x]; edt1d(f, n, d, v, z); for (let y = 0; y < n; y++) grid[y * n + x] = d[y]; }
  for (let y = 0; y < n; y++) { for (let x = 0; x < n; x++) f[x] = grid[y * n + x]; edt1d(f, n, d, v, z); for (let x = 0; x < n; x++) grid[y * n + x] = d[x]; }
}
/* a small separable gaussian over a field: a transform from a grid leaves creases inside a shape
   (every step on a curved edge seeds one), and mirror shading would draw each crease as a line */
function blurField(f, n, sigma) {
  const R = Math.ceil(sigma * 2.5), k = new Float64Array(2 * R + 1); let ks = 0;
  for (let i = -R; i <= R; i++) { k[i + R] = Math.exp(-(i * i) / (2 * sigma * sigma)); ks += k[i + R]; }
  for (let i = 0; i < k.length; i++) k[i] /= ks;
  const tmp = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0; for (let i = -R; i <= R; i++) a += f[y * n + Math.min(n - 1, Math.max(0, x + i))] * k[i + R];
    tmp[y * n + x] = a;
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0; for (let i = -R; i <= R; i++) a += tmp[Math.min(n - 1, Math.max(0, y + i)) * n + x] * k[i + R];
    f[y * n + x] = a;
  }
}
/* alpha (w² rgba, box-filtered by `stride`) -> { tex (SDF² rgba half float, R = signed distance in shape units), shift, bounds }
   Coverage seeds the transforms, so partially covered texels start part-way (the edge lands where the
   anti-aliasing put it, not on the grid), and the finished field is softened by a texel or two. */
function fieldFromAlpha(alpha, stride, w) {
  const inside = new Float64Array(SDF * SDF), outside = new Float64Array(SDF * SDF);
  let n = 0, sx = 0, sy = 0, minx = SDF, maxx = 0, miny = SDF, maxy = 0;
  const inv = 1 / (255 * stride * stride);
  for (let y = 0; y < SDF; y++) for (let x = 0; x < SDF; x++) {
    let sum = 0;
    for (let yy = 0; yy < stride; yy++) for (let xx = 0; xx < stride; xx++) sum += alpha[((y * stride + yy) * w + x * stride + xx) * 4 + 3];
    const a = sum * inv, i = y * SDF + x;
    outside[i] = a >= 0.999 ? 0 : a <= 0.001 ? INF : Math.max(0, 0.5 - a) ** 2;
    inside[i] = a >= 0.999 ? INF : a <= 0.001 ? 0 : Math.max(0, a - 0.5) ** 2;
    if (a > 0.5) { n++; sx += x; sy += y; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  }
  edt2d(inside, SDF); edt2d(outside, SDF);
  const field = new Float32Array(SDF * SDF);
  for (let i = 0; i < SDF * SDF; i++) field[i] = Math.sqrt(outside[i]) - Math.sqrt(inside[i]);   // texels; + outside, − inside
  blurField(field, SDF, 1.8);
  const data = new Uint16Array(SDF * SDF * 4), unit = (2 * HE) / SDF, one = THREE.DataUtils.toHalfFloat(1);
  for (let i = 0; i < SDF * SDF; i++) {
    const v = THREE.DataUtils.toHalfFloat(Math.max(-RANGE, Math.min(RANGE, field[i] * unit)));
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = one;
  }
  const tex = new THREE.DataTexture(data, SDF, SDF, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.flipY = true; tex.needsUpdate = true;
  const cx = n ? sx / n : SDF / 2, cy = n ? sy / n : SDF / 2;
  const shift = [(cx - SDF / 2) * unit, -(cy - SDF / 2) * unit];   // centroid in shape units (y up)
  const bounds = n ? { x: Math.max(cx - minx, maxx - cx) * unit, y: Math.max(cy - miny, maxy - cy) * unit } : { x: 1, y: 1 };
  return { tex, shift, bounds };
}

const QUAD_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const SHEET_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tA, tB;
  uniform float uModeA, uModeB, uMix, uMelt, uEdgeA, uEdgeB;
  uniform vec2 uOff, uShiftA, uShiftB, uRes, uPtr;
  uniform float uScale, uHE, uRange, uHalfH, uAspect, uPtrS, uTime, uDark, uReveal;
  uniform vec3 uDrops[${DROPS}];
  uniform float uBars[${BARS}];
  varying vec2 vUv;
  vec2 world(vec2 uv){ return (uv * 2.0 - 1.0) * vec2(uHalfH * uAspect, uHalfH); }
  vec4 cubic(float v){ vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v; vec4 s = n * n * n; float x = s.x; float y = s.y - 4.0 * s.x; float z = s.z - 4.0 * s.y + 6.0 * s.x; float w = 6.0 - x - y - z; return vec4(x, y, z, w) * (1.0 / 6.0); }
  float sampleField(sampler2D t, vec2 uv){
    vec2 ts = vec2(${SDF}.0);
    vec2 p = uv * ts - 0.5; vec2 f = fract(p); p -= f;
    vec4 xc = cubic(f.x), yc = cubic(f.y);
    vec4 c = p.xxyy + vec2(-0.5, 1.5).xyxy;
    vec4 sw = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
    vec4 o = (c + vec4(xc.yw, yc.yw) / sw) / ts.xxyy;
    float s0 = texture2D(t, o.xz).r, s1 = texture2D(t, o.yz).r, s2 = texture2D(t, o.xw).r, s3 = texture2D(t, o.yw).r;
    float sx = sw.x / (sw.x + sw.y), sy = sw.z / (sw.z + sw.w);
    return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
  }
  float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
  // signed distance in world units, for one endpoint
  float sdfOf(float mode, sampler2D t, vec2 w, vec2 shift){
    if (mode > 2.5) {                       // the ball, analytic
      return (length((w - uOff) / uScale) - 1.0) * uScale;
    }
    if (mode > 1.5) {                       // the voice bars, analytic
      vec2 l = (w - uOff) / uScale;
      float d = 1e3;
      for (int b = 0; b < ${BARS}; b++) {
        float x = (float(b) - ${((BARS - 1) / 2).toFixed(1)}) * ${WAVE_SP.toFixed(3)};
        d = smin(d, sdRound(l - vec2(x, 0.0), vec2(0.04, uBars[b] * 0.5), 0.04), 0.04 + 0.10 * uMelt);
      }
      return d * uScale;
    }
    if (mode > 0.5) {                       // drops on the sheet, analytic, world space
      float d = 1e3;
      for (int i = 0; i < ${DROPS}; i++) d = smin(d, length(w - uDrops[i].xy) - uDrops[i].z, 0.06 + 0.12 * uMelt);
      return d;
    }
    vec2 l = (w - uOff) / uScale + shift;
    vec2 uv = l / uHE * 0.5 + 0.5;
    vec2 o = max(abs(l) - vec2(uHE), 0.0);
    float d = sampleField(t, clamp(uv, 0.0, 1.0)) + length(o);
    return d * uScale;
  }
  float waves(vec2 w){
    return 0.5 * sin(w.x * 1.6 + uTime * 0.45) * sin(w.y * 1.3 - uTime * 0.35) + 0.3 * sin(w.x * 3.1 - uTime * 0.3 + w.y * 1.1) + 0.15 * sin((w.x - w.y) * 5.3 + uTime * 0.7);
  }
  float height(vec2 uv){
    vec2 w = world(uv);
    float d = mix(sdfOf(uModeA, tA, w, uShiftA), sdfOf(uModeB, tB, w, uShiftB), uMix);
    // the edge profile: a tight bevel for type, a broad dome for objects; it widens while the metal moves
    float e = mix(uEdgeA, uEdgeB, uMix);
    float r = e * uScale + 0.05 * uMelt;
    float m = smoothstep(r, -r, d); m = m * m * (3.0 - 2.0 * m);
    float k = clamp(-d / r, 0.0, 1.0); float dome = sqrt(1.0 - (1.0 - k) * (1.0 - k));
    float dm = smoothstep(0.08, 0.25, e);       // 0 = stamped type, 1 = a ball
    m = mix(m, dome, dm) * (1.0 + 7.0 * dm * dm);
    float dent = uPtrS * exp(-dot(w - uPtr, w - uPtr) * 60.0);
    // a faint ring runs out from the shape while it changes
    float ring = uMelt * 0.025 * sin(d * 7.0 - uTime * 2.5) * exp(-max(d, 0.0) * 1.8);
    return waves(w) * 0.13 * uReveal + m * (0.5 - 0.12 * uMelt) + ring - dent * 0.3;
  }
  float band(float x, float c, float w){ return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x)); }
  void main(){
    vec2 px = 1.0 / uRes;
    float h = height(vUv);
    float dx = height(vUv + vec2(px.x, 0.0)) - height(vUv - vec2(px.x, 0.0));
    float dy = height(vUv + vec2(0.0, px.y)) - height(vUv - vec2(0.0, px.y));
    vec3 n = normalize(vec3(-dx * 42.0, -dy * 42.0, 1.0));
    vec3 v = normalize(vec3((0.5 - vUv.x) * 0.38 * uAspect, (0.5 - vUv.y) * 0.38, 1.0));
    vec3 r = reflect(-v, n);
    float t = clamp((r.y + 0.30) * 0.5 + 0.5, 0.0, 1.0), u = r.x * 0.5 + 0.5;
    float floorL = mix(0.14, 0.03, uDark), skyL = mix(0.88, 0.44, uDark);
    float env = mix(floorL, skyL, smoothstep(0.32, 0.56, t));
    env += band(t, 0.74, 0.09) * mix(0.30, 0.34, uDark);
    env += band(t, 0.90, 0.04) * 0.12;
    env -= band(t, 0.42, 0.016) * 0.6;
    env += band(u, 0.14, 0.07) * 0.06 + band(u, 0.88, 0.05) * 0.10;
    vec3 col = vec3(env) * vec3(0.90, 0.93, 0.98);
    float fres = pow(1.0 - max(n.z, 0.0), 3.0);
    col = mix(col, vec3(0.02, 0.02, 0.03), fres * 0.45);
    vec3 L1 = normalize(vec3(-0.4, 0.8, 0.5)), L2 = normalize(vec3(0.6, -0.4, 0.7));
    col += pow(max(dot(normalize(L1 + v), n), 0.0), 140.0) * 1.3;
    col += pow(max(dot(normalize(L2 + v), n), 0.0), 60.0) * 0.35;
    col *= 0.9 + 0.3 * smoothstep(0.02, 0.5, h);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSwarm(container, options = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.5);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0, 5.2);
  const halfH = camera.position.z * Math.tan((camera.fov / 2) * Math.PI / 180);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const empty = new THREE.DataTexture(new Uint16Array([THREE.DataUtils.toHalfFloat(3), 0, 0, THREE.DataUtils.toHalfFloat(1)]), 1, 1, THREE.RGBAFormat, THREE.HalfFloatType); empty.needsUpdate = true;
  const drops = []; for (let i = 0; i < DROPS; i++) drops.push(new THREE.Vector3(0, 0, 0));
  const U = {
    tA: { value: empty }, tB: { value: empty }, uModeA: { value: 1 }, uModeB: { value: 1 }, uMix: { value: 0 }, uMelt: { value: 0 }, uEdgeA: { value: 0.05 }, uEdgeB: { value: 0.05 },
    uOff: { value: new THREE.Vector2() }, uShiftA: { value: new THREE.Vector2() }, uShiftB: { value: new THREE.Vector2() },
    uRes: { value: new THREE.Vector2(2, 2) }, uPtr: { value: new THREE.Vector2(99, 99) }, uPtrS: { value: 0 },
    uScale: { value: 1 }, uHE: { value: HE }, uRange: { value: RANGE }, uHalfH: { value: halfH }, uAspect: { value: 1 },
    uTime: { value: 0 }, uDark: { value: 1 }, uReveal: { value: 1 },
    uDrops: { value: drops }, uBars: { value: new Float32Array(BARS) },
  };
  const sheet = new THREE.Scene();
  sheet.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: QUAD_VERT, fragmentShader: SHEET_FRAG, depthWrite: false, depthTest: false })));

  /* silhouettes for the 3d shapes: rendered once into a mask target, read back, turned into a field */
  const maskRT = new THREE.WebGLRenderTarget(SDF, SDF, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 });
  const maskCam = new THREE.OrthographicCamera(-HE, HE, HE, -HE, 0.1, 20); maskCam.position.set(0, 0, 8);
  const maskScene = new THREE.Scene();
  const maskMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff })); maskScene.add(maskMesh);

  let w = 0, h = 0, aspect = 1;
  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh; aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    U.uRes.value.set(w * dpr, h * dpr); U.uAspect.value = aspect;
    scatterDrops();
  }
  function scatterDrops() {
    for (let i = 0; i < DROPS; i++) drops[i].set((Math.random() * 2 - 1) * halfH * aspect * 0.95, (Math.random() * 2 - 1) * halfH * 0.9, 0.06 + Math.random() * 0.06);
  }

  /* ---------- shapes ---------- */
  const cache = {};
  function fieldFromCanvas(c) { const a = c.getContext("2d").getImageData(0, 0, MASK, MASK).data; return fieldFromAlpha(a, MASK / SDF, MASK); }
  function shape(name) {
    if (cache[name]) return cache[name];
    let s;
    if (name === "field") s = { mode: 1, bounds: { x: 1, y: 1 }, fixed: true, shift: [0, 0], tex: empty, edge: 0.06 };
    else if (name === "sphere") s = { mode: 3, bounds: { x: 1, y: 1 }, shift: [0, 0], tex: empty, edge: 1.0 };   // a ball, analytic
    else if (name === "wave") s = { mode: 2, bounds: { x: (BARS / 2) * WAVE_SP, y: WAVE_H * 0.5 }, shift: [0, 0], tex: empty, edge: 0.05 };
    else if (GEOS[name]) {
      maskMesh.geometry = GEOS[name](); if (name === "keycaps") maskMesh.rotation.set(0.55, 0, 0); else maskMesh.rotation.set(0.35, -0.6, 0);
      renderer.setRenderTarget(maskRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(maskScene, maskCam); renderer.setRenderTarget(null);
      const buf = new Uint8Array(SDF * SDF * 4); renderer.readRenderTargetPixels(maskRT, 0, 0, SDF, SDF, buf);
      // readback is bottom-up; flip so it reads like a canvas (top-down) before the field is built
      const flipped = new Uint8Array(SDF * SDF * 4);
      for (let y = 0; y < SDF; y++) flipped.set(buf.subarray((SDF - 1 - y) * SDF * 4, (SDF - y) * SDF * 4), y * SDF * 4);
      for (let i = 0; i < SDF * SDF; i++) flipped[i * 4 + 3] = flipped[i * 4]; // brightness -> alpha
      s = { mode: 0, ...fieldFromAlpha(flipped, 1, SDF), edge: name === "keycaps" ? 0.08 : 0.16 };
    } else {
      let canvas;
      if (name.startsWith("text:")) canvas = shapeCanvas(drawText(name.slice(5), options.textFont));
      else if (name.startsWith("draw:")) { const fn = window.SHAPES2D && window.SHAPES2D[name.slice(5)]; canvas = shapeCanvas(fn ? drawFn2d(fn) : () => {}); }
      else if (name.startsWith("logo:")) { const L = window.LOGOS && window.LOGOS[name.slice(5)]; canvas = shapeCanvas(L && window.logoDrawer ? drawFn2d(window.logoDrawer(L.d)) : () => {}); }
      else return shape("sphere");
      s = { mode: 0, ...fieldFromCanvas(canvas), edge: name.startsWith("text:") ? 0.042 : 0.055 };
    }
    return (cache[name] = s);
  }

  /* ---------- morph state ---------- */
  let fromName = "field", toName = "field", fromB = { x: 1, y: 1 }, toB = { x: 1, y: 1 }, fixed = true;
  let morphT = 1, morphDur = 1.2, driven = false, override = null, pending = null;
  let targetScale = 1, curScale = 1, time = 0;
  let fit = { fill: options.fill ?? 0.8, fillX: options.fillX ?? 0.86 };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function bind() {
    const A = shape(fromName), B = shape(toName);
    U.tA.value = A.tex; U.uModeA.value = A.mode; U.uShiftA.value.set(A.shift[0], A.shift[1]); U.uEdgeA.value = A.edge ?? 0.05;
    U.tB.value = B.tex; U.uModeB.value = B.mode; U.uShiftB.value.set(B.shift[0], B.shift[1]); U.uEdgeB.value = B.edge ?? 0.05;
    fromB = A.bounds; toB = B.bounds; fixed = !!B.fixed;
  }
  function setShape(name, dur = 1.2) {
    // freeze the current blend as a new "from": if mid-morph, keep whichever endpoint we're closer to
    fromName = morphT < 0.5 && driven ? fromName : toName;
    toName = name; morphT = 0; morphDur = dur; driven = false; bind();
  }
  function setBlend(a, b, t) {
    if (override) { pending = [a, b, t]; return; }
    if (a !== fromName || b !== toName) { fromName = a; toName = b; bind(); }
    morphT = Math.min(1, Math.max(0, t)); driven = true;
  }
  function setOverride(name, dur = 0.9) { if (!override) pending = driven ? [fromName, toName, morphT] : null; override = name; setShape(name, dur); }
  function clearOverride(dur = 0.9) {
    if (!override) return;
    override = null;
    if (pending) { const p = pending; pending = null; setShape(p[2] < 0.5 ? p[0] : p[1], dur); setTimeout(() => { if (!override) { fromName = "~"; setBlend(p[0], p[1], p[2]); } }, dur * 1000 + 50); }
  }
  function fitNow() {
    if (fixed) { targetScale = 1; return; }
    const e = ease(morphT), bx = fromB.x + (toB.x - fromB.x) * e, by = fromB.y + (toB.y - fromB.y) * e;
    targetScale = Math.min((halfH * fit.fill) / by, (halfH * aspect * fit.fillX) / bx, 2.4);
  }

  /* ---------- pointer ---------- */
  const pointer = { x: 99, y: 99, active: false, s: 0 };
  const tmpV = new THREE.Vector3();
  function setPointer(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect(); if (r.width < 2) return;
    tmpV.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1), 0.5).unproject(camera);
    const dir = tmpV.sub(camera.position).normalize(), dist = -camera.position.z / dir.z;
    pointer.x = camera.position.x + dir.x * dist; pointer.y = camera.position.y + dir.y * dist; pointer.active = true;
  }
  function clearPointer() { pointer.active = false; }

  let paused = false, raf = 0, last = performance.now();
  const offset = new THREE.Vector2(0, 0);
  function step(dt) {
    time += dt;
    if (!driven && morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
    fitNow();
    curScale += (targetScale - curScale) * Math.min(1, dt * 4);
    pointer.s += ((pointer.active ? 1 : 0) - pointer.s) * Math.min(1, dt * 6);
    const e = ease(morphT);
    U.uMix.value = e; U.uMelt.value = Math.sin(Math.PI * e);
    U.uOff.value.copy(offset); U.uScale.value = curScale;
    U.uTime.value = time; U.uPtr.value.set(pointer.x, pointer.y); U.uPtrS.value = pointer.s;
    if (fromName === "wave" || toName === "wave") { const b = U.uBars.value; for (let i = 0; i < BARS; i++) b[i] = waveEnv(i) * waveLive(i, time) * WAVE_H; }
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused) { last = now; return; }
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    resize(); step(dt);
    renderer.setRenderTarget(null); renderer.render(sheet, postCam);
  }
  resize(); bind();
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setShape, setBlend, setOverride, clearOverride, setPointer, clearPointer,
    get override() { return override; },
    get halfH() { return halfH; }, get aspect() { return aspect; },
    setFit(f) { fit = { fill: f.fill ?? fit.fill, fillX: f.fillX ?? fit.fillX }; },
    setOffset(x, y = 0) { offset.set(x, y); },
    get offset() { return { x: offset.x, y: offset.y }; },
    setColors(ink, accent, dark = true) { U.uDark.value = dark ? 1 : 0; },
    setPaused(v) { paused = !!v; last = performance.now(); },
    burst() {},
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); maskRT.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createSwarm = createSwarm;
window.dispatchEvent(new Event("swarm-ready"));
