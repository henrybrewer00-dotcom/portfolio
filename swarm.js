/* =========================================================================
   The swarm — a full-screen field of ink dots that gathers into whatever
   the page asks for (text, drawings, little 3D models) and steps aside for
   the cursor. Three.js Points + a CPU spring sim.
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

const SHAPES3D = {
  field(count, aspect) { // a flat field covering the whole screen
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
  keycaps(count) { // home row + spacebar
    const parts = [];
    for (let i = 0; i < 5; i++) parts.push([new RoundedBoxGeometry(0.52, 0.34, 0.52, 3, 0.09), [(i - 2) * 0.62, 0.12, -0.1], [-0.35, 0, 0]]);
    parts.push([new RoundedBoxGeometry(2.6, 0.3, 0.46, 3, 0.09), [0, -0.42, 0.42], [-0.35, 0, 0]]);
    return centre(sampleMesh(merged(parts), count));
  },
  car(count) { // S.I.E.G.E.
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
  sub(count) { // ROV submarine
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
  uniform float uSize; uniform float uPixelRatio;
  varying float vMix;
  void main(){ vMix = aMix; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * aSize * uPixelRatio * (3.4 / -mv.z); gl_Position = projectionMatrix * mv; }
`;
const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uInk; uniform vec3 uAccent; uniform float uAlpha;
  varying float vMix;
  void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.3, r) * uAlpha; gl_FragColor = vec4(mix(uInk, uAccent, step(0.88, vMix)), a); }
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
  const uniforms = {
    uSize: { value: options.pointSize || 3.0 }, uPixelRatio: { value: dpr },
    uInk: { value: new THREE.Color(options.ink || "#141414") }, uAccent: { value: new THREE.Color(options.accent || "#ff4d1c") },
    uAlpha: { value: options.alpha ?? 0.92 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let w = 0, h = 0, aspect = 1;
  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh; aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    fitCurrent();
  }

  /* ---------- shapes ---------- */
  const cache = {};
  function shape(name) {
    if (name === "field") return SHAPES3D.field(count, aspect);
    if (cache[name]) return cache[name];
    let arr;
    if (name.startsWith("text:")) arr = flat(textPoints(count, name.slice(5), options.textFont), count, 0.05);
    else if (name.startsWith("draw:")) { const fn = window.SHAPES2D && window.SHAPES2D[name.slice(5)]; arr = flat(fn ? window.sampleDrawing(fn, count) : new Float32Array(count * 2), count, 0.08); }
    else arr = (SHAPES3D[name] || SHAPES3D.sphere)(count);
    cache[name] = arr;
    return arr;
  }

  const start = shape("field");
  pos.set(start); from.set(start); to.set(start);
  let morphT = 1, morphDur = 1.6, current = "field", spin = 0, wobble = 0, spinAngle = 0, targetScale = 1, curScale = 1;
  let bounds = start.bounds, fixed = true, fit = { fill: options.fill ?? 0.8, fillX: options.fillX ?? 0.86 };

  /* scale the shape so it fills the screen (~80% tall / ~86% wide), whichever bites first */
  function fitCurrent() {
    if (fixed) { targetScale = 1; return; }
    targetScale = Math.min((halfH * fit.fill) / bounds.y, (halfH * aspect * fit.fillX) / bounds.x, 2.4);
  }
  function setFit(f) { fit = { fill: f.fill ?? fit.fill, fillX: f.fillX ?? fit.fillX }; fitCurrent(); }
  function setShape(name, dur = 1.6, opts = {}) {
    if (opts.fill !== undefined || opts.fillX !== undefined) fit = { fill: opts.fill ?? fit.fill, fillX: opts.fillX ?? fit.fillX };
    if (name === current && morphT >= 1) { fitCurrent(); return; }
    const target = shape(name);
    from.set(to); to.set(target);
    morphT = 0; morphDur = dur; current = name;
    bounds = target.bounds; fixed = !!target.fixed;
    const is3d = !(name.startsWith("text:") || name.startsWith("draw:") || name === "field");
    spin = opts.spin ?? (is3d ? 0.3 : 0);
    wobble = opts.wobble ?? (is3d ? 0 : 0.12);
    fitCurrent();
  }

  /* ---------- pointer: a soft nudge, not a blast ---------- */
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, last: 0 };
  const tmp = new THREE.Vector3();
  function setPointer(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    if (r.width < 2) return;
    tmp.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1), 0.5).unproject(camera);
    const dir = tmp.sub(camera.position).normalize(), dist = -camera.position.z / dir.z;
    const wx = camera.position.x + dir.x * dist, wy = camera.position.y + dir.y * dist;
    const now = performance.now(), dt = Math.max(8, now - pointer.last) / 1000;
    if (pointer.active) { pointer.vx = (wx - pointer.x) / dt; pointer.vy = (wy - pointer.y) / dt; }
    pointer.x = wx; pointer.y = wy; pointer.last = now; pointer.active = true;
  }
  function clearPointer() { pointer.active = false; pointer.vx = pointer.vy = 0; }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const R = options.blowRadius || 0.17, F = options.blowForce || 0.6, WIND = options.wind || 0.03;
  let paused = false, raf = 0, last = performance.now(), time = 0, nudgeV = 0;
  const K = 36, DAMP = 0.86;

  function step(dt) {
    time += dt;
    if (morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
    curScale += (targetScale - curScale) * Math.min(1, dt * 4);
    spinAngle += dt * spin + nudgeV * dt; nudgeV *= Math.pow(0.02, dt);
    if (spin === 0) { const k = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2; spinAngle += (k - spinAngle) * Math.min(1, dt * 2.5); }
    const tilt = wobble * Math.sin(time * 0.7);
    const cs = Math.cos(spinAngle + tilt), sn = Math.sin(spinAngle + tilt);
    const ox = points.position.x, oy = points.position.y;
    const px = pointer.x - ox, py = pointer.y - oy, active = pointer.active;
    const wvx = pointer.vx * WIND, wvy = pointer.vy * WIND;
    const breathe = curScale * (1 + 0.008 * Math.sin(time * 1.1));
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let e = 1;
      if (morphT < 1) { const d = delay[i] * 0.45; e = ease(Math.min(1, Math.max(0, (morphT - d) / (1 - d)))); }
      let tx = (from[i3] + (to[i3] - from[i3]) * e), ty = (from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e), tz = (from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e);
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
    resize(); step(dt); renderer.render(scene, camera);
  }
  resize();
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setShape, setPointer, clearPointer,
    get shape() { return current; },
    get halfH() { return halfH; }, get aspect() { return aspect; },
    setOffset(x, y = 0) { points.position.x = x; points.position.y = y; },
    get offset() { return { x: points.position.x, y: points.position.y }; },
    setFit,
    nudge(v) { nudgeV += v; },
    setColors(ink, accent) { uniforms.uInk.value.set(ink); uniforms.uAccent.value.set(accent); },
    setPaused(v) { paused = !!v; last = performance.now(); },
    burst(strength = 1) { for (let i = 0; i < count * 3; i++) vel[i] += (Math.random() - 0.5) * 1.2 * strength; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); mat.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createSwarm = createSwarm;
window.dispatchEvent(new Event("swarm-ready"));
