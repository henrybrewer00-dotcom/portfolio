/* =========================================================================
   The swarm — a full-screen field of ink dots that gathers into whatever
   the page asks for (text, drawings, brand marks, little 3D models) and
   steps aside for the cursor. Three.js Points + a CPU spring sim.

   Two ways to drive it:
     setBlend(a, b, t)   scroll-driven: sit exactly t of the way from shape a to b
     setShape(name, dur) timed morph (load-in, hover overrides, PRESS ME)
   window.createSwarm(container, options) -> api
   ========================================================================= */
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

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
  for (let i = 0; i < n; i++) {
    arr[i * 3] -= cx; arr[i * 3 + 1] -= cy; arr[i * 3 + 2] -= cz;
    mx = Math.max(mx, Math.abs(arr[i * 3])); my = Math.max(my, Math.abs(arr[i * 3 + 1]));
  }
  arr.bounds = { x: mx || 1, y: my || 1 };
  return arr;
}

/* the voice: bars that keep talking — rebuilt every frame from per-dot metadata */
const WAVE_BARS = 30, WAVE_H = 1.5;
const waveEnv = (b) => { const t = b / (WAVE_BARS - 1); return 0.12 + 0.88 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.7); };
function waveUpdate(arr, meta, time) {
  const { bar, u } = meta;
  const n = u.length;
  for (let i = 0; i < n; i++) {
    const b = bar[i];
    const live = 0.55 + 0.45 * Math.sin(time * 2.7 + b * 0.63 + 0.9 * Math.sin(time * 1.3 + b * 0.21));
    arr[i * 3 + 1] = u[i] * waveEnv(b) * live * WAVE_H;
  }
}
const DYNAMIC = { wave: waveUpdate };

const SHAPES3D = {
  field(count, aspect) {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { out[i * 3] = (Math.random() * 2 - 1) * 1.6 * aspect; out[i * 3 + 1] = (Math.random() * 2 - 1) * 1.6; out[i * 3 + 2] = (Math.random() - 0.5) * 0.4; }
    out.bounds = { x: 1.6 * aspect, y: 1.6 }; out.fixed = true;
    return out;
  },
  sphere(count) {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u), r = 0.97 + Math.random() * 0.06;
      out[i * 3] = r * s * Math.cos(t); out[i * 3 + 1] = r * u; out[i * 3 + 2] = r * s * Math.sin(t);
    }
    return centre(out);
  },
  wave(count) {
    const out = new Float32Array(count * 3);
    const bar = new Int16Array(count), u = new Float32Array(count);
    const sp = 0.115;
    for (let i = 0; i < count; i++) {
      bar[i] = Math.floor(Math.random() * WAVE_BARS); u[i] = Math.random() * 2 - 1;
      out[i * 3] = (bar[i] - (WAVE_BARS - 1) / 2) * sp + (Math.random() - 0.5) * 0.085;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.06;
    }
    out.meta = { bar, u };
    waveUpdate(out, out.meta, 0);
    out.bounds = { x: (WAVE_BARS / 2) * sp, y: WAVE_H };
    return out;
  },
  keycaps(count) {
    const parts = [];
    for (let i = 0; i < 5; i++) parts.push([new RoundedBoxGeometry(0.52, 0.34, 0.52, 3, 0.09), [(i - 2) * 0.62, 0.12, -0.1], [-0.35, 0, 0]]);
    parts.push([new RoundedBoxGeometry(2.6, 0.3, 0.46, 3, 0.09), [0, -0.42, 0.42], [-0.35, 0, 0]]);
    return centre(sampleMesh(merged(parts), count));
  },
  car(count) {
    const wheel = () => new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24);
    return centre(sampleMesh(merged([
      [new RoundedBoxGeometry(2.0, 0.42, 1.1, 3, 0.08), [0, 0.05, 0]],
      [new RoundedBoxGeometry(0.9, 0.4, 0.9, 3, 0.08), [-0.15, 0.42, 0]],
      [new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), [0.55, 0.55, 0]],
      [new THREE.SphereGeometry(0.11, 12, 10), [0.55, 0.88, 0]],
      [wheel(), [0.65, -0.18, 0.55], [Math.PI / 2, 0, 0]], [wheel(), [-0.65, -0.18, 0.55], [Math.PI / 2, 0, 0]],
      [wheel(), [0.65, -0.18, -0.55], [Math.PI / 2, 0, 0]], [wheel(), [-0.65, -0.18, -0.55], [Math.PI / 2, 0, 0]],
    ]), count));
  },
  sub(count) {
    return centre(sampleMesh(merged([
      [new THREE.CapsuleGeometry(0.42, 1.9, 6, 24), [0, 0, 0], [0, 0, Math.PI / 2]],
      [new RoundedBoxGeometry(0.6, 0.4, 0.34, 3, 0.06), [0.15, 0.55, 0]],
      [new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), [0.05, 0.95, 0]],
      [new THREE.BoxGeometry(0.06, 0.5, 1.1), [-1.1, 0, 0]], [new THREE.BoxGeometry(0.06, 0.9, 0.5), [-1.1, 0, 0]],
      [new THREE.TorusGeometry(0.22, 0.04, 8, 24), [-1.42, 0, 0], [0, Math.PI / 2, 0]],
      [new THREE.BoxGeometry(0.02, 0.4, 0.1), [-1.42, 0, 0], [Math.PI / 4, 0, 0]], [new THREE.BoxGeometry(0.02, 0.4, 0.1), [-1.42, 0, 0], [-Math.PI / 4, 0, 0]],
    ]), count));
  },
};
const IS_3D = new Set(["sphere", "keycaps", "car", "sub"]);

