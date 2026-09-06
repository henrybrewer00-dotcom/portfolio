/* =========================================================================
   The sheet — the whole screen is liquid metal. Shapes are stamped into it
   from crisp masks (text, drawings, logos, rendered 3D silhouettes); between
   shapes the stamp melts back into the sheet while beads of mercury (the
   particles) roll across it and the next stamp rises.

     setBlend(a, b, t)   scroll-driven: t of the way from shape a to b
     setShape(name, dur) timed morph (load-in, hover overrides)
   window.createSwarm(container, options) -> api
   ========================================================================= */
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const HE = 1.7;          // half-extent of "shape space" in world units
const MASK = 1024;       // mask texture size

/* ---------- 3d shape builders ---------- */
function merged(parts) {
  const geos = parts.map(([geo, pos = [0, 0, 0], rot = [0, 0, 0]]) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(1, 1, 1)));
    for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
    return g;
  });
  return BufferGeometryUtils.mergeGeometries(geos, false);
}
function sampleMesh(geo, count) {
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
  const out = new Float32Array(count * 3), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) { sampler.sample(p); out[i * 3] = p.x; out[i * 3 + 1] = p.y; out[i * 3 + 2] = p.z; }
  return out;
}
function centre(arr) {
  const n = arr.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += arr[i * 3]; cy += arr[i * 3 + 1]; cz += arr[i * 3 + 2]; }
  cx /= n; cy /= n; cz /= n;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { arr[i * 3] -= cx; arr[i * 3 + 1] -= cy; arr[i * 3 + 2] -= cz; mx = Math.max(mx, Math.abs(arr[i * 3])); my = Math.max(my, Math.abs(arr[i * 3 + 1])); }
  arr.bounds = { x: mx || 1, y: my || 1 }; arr.centroid = [cx, cy, cz];
  return arr;
}
const GEOS = {
  sphere() { return new THREE.SphereGeometry(1, 48, 32); },
  keycaps() {
    const parts = [];
    for (let i = 0; i < 5; i++) parts.push([new RoundedBoxGeometry(0.52, 0.34, 0.52, 3, 0.09), [(i - 2) * 0.62, 0.12, -0.1], [-0.35, 0, 0]]);
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
const IS_3D = new Set(Object.keys(GEOS));

/* the voice: bars that keep talking (particles + mask both rebuilt from the same envelope) */
const WAVE_BARS = 26, WAVE_H = 1.3, WAVE_SP = 0.115;
const waveEnv = (b) => { const t = b / (WAVE_BARS - 1); return 0.12 + 0.88 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.7); };
const waveLive = (b, time) => 0.55 + 0.45 * Math.sin(time * 2.7 + b * 0.63 + 0.9 * Math.sin(time * 1.3 + b * 0.21));

/* ---------- 2d sources: a square canvas in shape space (HE units half-extent) ---------- */
function shapeCanvas(draw) {
  const c = document.createElement("canvas"); c.width = c.height = MASK;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000"; ctx.strokeStyle = "#000";
  draw(ctx);
  // a soft bevel: the crisp ink stays, the edge gets a short ramp for the shading to roll over
  const b = document.createElement("canvas"); b.width = b.height = MASK;
  const bx = b.getContext("2d"); bx.filter = "blur(6px)"; bx.drawImage(c, 0, 0); bx.filter = "none";
  bx.globalCompositeOperation = "source-over"; bx.drawImage(c, 0, 0);
  return b;
}
const PX = MASK / (2 * HE); // px per world unit
function drawText(text, font) {
  return (ctx) => {
    const lines = text.split("\n"), size = 0.5 * PX, lh = size * 1.02;
    ctx.font = font || `600 ${size}px Geist, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const top = MASK / 2 - (lh * lines.length) / 2;
    lines.forEach((l, i) => ctx.fillText(l, MASK / 2, top + lh * (i + 0.5)));
  };
}
function drawFn2d(fn) { return (ctx) => { const s = MASK * 0.86, o = (MASK - s) / 2; ctx.save(); ctx.translate(o, o); fn(ctx, s); ctx.restore(); }; }
function drawWave(time) {
  return (ctx) => {
    for (let b = 0; b < WAVE_BARS; b++) {
      const h = waveEnv(b) * waveLive(b, time) * WAVE_H * PX, x = MASK / 2 + (b - (WAVE_BARS - 1) / 2) * WAVE_SP * PX, w = 0.08 * PX;
      ctx.beginPath(); ctx.roundRect(x - w / 2, MASK / 2 - h / 2, w, h, w / 2); ctx.fill();
    }
  };
}
/* particles sampled from a canvas: world coords, centred, with the centroid shift remembered for the mask */
function pointsFromCanvas(c, count) {
  const img = c.getContext("2d").getImageData(0, 0, MASK, MASK).data, pts = [];
  for (let y = 0; y < MASK; y += 3) for (let x = 0; x < MASK; x += 3) if (img[(y * MASK + x) * 4 + 3] > 120) pts.push(x, y);
  const n = pts.length / 2, out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const j = n ? Math.floor(Math.random() * n) : 0;
    out[i * 3] = ((pts[j * 2] ?? MASK / 2) + Math.random() * 3 - 1.5 - MASK / 2) / PX;
    out[i * 3 + 1] = -((pts[j * 2 + 1] ?? MASK / 2) + Math.random() * 3 - 1.5 - MASK / 2) / PX;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  return centre(out);
}

const SPLAT_VERT = /* glsl */ `attribute float aSize; uniform float uSize; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * aSize * (5.2 / -mv.z); gl_Position = projectionMatrix * mv; }`;
const SPLAT_FRAG = /* glsl */ `precision highp float; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard; float w = 1.0 - r * r; gl_FragColor = vec4(w * w, 0.0, 0.0, 1.0); }`;
const QUAD_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BLUR_FRAG = /* glsl */ `
  precision highp float; uniform sampler2D tD; uniform vec2 uDir; uniform vec2 uRes; varying vec2 vUv;
  void main(){ vec2 st = uDir / uRes; vec4 c = texture2D(tD, vUv) * 0.2270;
    c += (texture2D(tD, vUv + st) + texture2D(tD, vUv - st)) * 0.1946; c += (texture2D(tD, vUv + st * 2.0) + texture2D(tD, vUv - st * 2.0)) * 0.1216;
    c += (texture2D(tD, vUv + st * 3.0) + texture2D(tD, vUv - st * 3.0)) * 0.0540; c += (texture2D(tD, vUv + st * 4.0) + texture2D(tD, vUv - st * 4.0)) * 0.0162; gl_FragColor = c; }
`;
/* the sheet: a height field (waves + stamped shapes + rolling beads − a dent under the cursor) shaded as chrome */
const SHEET_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tD, tA, tB;
  uniform float wA, wB, wP, uHasA, uHasB;
  uniform vec2 uOff, uShiftA, uShiftB, uRes, uPtr;
  uniform float uScale, uHE, uHalfH, uAspect, uPtrS, uTime, uDark, uReveal;
  varying vec2 vUv;
  vec2 world(vec2 uv){ return (uv * 2.0 - 1.0) * vec2(uHalfH * uAspect, uHalfH); }
  float maskAt(sampler2D t, vec2 w, vec2 shift, float has){
    if (has < 0.5) return 0.0;
    vec2 local = (w - uOff) / uScale + shift;
    vec2 uv = local / uHE * 0.5 + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
    return texture2D(t, uv).a;
  }
  float waves(vec2 w){
    return 0.5 * sin(w.x * 1.6 + uTime * 0.45) * sin(w.y * 1.3 - uTime * 0.35) + 0.3 * sin(w.x * 3.1 - uTime * 0.3 + w.y * 1.1) + 0.15 * sin((w.x - w.y) * 5.3 + uTime * 0.7);
  }
  float height(vec2 uv){
    vec2 w = world(uv);
    float m = maskAt(tA, w, uShiftA, uHasA) * wA + maskAt(tB, w, uShiftB, uHasB) * wB;
    m = sqrt(max(m, 0.0));                      // dome profile over the bevel
    float beads = min(1.0, texture2D(tD, uv).r) * wP;
    float dent = uPtrS * exp(-dot(w - uPtr, w - uPtr) * 60.0);
    return waves(w) * 0.13 * uReveal + m * 0.5 + beads * 0.4 - dent * 0.3;
  }
  float band(float x, float c, float w){ return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x)); }
  void main(){
    vec2 px = 1.0 / uRes;
    float h = height(vUv);
    float dx = height(vUv + vec2(px.x, 0.0)) - height(vUv - vec2(px.x, 0.0));
    float dy = height(vUv + vec2(0.0, px.y)) - height(vUv - vec2(0.0, px.y));
    vec3 n = normalize(vec3(-dx * 42.0, -dy * 42.0, 1.0));
    // the eye sits above the sheet, so the view direction changes across the screen
    vec3 v = normalize(vec3((0.5 - vUv.x) * 0.38 * uAspect, (0.5 - vUv.y) * 0.38, 1.0));
    vec3 r = reflect(-v, n);
    float t = clamp((r.y + 0.30) * 0.5 + 0.5, 0.0, 1.0), u = r.x * 0.5 + 0.5;
    // the room: black floor, a hard horizon, a grey sky with one wide softbox
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
    // raised metal catches more light
    col *= 0.9 + 0.3 * smoothstep(0.02, 0.5, h);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSwarm(container, options = {}) {
  const count = options.count || 9000;
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.5);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0, 5.2);
  const halfH = camera.position.z * Math.tan((camera.fov / 2) * Math.PI / 180);

  /* ---------- particles (the beads) ---------- */
  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3);
  const from = new Float32Array(count * 3), to = new Float32Array(count * 3), drop = new Float32Array(count * 3);
  const size = new Float32Array(count), delay = new Float32Array(count), phase = new Float32Array(count);
  for (let i = 0; i < count; i++) { size[i] = 0.6 + Math.random() * 0.9; delay[i] = Math.random(); phase[i] = Math.random() * Math.PI * 2; }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3); posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr); geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const splatU = { uSize: { value: 40 } };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: splatU, vertexShader: SPLAT_VERT, fragmentShader: SPLAT_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  points.frustumCulled = false; scene.add(points);

  /* ---------- render targets ---------- */
  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false };
  const rt = new THREE.WebGLRenderTarget(2, 2, rtOpts), rtB = new THREE.WebGLRenderTarget(2, 2, rtOpts);
  const RT_SCALE = options.rtScale || 0.5;
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const blurU = { tD: { value: rt.texture }, uDir: { value: new THREE.Vector2(1, 0) }, uRes: { value: new THREE.Vector2(2, 2) } };
  const blurScene = new THREE.Scene(); blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: blurU, vertexShader: QUAD_VERT, fragmentShader: BLUR_FRAG, depthWrite: false, depthTest: false })));
  const empty = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); empty.needsUpdate = true;
  const sheetU = {
    tD: { value: rt.texture }, tA: { value: empty }, tB: { value: empty },
    wA: { value: 0 }, wB: { value: 0 }, wP: { value: 1 }, uHasA: { value: 0 }, uHasB: { value: 0 },
    uOff: { value: new THREE.Vector2(0, 0) }, uShiftA: { value: new THREE.Vector2(0, 0) }, uShiftB: { value: new THREE.Vector2(0, 0) },
    uRes: { value: new THREE.Vector2(2, 2) }, uPtr: { value: new THREE.Vector2(99, 99) }, uPtrS: { value: 0 },
    uScale: { value: 1 }, uHE: { value: HE }, uHalfH: { value: halfH }, uAspect: { value: 1 }, uTime: { value: 0 }, uDark: { value: 1 }, uReveal: { value: 1 },
  };
  const sheetScene = new THREE.Scene(); sheetScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: sheetU, vertexShader: QUAD_VERT, fragmentShader: SHEET_FRAG, depthWrite: false, depthTest: false })));

  /* 3d silhouettes are rendered into a mask target in shape space every frame they're on screen */
  const maskRT = new THREE.WebGLRenderTarget(MASK, MASK, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
  const maskRT2 = new THREE.WebGLRenderTarget(MASK, MASK, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
  const maskCam = new THREE.OrthographicCamera(-HE, HE, HE, -HE, 0.1, 20); maskCam.position.set(0, 0, 8);
  const maskScene = new THREE.Scene();
  const maskMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const maskMesh = new THREE.Mesh(new THREE.BufferGeometry(), maskMat); maskScene.add(maskMesh);

  let w = 0, h = 0, aspect = 1, baseSize = 40;
  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh; aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    const rw = Math.max(2, Math.round(w * dpr * RT_SCALE)), rh = Math.max(2, Math.round(h * dpr * RT_SCALE));
    rt.setSize(rw, rh); rtB.setSize(rw, rh);
    blurU.uRes.value.set(rw, rh);
    sheetU.uRes.value.set(w * dpr, h * dpr); sheetU.uAspect.value = aspect;
    baseSize = rh * (options.blob || 0.05);
  }

  /* ---------- shapes: particles + mask ---------- */
  const cache = {};
  function shape(name) {
    if (cache[name]) return cache[name];
    let s;
    if (name === "field") {
      const out = new Float32Array(count * 3), D = 26, c = [];
      for (let k = 0; k < D; k++) c.push([(Math.random() * 2 - 1) * 1.7 * aspect, (Math.random() * 2 - 1) * 1.6, 0]);
      for (let i = 0; i < count; i++) { const k = i % D; out[i * 3] = c[k][0] + (Math.random() - 0.5) * 0.06; out[i * 3 + 1] = c[k][1] + (Math.random() - 0.5) * 0.06; out[i * 3 + 2] = 0; }
      out.bounds = { x: 1.7 * aspect, y: 1.6 }; out.centroid = [0, 0, 0]; out.fixed = true;
      s = { pts: out, tex: null, mask3d: null };
      return (cache[name] = s);
    }
    let canvas = null, geo3 = null;
    if (name.startsWith("text:")) canvas = shapeCanvas(drawText(name.slice(5), options.textFont));
    else if (name.startsWith("draw:")) { const fn = window.SHAPES2D && window.SHAPES2D[name.slice(5)]; canvas = shapeCanvas(fn ? drawFn2d(fn) : () => {}); }
    else if (name.startsWith("logo:")) { const L = window.LOGOS && window.LOGOS[name.slice(5)]; canvas = shapeCanvas(L && window.logoDrawer ? drawFn2d(window.logoDrawer(L.d)) : () => {}); }
    else if (name === "wave") canvas = shapeCanvas(drawWave(0));
    else if (GEOS[name]) geo3 = GEOS[name]();
    if (canvas) {
      const pts = pointsFromCanvas(canvas, count);
      const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      s = { pts, tex, mask3d: null, canvas };
    } else if (geo3) {
      const pts = centre(sampleMesh(geo3.clone(), count));
      geo3.translate(-pts.centroid[0], -pts.centroid[1], -pts.centroid[2]);
      s = { pts, tex: null, mask3d: geo3 };
    } else s = shape("sphere");
    return (cache[name] = s);
  }

  // endpoints of the current morph
  let fromName = "field", toName = "field", fromB = { x: 1, y: 1 }, toB = { x: 1, y: 1 }, fixed = true;
  let morphT = 1, morphDur = 1.2, driven = false, override = null, pending = null;
  let spinAngle = 0, targetScale = 1, curScale = 1, time = 0;
  let fit = { fill: options.fill ?? 0.8, fillX: options.fillX ?? 0.86 };
  const start = shape("field");
  pos.set(start.pts); from.set(start.pts); to.set(start.pts); fromB = toB = start.pts.bounds;

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const effT = (i) => { if (morphT >= 1) return 1; const d = delay[i] * (driven ? 0.12 : 0.3); return ease(Math.min(1, Math.max(0, (morphT - d) / (1 - d)))); };
  const legs = (e) => [e < 0.5 ? (e / 0.5) * (e / 0.5) * (3 - 2 * (e / 0.5)) : 1, e > 0.5 ? ((e - 0.5) / 0.5) * ((e - 0.5) / 0.5) * (3 - 2 * ((e - 0.5) / 0.5)) : 0];

  const DX = 5, DY = 3;
  function buildDroplets() {
    const bx = toB.x || 1, by = toB.y || 1, cx = [], cy = [], cz = [];
    for (let k = 0; k < DX * DY; k++) {
      const gx = k % DX, gy = Math.floor(k / DX);
      cx.push(((gx + 0.5) / DX * 2 - 1) * bx * 1.5 + (Math.random() - 0.5) * 0.5); cy.push(((gy + 0.5) / DY * 2 - 1) * by * 1.5 + (Math.random() - 0.5) * 0.5); cz.push(0);
    }
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const gx = Math.min(DX - 1, Math.max(0, Math.floor((to[i3] / bx * 0.5 + 0.5) * DX))), gy = Math.min(DY - 1, Math.max(0, Math.floor((to[i3 + 1] / by * 0.5 + 0.5) * DY)));
      const k = gy * DX + gx;
      drop[i3] = cx[k] + (Math.random() - 0.5) * 0.04; drop[i3 + 1] = cy[k] + (Math.random() - 0.5) * 0.04; drop[i3 + 2] = 0;
    }
  }
  function freezeFrom() {
    if (morphT >= 1) from.set(to);
    else for (let i = 0; i < count; i++) {
      const e = effT(i), i3 = i * 3, [ga, gb] = legs(e);
      let tx = from[i3] + (drop[i3] - from[i3]) * ga, ty = from[i3 + 1] + (drop[i3 + 1] - from[i3 + 1]) * ga;
      from[i3] = tx + (to[i3] - tx) * gb; from[i3 + 1] = ty + (to[i3 + 1] - ty) * gb; from[i3 + 2] = 0;
    }
    fromName = morphT >= 1 ? toName : "~"; fromB = toB;
  }
  function loadTo(name) {
    const s = shape(name);
    to.set(s.pts); toName = name; toB = s.pts.bounds; fixed = !!s.pts.fixed;
    buildDroplets();
  }
  function setShape(name, dur = 1.2) { freezeFrom(); loadTo(name); morphT = 0; morphDur = dur; driven = false; }
  function setBlend(a, b, t) {
    if (override) { pending = [a, b, t]; return; }
    if (a !== fromName || b !== toName) {
      const A = shape(a), B = shape(b);
      from.set(A.pts); fromName = a; fromB = A.pts.bounds;
      to.set(B.pts); toName = b; toB = B.pts.bounds; fixed = !!B.pts.fixed;
      buildDroplets();
    }
    morphT = Math.min(1, Math.max(0, t)); driven = true;
  }
  function setOverride(name, dur = 0.9) { if (!override) pending = driven ? [fromName, toName, morphT] : null; override = name; setShape(name, dur); }
  function clearOverride(dur = 0.9) {
    if (!override) return;
    override = null;
    if (pending) { const p = pending; pending = null; setShape(p[2] < 0.5 ? p[0] : p[1], dur); driven = false; setTimeout(() => { if (!override) { const q = p; fromName = "~"; setBlend(q[0], q[1], q[2]); } }, dur * 1000 + 50); }
  }
  function fitNow() {
    if (fixed) { targetScale = 1; return; }
    const e = ease(morphT), bx = fromB.x + (toB.x - fromB.x) * e, by = fromB.y + (toB.y - fromB.y) * e;
    targetScale = Math.min((halfH * fit.fill) / by, (halfH * aspect * fit.fillX) / bx, 2.4);
  }

  /* ---------- pointer ---------- */
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, last: 0, s: 0 };
  const tmpV = new THREE.Vector3();
  function setPointer(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect(); if (r.width < 2) return;
    tmpV.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1), 0.5).unproject(camera);
    const dir = tmpV.sub(camera.position).normalize(), dist = -camera.position.z / dir.z;
    const wx = camera.position.x + dir.x * dist, wy = camera.position.y + dir.y * dist;
    const now = performance.now(), dt = Math.max(8, now - pointer.last) / 1000;
    if (pointer.active) { pointer.vx = (wx - pointer.x) / dt; pointer.vy = (wy - pointer.y) / dt; }
    pointer.x = wx; pointer.y = wy; pointer.last = now; pointer.active = true;
  }
  function clearPointer() { pointer.active = false; pointer.vx = pointer.vy = 0; }

  /* ---------- masks for the two endpoints ---------- */
  let maskA = null, maskB = null; // names currently uploaded
  function bindMasks() {
    const A = shape(fromName === "~" ? toName : fromName), B = shape(toName);
    const hasA = fromName !== "~" && !fixedOf(fromName), hasB = !fixedOf(toName);
    sheetU.uHasA.value = hasA ? 1 : 0; sheetU.uHasB.value = hasB ? 1 : 0;
    if (hasA) { sheetU.tA.value = A.mask3d ? maskRT.texture : A.tex; sheetU.uShiftA.value.set(A.pts.centroid[0], A.pts.centroid[1]); }
    if (hasB) { sheetU.tB.value = B.mask3d ? maskRT2.texture : B.tex; sheetU.uShiftB.value.set(B.pts.centroid[0], B.pts.centroid[1]); }
    maskA = fromName; maskB = toName;
  }
  function fixedOf(name) { const s = cache[name]; return !s || !!s.pts.fixed; }
  function render3dMask(name, target) {
    const s = cache[name]; if (!s || !s.mask3d) return;
    maskMesh.geometry = s.mask3d; maskMesh.rotation.y = spinAngle;
    renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(maskScene, maskCam);
  }
  function refreshWave() {
    const s = cache.wave; if (!s) return;
    const ctx = s.canvas.getContext("2d"); ctx.clearRect(0, 0, MASK, MASK); ctx.fillStyle = "#000"; drawWave(time)(ctx); s.tex.needsUpdate = true;
  }

  const R = options.blowRadius || 0.2, F = options.blowForce || 0.5, WIND = options.wind || 0.03;
  let paused = false, raf = 0, last = performance.now();
  const K = 40, DAMP = 0.88;
  function step(dt) {
    time += dt;
    if (!driven && morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
    fitNow();
    curScale += (targetScale - curScale) * Math.min(1, dt * 4);
    splatU.uSize.value = baseSize * Math.min(1.35, Math.max(0.42, curScale / 1.25));
    const spin = IS_3D.has(morphT < 0.5 ? fromName : toName) ? 0.22 : 0;
    spinAngle += dt * spin;
    if (spin === 0) { const k = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2; spinAngle += (k - spinAngle) * Math.min(1, dt * 2.5); }
    const cs = Math.cos(spinAngle), sn = Math.sin(spinAngle);
    const ox = points.position.x, oy = points.position.y, px = pointer.x - ox, py = pointer.y - oy, active = pointer.active;
    const wvx = pointer.vx * WIND, wvy = pointer.vy * WIND;
    const act = morphT < 1 ? Math.sin(Math.PI * morphT) : 0, swirl = act * (options.swirl ?? 0.7);
    const sc = curScale;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3, e = effT(i), [ga, gb] = legs(e);
      let tx = from[i3] + (drop[i3] - from[i3]) * ga, ty = from[i3 + 1] + (drop[i3 + 1] - from[i3 + 1]) * ga, tz = from[i3 + 2] + (drop[i3 + 2] - from[i3 + 2]) * ga;
      tx += (to[i3] - tx) * gb; ty += (to[i3 + 1] - ty) * gb; tz += (to[i3 + 2] - tz) * gb;
      const rx = (cs * tx + sn * tz) * sc, rz = (-sn * tx + cs * tz) * sc; tx = rx; tz = rz; ty = ty * sc + 0.008 * Math.sin(time * 2 + phase[i]);
      if (swirl > 0) { const X = pos[i3] * 1.6, Y = pos[i3 + 1] * 1.6; vel[i3] += (Math.sin(Y * 2.1 + time * 0.9) + Math.cos(Y * 1.3 - time * 0.6)) * swirl * dt; vel[i3 + 1] -= (Math.sin(X * 1.7 - time * 0.8) + Math.cos(X * 1.1 + time * 0.5)) * swirl * dt; }
      let ax = (tx - pos[i3]) * K, ay = (ty - pos[i3 + 1]) * K, az = (tz - pos[i3 + 2]) * K;
      if (active) { const dx = pos[i3] - px, dy = pos[i3 + 1] - py, d2 = dx * dx + dy * dy; if (d2 < R * R) { const d = Math.sqrt(d2) || 0.0001, s = 1 - d / R, push = s * s * F * 60; ax += (dx / d) * push + wvx * s * 60; ay += (dy / d) * push + wvy * s * 60; } }
      vel[i3] = (vel[i3] + ax * dt) * DAMP; vel[i3 + 1] = (vel[i3 + 1] + ay * dt) * DAMP; vel[i3 + 2] = (vel[i3 + 2] + az * dt) * DAMP;
      pos[i3] += vel[i3] * dt * 6; pos[i3 + 1] += vel[i3 + 1] * dt * 6; pos[i3 + 2] += vel[i3 + 2] * dt * 6;
    }
    posAttr.needsUpdate = true;
    pointer.vx *= 0.8; pointer.vy *= 0.8;
    pointer.s += ((active ? 1 : 0) - pointer.s) * Math.min(1, dt * 6);
    // sheet uniforms
    const e = ease(morphT);
    const sm = (x) => x * x * (3 - 2 * x);
    sheetU.wA.value = 1 - sm(Math.min(1, e * 2)); sheetU.wB.value = sm(Math.max(0, e * 2 - 1)); sheetU.wP.value = act * 0.85 + (fixed ? 1 : 0);
    sheetU.uOff.value.set(points.position.x, points.position.y); sheetU.uScale.value = curScale;
    sheetU.uTime.value = time; sheetU.uPtr.value.set(pointer.x, pointer.y); sheetU.uPtrS.value = pointer.s;
    if (fromName !== maskA || toName !== maskB) bindMasks();
    if (fromName === "wave" || toName === "wave") refreshWave();
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused) { last = now; return; }
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    resize(); step(dt);
    if (cache[fromName] && cache[fromName].mask3d) render3dMask(fromName, maskRT);
    if (cache[toName] && cache[toName].mask3d) render3dMask(toName, maskRT2);
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
    blurU.tD.value = rt.texture; blurU.uDir.value.set(1, 0); renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(blurScene, postCam);
    blurU.tD.value = rtB.texture; blurU.uDir.value.set(0, 1); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(blurScene, postCam);
    renderer.setRenderTarget(null); renderer.clear(); renderer.render(sheetScene, postCam);
  }
  resize();
  bindMasks();
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setShape, setBlend, setOverride, clearOverride, setPointer, clearPointer,
    get override() { return override; },
    get halfH() { return halfH; }, get aspect() { return aspect; },
    setFit(f) { fit = { fill: f.fill ?? fit.fill, fillX: f.fillX ?? fit.fillX }; },
    setOffset(x, y = 0) { points.position.x = x; points.position.y = y; },
    get offset() { return { x: points.position.x, y: points.position.y }; },
    setColors(ink, accent, dark = true) { sheetU.uDark.value = dark ? 1 : 0; },
    setPaused(v) { paused = !!v; last = performance.now(); },
    burst(strength = 1) { for (let i = 0; i < count * 3; i++) vel[i] += (Math.random() - 0.5) * 1.2 * strength; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); rt.dispose(); rtB.dispose(); maskRT.dispose(); maskRT2.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createSwarm = createSwarm;
window.dispatchEvent(new Event("swarm-ready"));
