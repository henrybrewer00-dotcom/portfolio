/* =========================================================================
   The marble. A block of stone in a marble hall; scrolling carves it into
   each thing on the page. Everything is a signed distance field raymarched
   in one fragment shader (the hall too: floor, columns, fog, light shafts),
   so moving between two shapes is a smooth blend of two fields, roughened
   like chisel work while it changes. Chips fly, dust drifts.

     setBlend(a, b, t)   scroll-driven: t of the way from shape a to b
     setShape(name, dur) timed morph (load-in, hover overrides)
   window.createMarble(container, options) -> api (same surface as the old swarm)
   ========================================================================= */
import * as THREE from "three";

const HE = 1.7;            // half-extent of shape space (2d fields), object units
const MASK = 1024;         // drawing resolution
const SDF = 512;           // distance-field resolution
const RANGE = 3.0;         // clamp for stored distances, shape units
const BARS = 26, WAVE_H = 1.3, WAVE_SP = 0.115;
const FLOOR_Y = 1.25;      // the floor sits at y = -FLOOR_Y

/* the voice: bar heights follow a spoken-word envelope and keep moving */
const waveEnv = (b) => { const t = b / (BARS - 1); return 0.12 + 0.88 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.7); };
const waveLive = (b, time) => 0.55 + 0.45 * Math.sin(time * 2.7 + b * 0.63 + 0.9 * Math.sin(time * 1.3 + b * 0.21));

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
  blurField(field, SDF, 0.9);
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


/* 3d shapes are analytic in the shader; these are their extents for fitting */
const SOLID = {
  block: { mode: 1, bounds: { x: 1.0, y: 1.25 }, thick: 0, front: 0.8 },
  sphere: { mode: 2, bounds: { x: 1.0, y: 1.0 }, thick: 0, front: 0.9 },
  bust: { mode: 3, bounds: { x: 1.15, y: 1.35 }, thick: 0, front: 0.5 },
  car: { mode: 4, bounds: { x: 1.35, y: 0.8 }, thick: 0, front: 0.6 },
  sub: { mode: 5, bounds: { x: 1.65, y: 0.95 }, thick: 0, front: 0.42 },
  keycaps: { mode: 6, bounds: { x: 1.55, y: 0.7 }, thick: 0, front: 0.35 },
  wave: { mode: 7, bounds: { x: (BARS / 2) * WAVE_SP, y: WAVE_H * 0.5 }, thick: 0, front: 0.16 },
};