/* text and drawings become flat shapes with a whisper of depth */
function flat(pts2, count, depth = 0.06) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { out[i * 3] = pts2[i * 2]; out[i * 3 + 1] = pts2[i * 2 + 1]; out[i * 3 + 2] = (Math.random() - 0.5) * depth; }
  return centre(out);
}
function textPoints(count, text, font) {
  const lines = text.split("\n");
  const c = document.createElement("canvas");
  const size = 150, lh = size * 1.02;
  c.width = 1400; c.height = Math.round(lh * lines.length + 60);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000"; ctx.font = font || `500 ${size}px Geist, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, 30 + lh * (i + 0.5)));
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts = [];
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (img[(y * c.width + x) * 4 + 3] > 128) pts.push(x, y);
  const n = pts.length / 2, out = new Float32Array(count * 2), k = 1 / 300;
  for (let i = 0; i < count; i++) {
    const j = Math.floor(Math.random() * n);
    out[i * 2] = ((pts[j * 2] ?? c.width / 2) - c.width / 2 + Math.random() * 2 - 1) * k;
    out[i * 2 + 1] = -((pts[j * 2 + 1] ?? c.height / 2) - c.height / 2 + Math.random() * 2 - 1) * k;
  }
  return out;
}

const VERT = /* glsl */ `
  attribute float aSize; attribute float aMix;
  uniform float uSize;
  varying float vMix;
  void main(){ vMix = aMix; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * aSize * (5.2 / -mv.z); gl_Position = projectionMatrix * mv; }
`;
/* each dot splats a soft mound of density; the surface is carved out of the sum */
const FRAG = /* glsl */ `
  precision highp float;
  varying float vMix;
  void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard; float w = 1.0 - r * r; w = w * w; gl_FragColor = vec4(w, w * vMix, 0.0, 1.0); }
`;
const POST_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const POST_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tD; uniform vec2 uRes; uniform float uTh; uniform vec3 uAccent; uniform float uDark; uniform float uTime;
  varying vec2 vUv;
  float dens(vec2 uv){ return texture2D(tD, uv).r; }
  void main(){
    vec2 px = 1.0 / uRes;
    float d = dens(vUv);
    // a slightly blurred gradient keeps the surface rolling instead of pebbly
    float dx = (dens(vUv + vec2(px.x, 0.0)) - dens(vUv - vec2(px.x, 0.0))) * 0.5 + (dens(vUv + vec2(2.5 * px.x, 0.0)) - dens(vUv - vec2(2.5 * px.x, 0.0))) * 0.25;
    float dy = (dens(vUv + vec2(0.0, px.y)) - dens(vUv - vec2(0.0, px.y))) * 0.5 + (dens(vUv + vec2(0.0, 2.5 * px.y)) - dens(vUv - vec2(0.0, 2.5 * px.y))) * 0.25;
    float w = max(fwidth(d) * 1.4, 0.012);
    float a = smoothstep(uTh - w, uTh + w, d);
    if (a < 0.004) discard;
    // treat density as height: rims are steep, the middle is a gently rolling surface
    vec3 n = normalize(vec3(-dx * 6.0, -dy * 6.0, 0.7 + 0.4 * smoothstep(uTh, uTh + 0.8, d)));
    vec3 v = vec3(0.0, 0.0, 1.0);
    vec3 r = reflect(-v, n);
    float t = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
    // a studio around it: dark floor, bright sky, a sharp horizon
    vec3 floorC = mix(vec3(0.46, 0.45, 0.44), vec3(0.20), uDark);
    vec3 skyC = vec3(0.99, 0.98, 0.96);
    vec3 env = mix(floorC, skyC, smoothstep(0.28, 0.76, t));
    float horizon = smoothstep(0.45, 0.50, t) * (1.0 - smoothstep(0.50, 0.55, t));
    env = mix(env, vec3(0.16), horizon * 0.8);
    // a second, softer band so the reflections read as a room and not a gradient
    float band = smoothstep(0.62, 0.66, t) * (1.0 - smoothstep(0.70, 0.80, t));
    env = mix(env, vec3(0.62), band * 0.35);
    float fres = pow(1.0 - max(n.z, 0.0), 1.8);
    vec3 col = mix(env, vec3(0.04), fres * 0.6);
    vec3 L1 = normalize(vec3(-0.45, 0.8, 0.5)), L2 = normalize(vec3(0.7, -0.2, 0.6));
    col += pow(max(dot(normalize(L1 + v), n), 0.0), 90.0) * 1.1;
    col += pow(max(dot(normalize(L2 + v), n), 0.0), 50.0) * 0.3;
    col = mix(col, col * (uAccent * 1.5 + 0.2), 0.05);
    gl_FragColor = vec4(col, a);
  }