const QUAD_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const HALL_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tA, tB;
  uniform float uModeA, uModeB, uThickA, uThickB, uMix, uMelt, uScale, uTime, uHE, uAspect, uQ, uRough, uDebris;
  uniform vec4 uHit;
  uniform vec3 uLight;
  uniform vec2 uShiftA, uShiftB, uRes;
  uniform vec3 uOff, uCamPos, uCamFwd, uCamRight, uCamUp;
  uniform float uTanHalf;
  uniform float uBars[${BARS}];
  varying vec2 vUv;

  /* ---- noise ---- */
  float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }

  /* ---- primitives ---- */
  float sdSphere(vec3 p, float r){ return length(p) - r; }
  float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
  float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
  float sdCylY(vec3 p, float h, float r){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
  float sdCylZ(vec3 p, float h, float r){ vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
  float sdTorusX(vec3 p, float R, float r){ vec2 q = vec2(length(p.yz) - R, p.x); return length(q) - r; }
  float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

  /* ---- the shapes, in object space (units where the 2d fields span ±uHE) ---- */
  float sdExtrude(sampler2D t, vec2 shift, float thick, vec3 q){
    vec2 l = q.xy + shift;
    vec2 uv = l / uHE * 0.5 + 0.5;
    vec2 o = max(abs(l) - vec2(uHE), 0.0);
    float d2 = texture2D(t, clamp(uv, 0.0, 1.0)).r + length(o);
    vec2 w = vec2(d2, abs(q.z) - thick);
    return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.018;
  }
  float sdBust(vec3 q){
    float head = sdSphere(q - vec3(0.0, 0.62, 0.0), 0.5);
    head = smin(head, sdRBox(q - vec3(0.0, 0.5, -0.02), vec3(0.42, 0.44, 0.44), 0.3), 0.08);
    head = smin(head, sdRBox(q - vec3(0.0, 0.5, 0.42), vec3(0.06, 0.16, 0.08), 0.05), 0.06);   // nose
    head = smin(head, sdRBox(q - vec3(0.0, 0.76, 0.34), vec3(0.3, 0.05, 0.08), 0.04), 0.05);    // brow
    float neck = sdCapsule(q, vec3(0.0, 0.25, 0.0), vec3(0.0, -0.1, 0.0), 0.2);
    float shoulders = sdRBox(q - vec3(0.0, -0.55, 0.0), vec3(1.05, 0.28, 0.5), 0.22);
    float plinth = sdRBox(q - vec3(0.0, -1.05, 0.0), vec3(0.62, 0.22, 0.5), 0.04);
    return min(smin(smin(head, neck, 0.12), shoulders, 0.18), plinth);
  }
  float sdCar(vec3 q){
    float body = sdRBox(q - vec3(0.0, 0.0, 0.0), vec3(1.15, 0.24, 0.6), 0.1);
    float cabin = sdRBox(q - vec3(-0.15, 0.42, 0.0), vec3(0.5, 0.22, 0.48), 0.1);
    float d = smin(body, cabin, 0.08);
    vec3 w = q; w.x = abs(w.x) - 0.7; w.z = abs(w.z) - 0.62;
    d = min(d, sdCylZ(w - vec3(0.0, -0.22, 0.0), 0.12, 0.3));
    d = min(d, sdCapsule(q, vec3(0.6, 0.3, 0.0), vec3(0.6, 0.9, 0.0), 0.04));
    d = min(d, sdSphere(q - vec3(0.6, 0.95, 0.0), 0.12));
    return d;
  }
  float sdSub(vec3 q){
    float hull = sdCapsule(q, vec3(-1.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), 0.42);
    float tower = sdRBox(q - vec3(0.15, 0.55, 0.0), vec3(0.32, 0.22, 0.18), 0.08);
    float scope = sdCapsule(q, vec3(0.05, 0.7, 0.0), vec3(0.05, 1.05, 0.0), 0.035);
    float d = smin(hull, tower, 0.12); d = min(d, scope);
    d = min(d, sdRBox(q - vec3(-1.15, 0.0, 0.0), vec3(0.04, 0.26, 0.55), 0.02));
    d = min(d, sdRBox(q - vec3(-1.15, 0.0, 0.0), vec3(0.04, 0.5, 0.26), 0.02));
    d = min(d, sdTorusX(q - vec3(-1.5, 0.0, 0.0), 0.24, 0.045));
    return d;
  }
  float sdKeycaps(vec3 q){
    vec3 k = q; k.x = mod(k.x + 0.33, 0.66) - 0.33;
    float keys = sdRBox(k - vec3(0.0, 0.14, -0.05), vec3(0.24, 0.16, 0.24), 0.07);
    keys = max(keys, abs(q.x) - 1.5);
    float bar = sdRBox(q - vec3(0.0, -0.4, 0.35), vec3(1.4, 0.13, 0.22), 0.07);
    return min(keys, bar);
  }
  float sdWave(vec3 q){
    float d = 1e3;
    for (int b = 0; b < ${BARS}; b++) {
      float x = (float(b) - ${((BARS - 1) / 2).toFixed(1)}) * ${WAVE_SP.toFixed(3)};
      d = smin(d, sdRBox(q - vec3(x, 0.0, 0.0), vec3(0.042, uBars[b] * 0.5, 0.16), 0.04), 0.03);
    }
    return d;
  }
  float shapeOf(float mode, sampler2D t, vec2 shift, float thick, vec3 q){
    if (mode < 0.5) return sdExtrude(t, shift, thick, q);
    if (mode < 1.5) return sdRBox(q, vec3(1.0, 1.25, 0.8), 0.06);
    if (mode < 2.5) return sdSphere(q, 1.0);
    if (mode < 3.5) return sdBust(q);
    if (mode < 4.5) return sdCar(q);
    if (mode < 5.5) return sdSub(q);
    if (mode < 6.5) return sdKeycaps(q);
    return sdWave(q);
  }
  // chisel marks: long strokes with a fine tooth
  float chisel(vec3 q){ return (fbm(q * vec3(7.0, 19.0, 7.0) + uTime * 0.15) - 0.5) * 0.09 + (noise(q * 42.0) - 0.5) * 0.012; }
  float sdObject(vec3 p){
    vec3 q = (p - uOff) / uScale;
    float d = mix(shapeOf(uModeA, tA, uShiftA, uThickA, q), shapeOf(uModeB, tB, uShiftB, uThickB, q), uMix);
    // the surface roughens while it changes (or when it has just arrived), then settles
    float rough = max(uMelt, uRough);
    if (rough > 0.001) d += rough * chisel(q);
    // a strike takes a bite and roughens the stone around it
    if (uHit.w > 0.001) {
      float hd = length(p - uHit.xyz);
      d = max(d, -(hd - 0.22 * uScale * uHit.w) / uScale);
      d += uHit.w * smoothstep(0.8 * uScale, 0.0, hd) * chisel(q * 1.6) * 0.9;
    }
    return d * uScale;
  }
  // marble dust and chips that have collected on the floor under the work
  float debrisAt(vec3 p){
    vec2 c = (p.xz - vec2(uOff.x, 0.3)) / vec2(1.0, 0.55);
    float R = (0.9 + 1.1 * uDebris) * uScale;
    return uDebris * smoothstep(R, R * 0.15, length(c)) * (0.5 + 0.5 * noise(p * 5.0));
  }

  /* ---- the hall ---- */
  float sdColumns(vec3 p){
    vec3 c = p; c.x = abs(c.x) - 7.2; c.z = mod(c.z + 3.0, 6.0) - 3.0;
    float ang = atan(c.z, c.x);
    float shaft = length(c.xz) - 0.62 - 0.018 * cos(ang * 20.0);
    shaft = max(shaft, p.y - 7.4);
    float cap = sdRBox(vec3(c.x, p.y - 7.5, c.z), vec3(0.95, 0.2, 0.95), 0.06);
    float base = sdRBox(vec3(c.x, p.y + ${FLOOR_Y.toFixed(2)} - 0.12, c.z), vec3(0.9, 0.16, 0.9), 0.05);
    return min(min(shaft, cap), base);
  }
  // (distance, material) — 0 floor, 1 columns, 2 the marble
  vec2 map(vec3 p){
    float dF = p.y + ${FLOOR_Y.toFixed(2)} - 0.05 * debrisAt(p);
    float dC = sdColumns(p);
    float bound = length(p - uOff) - uScale * 2.4;
    float dO = bound > 0.6 ? bound : sdObject(p);
    vec2 r = vec2(dF, 0.0);
    if (dC < r.x) r = vec2(dC, 1.0);
    if (dO < r.x) r = vec2(dO, 2.0);
    return r;
  }
  vec3 normalAt(vec3 p){
    const vec2 e = vec2(0.0015, -0.0015);
    return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
  }
  float shadow(vec3 ro, vec3 rd, float k){
    float res = 1.0, t = 0.04;
    for (int i = 0; i < 28; i++) {
      float h = map(ro + rd * t).x;
      res = min(res, k * h / t);
      t += clamp(h, 0.03, 0.5);
      if (res < 0.01 || t > 14.0) break;
    }
    return clamp(res, 0.0, 1.0);
  }
  float ao(vec3 p, vec3 n){
    float occ = 0.0, sca = 1.0;
    for (int i = 0; i < 5; i++) { float h = 0.02 + 0.16 * float(i); occ += (h - map(p + n * h).x) * sca; sca *= 0.75; }
    return clamp(1.0 - 1.6 * occ, 0.0, 1.0);
  }
  float marbleVeins(vec3 p, float scale){
    vec3 q = p * scale;
    float w = fbm(q * 0.9);
    float v = sin(q.x * 1.6 + q.y * 0.7 + w * 5.5);
    v = pow(1.0 - abs(v), 7.0);
    return v * 0.55 + fbm(q * 3.0) * 0.08;
  }

  const vec3 LCOL = vec3(1.0, 0.95, 0.86);
  const vec3 SKY = vec3(0.58, 0.61, 0.66);
  const vec3 GROUND = vec3(0.42, 0.38, 0.34);
  const vec3 FOG = vec3(0.80, 0.78, 0.745);

  float beam(vec3 p){
    // two shafts of light falling from high windows on the right
    vec3 d = normalize(vec3(-0.42, -1.0, -0.25));
    vec3 a = p - vec3(5.5, 9.0, -3.0); float r1 = length(a - d * dot(a, d));
    vec3 b = p - vec3(9.0, 9.0, -11.0); float r2 = length(b - d * dot(b, d));
    return smoothstep(2.6, 0.0, r1) * 0.9 + smoothstep(2.2, 0.0, r2) * 0.6;
  }

  vec3 shade(vec3 p, vec3 n, float m, vec3 rd){
    vec3 alb;
    vec3 LIGHT = uLight;
    if (m < 0.5) { alb = vec3(0.50, 0.485, 0.46) + marbleVeins(p, 1.1) * 0.22; float db = clamp(debrisAt(p) * 1.5, 0.0, 1.0); alb = mix(alb, vec3(0.88, 0.865, 0.84) + (noise(p * 90.0) - 0.5) * 0.14, db); }
    else if (m < 1.5) { alb = vec3(0.86, 0.845, 0.815) + marbleVeins(p, 0.7) * 0.12; }
    else { alb = vec3(0.94, 0.925, 0.895) + marbleVeins(p - uOff, 1.6 / uScale) * 0.28; }
    float sh = shadow(p + n * 0.02, LIGHT, 10.0);
    float occ = ao(p, n);
    float dif = clamp(dot(n, LIGHT), 0.0, 1.0);
    float wrap = clamp(dot(n, LIGHT) * 0.6 + 0.4, 0.0, 1.0);
    vec3 col = alb * (LCOL * 1.25 * dif * sh + LCOL * 0.35 * wrap * (0.5 + 0.5 * sh));
    col += alb * SKY * 0.55 * (0.5 + 0.5 * n.y) * occ;
    col += alb * GROUND * 0.35 * clamp(-n.y, 0.0, 1.0) * occ;
    if (m > 1.5) col += vec3(0.16, 0.12, 0.10) * pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 2.5) * 0.55; // marble glow at the rim
    vec3 h = normalize(LIGHT - rd);
    float spec = pow(clamp(dot(n, h), 0.0, 1.0), m < 0.5 ? 140.0 : 42.0) * sh;
    col += LCOL * spec * (m < 0.5 ? 0.55 : 0.16);
    return col;
  }

  void main(){
    vec2 ndc = (vUv * 2.0 - 1.0);
    vec3 rd = normalize(uCamFwd + uCamRight * ndc.x * uTanHalf * uAspect + uCamUp * ndc.y * uTanHalf);
    vec3 ro = uCamPos;
    float t = 0.0, m = -1.0;
    int STEPS = uQ > 0.5 ? 110 : 72;
    for (int i = 0; i < 110; i++) {
      if (i >= STEPS) break;
      vec2 h = map(ro + rd * t);
      if (h.x < 0.0012 * t) { m = h.y; break; }
      t += h.x * (uMelt > 0.001 ? 0.8 : 0.95);
      if (t > 60.0) break;
    }
    vec3 col;
    float far = 60.0;
    if (m >= 0.0) {
      vec3 p = ro + rd * t, n = normalAt(p);
      col = shade(p, n, m, rd);
      // the polished floor reflects the marble
      if (m < 0.5 && uQ > 0.5) {
        vec3 rr = reflect(rd, n); float tr = 0.05; float hit = -1.0;
        for (int i = 0; i < 40; i++) { vec2 h = map(p + rr * tr); if (h.x < 0.004 * tr) { hit = h.y; break; } tr += h.x; if (tr > 16.0) break; }
        if (hit >= 0.5) { vec3 rp = p + rr * tr; col = mix(col, shade(rp, normalAt(rp), hit, rr) * 0.9, (hit > 1.5 ? 0.24 : 0.13) * exp(-tr * 0.12)); }
      }
      far = t;
    } else {
      float up = clamp(rd.y * 2.0 + 0.5, 0.0, 1.0);
      col = mix(FOG * 1.05, FOG * 0.72, up);
    }
    // fog + light shafts
    col = mix(col, FOG, 1.0 - exp(-far * 0.055));
    float sh = 0.0, tt = 0.3;
    for (int i = 0; i < 14; i++) { tt += 1.2; if (tt > far) break; sh += beam(ro + rd * tt); }
    col += LCOL * sh * 0.028;
    // vignette + a little tone
    float vig = smoothstep(1.55, 0.35, length(ndc * vec2(1.0, 0.85)));
    col *= 0.86 + 0.14 * vig;
    col = pow(col, vec3(0.94));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* chips + dust: small points in the hall */
const DOT_VERT = /* glsl */ `
  attribute float aSize, aLife;
  varying float vLife;
  void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * 180.0 / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; vLife = aLife; }
`;
const DOT_FRAG = /* glsl */ `
  precision highp float; uniform vec3 uCol; varying float vLife;
  void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0; float a = smoothstep(1.0, 0.55, d) * vLife; if (a < 0.01) discard; gl_FragColor = vec4(uCol, a); }
`;

export function createMarble(container, options = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.25);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  const CAM = new THREE.Vector3(0, 0.55, 7.6), LOOK = new THREE.Vector3(0, 0.15, 0);
  camera.position.copy(CAM); camera.lookAt(LOOK);
  const dist = CAM.distanceTo(LOOK);
  const halfH = dist * Math.tan((camera.fov / 2) * Math.PI / 180);   // visible half-height at the object's plane
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const empty = new THREE.DataTexture(new Uint16Array([THREE.DataUtils.toHalfFloat(3), 0, 0, THREE.DataUtils.toHalfFloat(1)]), 1, 1, THREE.RGBAFormat, THREE.HalfFloatType); empty.needsUpdate = true;
  const U = {
    tA: { value: empty }, tB: { value: empty }, uModeA: { value: 1 }, uModeB: { value: 1 }, uThickA: { value: 0.22 }, uThickB: { value: 0.22 },
    uMix: { value: 0 }, uMelt: { value: 0 }, uScale: { value: 1 }, uTime: { value: 0 }, uHE: { value: HE }, uAspect: { value: 1 }, uQ: { value: options.quality === "low" ? 0 : 1 },
    uShiftA: { value: new THREE.Vector2() }, uShiftB: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2(2, 2) },
    uOff: { value: new THREE.Vector3() }, uCamPos: { value: new THREE.Vector3() }, uCamFwd: { value: new THREE.Vector3() }, uCamRight: { value: new THREE.Vector3() }, uCamUp: { value: new THREE.Vector3() },
    uTanHalf: { value: Math.tan((camera.fov / 2) * Math.PI / 180) },
    uBars: { value: new Float32Array(BARS) },
    uRough: { value: 1 }, uDebris: { value: 0 }, uHit: { value: new THREE.Vector4(0, 0, 0, 0) }, uLight: { value: new THREE.Vector3(0.55, 0.78, 0.34).normalize() },
  };
  const hall = new THREE.Scene();
  hall.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: QUAD_VERT, fragmentShader: HALL_FRAG, depthWrite: false, depthTest: false })));

  /* ---------- chips and dust ---------- */
  const NCHIP = 320, NDUST = 360;
  const chipPos = new Float32Array(NCHIP * 3), chipVel = new Float32Array(NCHIP * 3), chipLife = new Float32Array(NCHIP), chipSize = new Float32Array(NCHIP);
  const chipGeo = new THREE.BufferGeometry();
  chipGeo.setAttribute("position", new THREE.BufferAttribute(chipPos, 3).setUsage(THREE.DynamicDrawUsage));
  chipGeo.setAttribute("aSize", new THREE.BufferAttribute(chipSize, 1).setUsage(THREE.DynamicDrawUsage));
  chipGeo.setAttribute("aLife", new THREE.BufferAttribute(chipLife, 1).setUsage(THREE.DynamicDrawUsage));
  const chips = new THREE.Points(chipGeo, new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(0.93, 0.91, 0.87) } }, vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, transparent: true, depthWrite: false, depthTest: false }));
  const dustPos = new Float32Array(NDUST * 3), dustLife = new Float32Array(NDUST), dustSize = new Float32Array(NDUST), dustSeed = new Float32Array(NDUST * 3);
  for (let i = 0; i < NDUST; i++) {
    dustSeed[i * 3] = Math.random(); dustSeed[i * 3 + 1] = Math.random(); dustSeed[i * 3 + 2] = Math.random();
    dustPos[i * 3] = (Math.random() * 2 - 1) * 5; dustPos[i * 3 + 1] = -1 + Math.random() * 5; dustPos[i * 3 + 2] = -6 + Math.random() * 10;
    dustSize[i] = 0.04 + Math.random() * 0.05; dustLife[i] = 0.35 + Math.random() * 0.45;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3).setUsage(THREE.DynamicDrawUsage));
  dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dustSize, 1));
  dustGeo.setAttribute("aLife", new THREE.BufferAttribute(dustLife, 1).setUsage(THREE.DynamicDrawUsage));
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(1.0, 0.97, 0.9) } }, vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, transparent: true, depthWrite: false, depthTest: false }));
  const overlay = new THREE.Scene(); overlay.add(dust); overlay.add(chips);
  // the same two shafts of light as the shader, for the dust
  function beamJS(x, y, z) {
    const n = Math.hypot(0.42, 1.0, 0.25), ux = -0.42 / n, uy = -1.0 / n, uz = -0.25 / n;
    const r = (ax, ay, az) => { const t = ax * ux + ay * uy + az * uz; return Math.hypot(ax - t * ux, ay - t * uy, az - t * uz); };
    return Math.max(0, 1 - r(x - 5.5, y - 9, z + 3) / 2.6) * 0.9 + Math.max(0, 1 - r(x - 9, y - 9, z + 11) / 2.2) * 0.6;
  }
  let chipHead = 0;
  function spawnChips(n, energy) {
    for (let k = 0; k < n; k++) {
      const i = chipHead; chipHead = (chipHead + 1) % NCHIP;
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI, r = curScale * (0.9 + Math.random() * 0.6);
      const x = Math.cos(a) * Math.cos(b) * r, y = Math.sin(b) * r, z = Math.sin(a) * Math.cos(b) * r * 0.6;
      chipPos[i * 3] = offset.x + x; chipPos[i * 3 + 1] = offset.y + y; chipPos[i * 3 + 2] = z + 0.2;
      const sp = (1.2 + Math.random() * 2.2) * energy;
      chipVel[i * 3] = x * sp * 0.8 + (Math.random() - 0.5); chipVel[i * 3 + 1] = Math.abs(y) * sp * 0.5 + 1.5 + Math.random() * 1.5; chipVel[i * 3 + 2] = 1.0 + Math.random() * 2.0;
      chipLife[i] = 1; chipSize[i] = 0.05 + Math.random() * 0.09;
    }
  }

  function spawnChipsAt(x, y, z, n, energy) {
    for (let k = 0; k < n; k++) {
      const i = chipHead; chipHead = (chipHead + 1) % NCHIP;
      chipPos[i * 3] = x + (Math.random() - 0.5) * 0.1; chipPos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.1; chipPos[i * 3 + 2] = z;
      const a = Math.random() * Math.PI * 2, sp = (1.0 + Math.random() * 2.5) * energy;
      chipVel[i * 3] = Math.cos(a) * sp; chipVel[i * 3 + 1] = 1.2 + Math.random() * 2.4 * energy; chipVel[i * 3 + 2] = 1.5 + Math.random() * 2.5;
      chipLife[i] = 1; chipSize[i] = 0.04 + Math.random() * 0.08;
    }
  }
  const ndcV = new THREE.Vector3(), rayc = new THREE.Raycaster(), ndc2 = new THREE.Vector2();
  function project(x, y, z) { return ndcV.set(x, y, z).project(camera); }
  function hitTest(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect(); if (r.width < 2) return false;
    const px = ((cx - r.left) / r.width) * 2 - 1, py = -(((cy - r.top) / r.height) * 2 - 1);
    const c = project(offset.x, offset.y, 0);
    const e = ease(morphT), bx = fromB.x + (toB.x - fromB.x) * e, by = fromB.y + (toB.y - fromB.y) * e;
    const rx = (bx * curScale) / (halfH * aspect) * 1.05, ry = (by * curScale) / halfH * 1.05;
    const dx = (px - c.x) / rx, dy = (py - c.y) / ry;
    return dx * dx + dy * dy < 1;
  }
  function strike(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect(); if (r.width < 2) return;
    ndc2.set(((cx - r.left) / r.width) * 2 - 1, -(((cy - r.top) / r.height) * 2 - 1));
    rayc.setFromCamera(ndc2, camera);
    const e = ease(morphT), zf = (fromF + (toF - fromF) * e) * curScale, t = (zf - rayc.ray.origin.z) / rayc.ray.direction.z;
    const p = rayc.ray.origin.clone().addScaledVector(rayc.ray.direction, t);
    U.uHit.value.set(p.x, p.y, zf, 1); hitW = 1;
    spawnChipsAt(p.x, p.y, zf + 0.1, 26, 1.3);
    debris = Math.min(1, debris + 0.06);
    kick.set((Math.random() - 0.5) * 0.06, -0.035);
    for (const fn of strikers) fn(p);
  }

  let w = 2, h = 2, aspect = 1;
  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh; aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    U.uRes.value.set(w * dpr, h * dpr); U.uAspect.value = aspect;
  }

  /* ---------- shapes ---------- */
  const cache = {};
  function fieldFromCanvas(c) { const a = c.getContext("2d").getImageData(0, 0, MASK, MASK).data; return fieldFromAlpha(a, MASK / SDF, MASK); }
  function shape(name) {
    if (cache[name]) return cache[name];
    let s;
    if (SOLID[name]) s = { ...SOLID[name], shift: [0, 0], tex: empty };
    else {
      let canvas;
      if (name.startsWith("text:")) canvas = shapeCanvas(drawText(name.slice(5), options.textFont));
      else if (name.startsWith("draw:")) { const fn = window.SHAPES2D && window.SHAPES2D[name.slice(5)]; canvas = shapeCanvas(fn ? drawFn2d(fn) : () => {}); }
      else if (name.startsWith("logo:")) { const L = window.LOGOS && window.LOGOS[name.slice(5)]; canvas = shapeCanvas(L && window.logoDrawer ? drawFn2d(window.logoDrawer(L.d)) : () => {}); }
      else return shape("block");
      s = { mode: 0, ...fieldFromCanvas(canvas), thick: name.startsWith("text:") ? 0.17 : 0.26 };
      s.front = s.thick;
    }
    return (cache[name] = s);
  }

  /* ---------- morph state ---------- */
  let fromName = "block", toName = "block", fromB = { x: 1, y: 1 }, toB = { x: 1, y: 1 }, fromF = 0.8, toF = 0.8;
  let morphT = 1, morphDur = 1.2, driven = false, override = null, pending = null;
  let targetScale = 1, curScale = 1, time = 0, lastMix = 0, carve = 0, rough = 1, debris = 0, hitW = 0;
  const kick = new THREE.Vector2(), strikers = [];
  let fit = { fill: options.fill ?? 0.72, fillX: options.fillX ?? 0.6 };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const listeners = [];

  function bind() {
    const A = shape(fromName), B = shape(toName);
    U.tA.value = A.tex; U.uModeA.value = A.mode; U.uShiftA.value.set(A.shift[0], A.shift[1]); U.uThickA.value = A.thick;
    U.tB.value = B.tex; U.uModeB.value = B.mode; U.uShiftB.value.set(B.shift[0], B.shift[1]); U.uThickB.value = B.thick;
    fromB = A.bounds; toB = B.bounds; fromF = A.front; toF = B.front;
  }
  function setShape(name, dur = 1.2) {
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
    const e = ease(morphT), bx = fromB.x + (toB.x - fromB.x) * e, by = fromB.y + (toB.y - fromB.y) * e;
    targetScale = Math.min((halfH * fit.fill) / by, (halfH * aspect * fit.fillX) / bx, 2.2);
  }

  /* ---------- pointer: the camera leans a little, nothing turns ---------- */
  const pointer = { x: 0, y: 0, active: false };
  function setPointer(cx, cy) { const r = renderer.domElement.getBoundingClientRect(); if (r.width < 2) return; pointer.x = ((cx - r.left) / r.width) * 2 - 1; pointer.y = -(((cy - r.top) / r.height) * 2 - 1); pointer.active = true; }
  function clearPointer() { pointer.active = false; }

  let paused = false, raf = 0, last = performance.now(), fps = 60, fpsAcc = 0, fpsN = 0;
  const offset = new THREE.Vector3(0, 0, 0);
  const camOff = new THREE.Vector3();
  function step(dt, wall) {
    time += dt;
    if (!driven && morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
    fitNow();
    curScale += (targetScale - curScale) * Math.min(1, dt * 4);
    const e = ease(morphT), melt = Math.sin(Math.PI * e);
    U.uMix.value = e; U.uMelt.value = melt;
    rough *= Math.exp(-wall * 1.1); U.uRough.value = rough > 0.01 ? rough : 0;
    hitW *= Math.exp(-wall * 1.6); U.uHit.value.w = hitW > 0.01 ? hitW : 0;
    U.uDebris.value = debris;
    const sun = 0.22 * Math.sin(time * 0.018);
    U.uLight.value.set(0.55 + sun * 0.9, 0.78, 0.34 - sun * 0.5).normalize();
    kick.multiplyScalar(Math.exp(-wall * 6));
    U.uOff.value.copy(offset); U.uScale.value = curScale; U.uTime.value = time;
    // carving = how much the shape moved this frame while it was rough
    const moved = Math.abs(e - lastMix); lastMix = e;
    carve = Math.min(1, moved * 30) * melt;
    if (carve > 0.02) { spawnChips(Math.min(12, Math.round(carve * 14)), 0.5 + carve); debris = Math.min(1, debris + carve * dt * 0.35); }
    for (const fn of listeners) fn(carve, melt);
    if (fromName === "wave" || toName === "wave") { const b = U.uBars.value; for (let i = 0; i < BARS; i++) b[i] = waveEnv(i) * waveLive(i, time) * WAVE_H; }
    // camera
    camOff.x += ((pointer.active ? pointer.x : 0) * 0.28 - camOff.x) * Math.min(1, dt * 2.2);
    camOff.y += ((pointer.active ? pointer.y : 0) * 0.16 - camOff.y) * Math.min(1, dt * 2.2);
    camera.position.set(CAM.x + camOff.x + kick.x, CAM.y + camOff.y + kick.y, CAM.z); camera.lookAt(LOOK.x + camOff.x + kick.x, LOOK.y + camOff.y + kick.y, LOOK.z);
    camera.updateMatrixWorld();
    U.uCamPos.value.copy(camera.position);
    camera.getWorldDirection(U.uCamFwd.value);
    U.uCamRight.value.set(1, 0, 0).applyQuaternion(camera.quaternion);
    U.uCamUp.value.set(0, 1, 0).applyQuaternion(camera.quaternion);
    // chips fall
    for (let i = 0; i < NCHIP; i++) {
      if (chipLife[i] <= 0) continue;
      chipVel[i * 3 + 1] -= 9.0 * dt;
      chipPos[i * 3] += chipVel[i * 3] * dt; chipPos[i * 3 + 1] += chipVel[i * 3 + 1] * dt; chipPos[i * 3 + 2] += chipVel[i * 3 + 2] * dt;
      if (chipPos[i * 3 + 1] < -FLOOR_Y + 0.02) { chipPos[i * 3 + 1] = -FLOOR_Y + 0.02; chipVel[i * 3 + 1] *= -0.25; chipVel[i * 3] *= 0.7; chipVel[i * 3 + 2] *= 0.7; chipLife[i] -= dt * 1.4; }
      chipLife[i] -= dt * 0.35;
    }
    chipGeo.attributes.position.needsUpdate = true; chipGeo.attributes.aLife.needsUpdate = true; chipGeo.attributes.aSize.needsUpdate = true;
    // dust drifts
    for (let i = 0; i < NDUST; i++) {
      const s0 = dustSeed[i * 3], s1 = dustSeed[i * 3 + 1];
      dustPos[i * 3] += Math.sin(time * 0.3 + s0 * 20.0) * 0.08 * dt + (s1 - 0.5) * 0.03 * dt;
      dustPos[i * 3 + 1] += (Math.cos(time * 0.25 + s1 * 17.0) * 0.06 - 0.02) * dt;
      if (dustPos[i * 3 + 1] < -1.1) dustPos[i * 3 + 1] = 4.0;
      dustLife[i] = (0.12 + 0.2 * Math.abs(Math.sin(time * 0.6 + s0 * 30.0))) * (0.5 + 0.5 * s1) * (0.5 + 1.6 * beamJS(dustPos[i * 3], dustPos[i * 3 + 1], dustPos[i * 3 + 2]));
    }
    dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.aLife.needsUpdate = true;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused || document.hidden) { last = now; return; }
    const wall = Math.min(0.6, (now - last) / 1000), dt = Math.min(0.05, wall); last = now;
    fpsAcc += dt; fpsN++; if (fpsAcc > 1) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 34 && U.uQ.value > 0.5 && time > 4) U.uQ.value = 0; }
    resize(); step(dt, wall);
    renderer.setRenderTarget(null); renderer.clear();
    renderer.render(hall, postCam);
    renderer.render(overlay, camera);
  }
  resize(); bind();
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setShape, setBlend, setOverride, clearOverride, setPointer, clearPointer,
    get override() { return override; },
    get halfH() { return halfH; }, get aspect() { return aspect; },
    setFit(f) { fit = { fill: f.fill ?? fit.fill, fillX: f.fillX ?? fit.fillX }; },
    setOffset(x, y = 0) { offset.set(x, y, 0); },
    get offset() { return { x: offset.x, y: offset.y }; },
    setColors() {},
    setPaused(v) { paused = !!v; last = performance.now(); },
    burst(n = 40) { spawnChips(n, 1.4); },
    hitTest, strike,
    onStrike(fn) { strikers.push(fn); },
    arrive() { rough = 1; spawnChips(30, 1.2); },
    onCarve(fn) { listeners.push(fn); },
    stats() { return { fps: Math.round(fps), quality: U.uQ.value, rough, melt: U.uMelt.value, mix: U.uMix.value, hit: hitW, debris, scale: curScale, from: fromName, to: toName }; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createMarble = createMarble;
window.dispatchEvent(new Event("marble-ready"));