`;

export function createSwarm(container, options = {}) {
  const count = options.count || 16000;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 2);
  renderer.setPixelRatio(dpr);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0, 5.2);
  const halfH = camera.position.z * Math.tan((camera.fov / 2) * Math.PI / 180);

  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3);
  const from = new Float32Array(count * 3), to = new Float32Array(count * 3);
  const size = new Float32Array(count), mixv = new Float32Array(count), delay = new Float32Array(count), phase = new Float32Array(count);
  for (let i = 0; i < count; i++) { size[i] = 0.5 + Math.random() * 0.9 + (Math.random() < 0.05 ? 1.1 : 0); mixv[i] = Math.random(); delay[i] = Math.random(); phase[i] = Math.random() * Math.PI * 2; }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3); posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr);
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aMix", new THREE.BufferAttribute(mixv, 1));
  const uniforms = { uSize: { value: 40 } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // the liquid: splat density at half resolution, then carve + shade it full screen
  const RT_SCALE = options.rtScale || 0.5;
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false });
  const postUniforms = {
    tD: { value: rt.texture }, uRes: { value: new THREE.Vector2(2, 2) }, uTh: { value: options.threshold ?? 0.9 },
    uAccent: { value: new THREE.Color(options.accent || "#ff4d1c") }, uDark: { value: 0 }, uTime: { value: 0 },
  };
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({ uniforms: postUniforms, vertexShader: POST_VERT, fragmentShader: POST_FRAG, transparent: true, depthWrite: false, depthTest: false });
  postMat.extensions = { derivatives: true };
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
  renderer.autoClear = false;

  let w = 0, h = 0, aspect = 1, baseSize = 40;
  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh; aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    const rw = Math.max(2, Math.round(w * dpr * RT_SCALE)), rh = Math.max(2, Math.round(h * dpr * RT_SCALE));
    rt.setSize(rw, rh);
    postUniforms.uRes.value.set(rw, rh);
    baseSize = rh * (options.blob || 0.05);
  }

  /* ---------- shapes ---------- */
  const cache = {};
  function shape(name) {
    if (name === "field") return SHAPES3D.field(count, aspect);
    if (cache[name]) return cache[name];
    let arr;
    if (name.startsWith("text:")) arr = flat(textPoints(count, name.slice(5), options.textFont), count, 0.05);
    else if (name.startsWith("draw:")) { const fn = window.SHAPES2D && window.SHAPES2D[name.slice(5)]; arr = flat(fn ? window.sampleDrawing(fn, count) : new Float32Array(count * 2), count, 0.08); }
    else if (name.startsWith("logo:")) { const L = window.LOGOS && window.LOGOS[name.slice(5)]; arr = flat(L && window.logoDrawer ? window.sampleDrawing(window.logoDrawer(L.d), count, 360) : new Float32Array(count * 2), count, 0.08); }
    else arr = (SHAPES3D[name] || SHAPES3D.sphere)(count);
    cache[name] = arr;
    return arr;
  }

  // the two endpoints of the current morph
  let fromName = "field", toName = "field", fromMeta = null, toMeta = null, fromB = { x: 1, y: 1 }, toB = { x: 1, y: 1 }, fixed = true;
  let morphT = 1, morphDur = 1.2, driven = false; // driven: morphT comes from scroll, not time
  let override = null, pending = null;
  let spinAngle = 0, targetScale = 1, curScale = 1, time = 0;
  let fit = { fill: options.fill ?? 0.8, fillX: options.fillX ?? 0.86 };
  const start = shape("field");
  pos.set(start); from.set(start); to.set(start); fromB = toB = start.bounds;

  function loadTo(name) {
    const arr = shape(name);
    to.set(arr); toName = name; toMeta = arr.meta || null; toB = arr.bounds; fixed = !!arr.fixed;
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const effT = (i) => { if (morphT >= 1) return 1; const d = delay[i] * 0.3; return ease(Math.min(1, Math.max(0, (morphT - d) / (1 - d)))); };

  /* freeze whatever the dots are currently heading for as the new "from" */
  function freezeFrom() {
    if (morphT >= 1) { from.set(to); }
    else for (let i = 0; i < count; i++) { const e = effT(i), i3 = i * 3; from[i3] += (to[i3] - from[i3]) * e; from[i3 + 1] += (to[i3 + 1] - from[i3 + 1]) * e; from[i3 + 2] += (to[i3 + 2] - from[i3 + 2]) * e; }
    fromName = toName; fromMeta = toMeta; fromB = toB;
    if (morphT < 1) { fromName = "~"; fromMeta = null; }
  }
  function setShape(name, dur = 1.2) {
    freezeFrom();
    loadTo(name);
    morphT = 0; morphDur = dur; driven = false;
  }
  function setBlend(a, b, t) {
    if (override) { pending = [a, b, t]; return; }
    if (a !== fromName || b !== toName) {
      const A = shape(a), B = shape(b);
      from.set(A); fromName = a; fromMeta = A.meta || null; fromB = A.bounds;
      to.set(B); toName = b; toMeta = B.meta || null; toB = B.bounds; fixed = !!B.fixed;
    }
    morphT = Math.min(1, Math.max(0, t)); driven = true;
  }
  function setOverride(name, dur = 0.9) {
    if (!override) pending = driven ? [fromName, toName, morphT] : null;
    override = name; setShape(name, dur);
  }
  function clearOverride(dur = 0.9) {
    if (!override) return;
    override = null;
    if (pending) { const p = pending; pending = null; freezeFrom(); loadTo(p[1]); const A = shape(p[0]); /* land back on the scroll blend via a short timed morph */ const tmp = new Float32Array(to.length); for (let i = 0; i < count; i++) { const i3 = i * 3, e = ease(p[2]); tmp[i3] = A[i3] + (to[i3] - A[i3]) * e; tmp[i3 + 1] = A[i3 + 1] + (to[i3 + 1] - A[i3 + 1]) * e; tmp[i3 + 2] = A[i3 + 2] + (to[i3 + 2] - A[i3 + 2]) * e; } to.set(tmp); toName = "~"; toMeta = null; morphT = 0; morphDur = dur; driven = false; }
  }

  function fitNow() {
    if (fixed) { targetScale = 1; return; }
    const e = ease(morphT), bx = fromB.x + (toB.x - fromB.x) * e, by = fromB.y + (toB.y - fromB.y) * e;
    targetScale = Math.min((halfH * fit.fill) / by, (halfH * aspect * fit.fillX) / bx, 2.4);
  }

  /* ---------- pointer: a soft nudge ---------- */
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, last: 0 };
  const tmpV = new THREE.Vector3();
  function setPointer(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    if (r.width < 2) return;
    tmpV.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1), 0.5).unproject(camera);
    const dir = tmpV.sub(camera.position).normalize(), dist = -camera.position.z / dir.z;
    const wx = camera.position.x + dir.x * dist, wy = camera.position.y + dir.y * dist;
    const now = performance.now(), dt = Math.max(8, now - pointer.last) / 1000;
    if (pointer.active) { pointer.vx = (wx - pointer.x) / dt; pointer.vy = (wy - pointer.y) / dt; }
    pointer.x = wx; pointer.y = wy; pointer.last = now; pointer.active = true;
  }
  function clearPointer() { pointer.active = false; pointer.vx = pointer.vy = 0; }

  const R = options.blowRadius || 0.17, F = options.blowForce || 0.6, WIND = options.wind || 0.03;
  let paused = false, raf = 0, last = performance.now();
  const K = 40, DAMP = 0.88;

  function step(dt) {
    time += dt;
    if (!driven && morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
    if (fromMeta && DYNAMIC[fromName]) DYNAMIC[fromName](from, fromMeta, time);
    if (toMeta && DYNAMIC[toName]) DYNAMIC[toName](to, toMeta, time);
    fitNow();
    curScale += (targetScale - curScale) * Math.min(1, dt * 4);
    uniforms.uSize.value = baseSize * Math.min(1.35, Math.max(0.42, curScale / 1.25));
    const spin = IS_3D.has(morphT < 0.5 ? fromName : toName) ? 0.22 : 0;
    spinAngle += dt * spin;
    if (spin === 0) { const k = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2; spinAngle += (k - spinAngle) * Math.min(1, dt * 2.5); }
    const cs = Math.cos(spinAngle), sn = Math.sin(spinAngle);
    const ox = points.position.x, oy = points.position.y;
    const px = pointer.x - ox, py = pointer.y - oy, active = pointer.active;
    const wvx = pointer.vx * WIND, wvy = pointer.vy * WIND;
    const breathe = curScale * (1 + 0.008 * Math.sin(time * 1.1));
    // while shapes are changing, a slow swirl runs through the liquid
    const act = morphT < 1 ? Math.sin(Math.PI * Math.min(1, Math.max(0, morphT))) : 0;
    const swirl = act * (options.swirl ?? 0.7);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3, e = effT(i);
      if (swirl > 0) {
        const X = pos[i3] * 1.6, Y = pos[i3 + 1] * 1.6;
        vel[i3] += (Math.sin(Y * 2.1 + time * 0.9) + Math.cos(Y * 1.3 - time * 0.6)) * swirl * dt;
        vel[i3 + 1] -= (Math.sin(X * 1.7 - time * 0.8) + Math.cos(X * 1.1 + time * 0.5)) * swirl * dt;
      }
      let tx = from[i3] + (to[i3] - from[i3]) * e, ty = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e, tz = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e;
      const rx = (cs * tx + sn * tz) * breathe, rz = (-sn * tx + cs * tz) * breathe;
      tx = rx; tz = rz; ty = ty * breathe + 0.01 * Math.sin(time * 2 + phase[i]);
      let ax = (tx - pos[i3]) * K, ay = (ty - pos[i3 + 1]) * K, az = (tz - pos[i3 + 2]) * K;
      if (active) {
        const dx = pos[i3] - px, dy = pos[i3 + 1] - py, d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 0.0001, s = 1 - d / R, push = s * s * F * 60;
          ax += (dx / d) * push + wvx * s * 60; ay += (dy / d) * push + wvy * s * 60; az += (Math.random() - 0.5) * push * 0.4;
        }
      }
      vel[i3] = (vel[i3] + ax * dt) * DAMP; vel[i3 + 1] = (vel[i3 + 1] + ay * dt) * DAMP; vel[i3 + 2] = (vel[i3 + 2] + az * dt) * DAMP;
      pos[i3] += vel[i3] * dt * 6; pos[i3 + 1] += vel[i3 + 1] * dt * 6; pos[i3 + 2] += vel[i3 + 2] * dt * 6;
    }
    posAttr.needsUpdate = true;
    pointer.vx *= 0.8; pointer.vy *= 0.8;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused) { last = now; return; }
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    resize(); step(dt);
    postUniforms.uTime.value = time;
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.clear(); renderer.render(postScene, postCam);
  }
  resize();
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setShape, setBlend, setOverride, clearOverride, setPointer, clearPointer,
    get override() { return override; },
    get halfH() { return halfH; }, get aspect() { return aspect; },
    setFit(f) { fit = { fill: f.fill ?? fit.fill, fillX: f.fillX ?? fit.fillX }; },
    setOffset(x, y = 0) { points.position.x = x; points.position.y = y; },
    get offset() { return { x: points.position.x, y: points.position.y }; },
    setColors(ink, accent, dark = false) { postUniforms.uAccent.value.set(accent); postUniforms.uDark.value = dark ? 1 : 0; },
    setThreshold(v) { postUniforms.uTh.value = v; },
    setPaused(v) { paused = !!v; last = performance.now(); },
    burst(strength = 1) { for (let i = 0; i < count * 3; i++) vel[i] += (Math.random() - 0.5) * 1.2 * strength; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); mat.dispose(); postMat.dispose(); rt.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createSwarm = createSwarm;
window.dispatchEvent(new Event("swarm-ready"));
