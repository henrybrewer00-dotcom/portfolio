/* =========================================================================
   The swarm — thousands of particles that gather into shapes (bubble,
   keycaps, robot car, submarine, voice waveform, words) and scatter when
   the cursor blows through them. Three.js Points + a CPU spring sim.
   window.createSwarm(container, options) -> api
   ========================================================================= */
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

/* ---------- shape builders (all normalised to roughly radius 1) ---------- */
function merged(parts) {
  const geos = parts.map(([geo, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]]) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(...scale)
    );
    g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
    return g;
  });
  return BufferGeometryUtils.mergeGeometries(geos, false);
}

function sampleMesh(geo, count) {
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
  const out = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    out[i * 3] = p.x; out[i * 3 + 1] = p.y; out[i * 3 + 2] = p.z;
  }
  return out;
}

function normalise(arr, radius = 1) {
  let maxR = 0;
  const n = arr.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += arr[i * 3]; cy += arr[i * 3 + 1]; cz += arr[i * 3 + 2]; }
  cx /= n; cy /= n; cz /= n;
  for (let i = 0; i < n; i++) {
    arr[i * 3] -= cx; arr[i * 3 + 1] -= cy; arr[i * 3 + 2] -= cz;
    const r = Math.hypot(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]);
    if (r > maxR) maxR = r;
  }
  const s = radius / (maxR || 1);
  for (let i = 0; i < arr.length; i++) arr[i] *= s;
  return arr;
}

const SHAPES = {
  scatter(count) {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 2.5, t = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      out[i * 3] = r * s * Math.cos(t); out[i * 3 + 1] = r * u; out[i * 3 + 2] = r * s * Math.sin(t);
    }
    return out;
  },
  sphere(count) {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u);
      const r = 0.98 + Math.random() * 0.04;
      out[i * 3] = r * s * Math.cos(t); out[i * 3 + 1] = r * u; out[i * 3 + 2] = r * s * Math.sin(t);
    }
    return out;
  },
  keycaps(count) {
    // a row of five keys and a spacebar, like the home row of a keyboard
    const parts = [];
    const key = () => new RoundedBoxGeometry(0.52, 0.34, 0.52, 3, 0.09);
    for (let i = 0; i < 5; i++) parts.push([key(), [(i - 2) * 0.62, 0.12, -0.1], [-0.35, 0, 0]]);
    parts.push([new RoundedBoxGeometry(2.6, 0.3, 0.46, 3, 0.09), [0, -0.42, 0.42], [-0.35, 0, 0]]);
    return normalise(sampleMesh(merged(parts), count), 1.05);
  },
  car(count) {
    // S.I.E.G.E. — a chunky rover: body, cabin, sensor mast, four wheels
    const wheel = () => new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24);
    const parts = [
      [new RoundedBoxGeometry(2.0, 0.42, 1.1, 3, 0.08), [0, 0.05, 0]],
      [new RoundedBoxGeometry(0.9, 0.4, 0.9, 3, 0.08), [-0.15, 0.42, 0]],
      [new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), [0.55, 0.55, 0]],
      [new THREE.SphereGeometry(0.11, 12, 10), [0.55, 0.88, 0]],
      [wheel(), [0.65, -0.18, 0.55], [Math.PI / 2, 0, 0]],
      [wheel(), [-0.65, -0.18, 0.55], [Math.PI / 2, 0, 0]],
      [wheel(), [0.65, -0.18, -0.55], [Math.PI / 2, 0, 0]],
      [wheel(), [-0.65, -0.18, -0.55], [Math.PI / 2, 0, 0]],
    ];
    return normalise(sampleMesh(merged(parts), count), 1.05);
  },
  sub(count) {
    // ROV submarine: hull, conning tower, periscope, fins, propeller
    const parts = [
      [new THREE.CapsuleGeometry(0.42, 1.9, 6, 24), [0, 0, 0], [0, 0, Math.PI / 2]],
      [new RoundedBoxGeometry(0.6, 0.4, 0.34, 3, 0.06), [0.15, 0.55, 0]],
      [new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), [0.05, 0.95, 0]],
      [new THREE.BoxGeometry(0.06, 0.5, 1.1), [-1.1, 0, 0]],
      [new THREE.BoxGeometry(0.06, 0.9, 0.5), [-1.1, 0, 0]],
      [new THREE.TorusGeometry(0.22, 0.04, 8, 24), [-1.42, 0, 0], [0, Math.PI / 2, 0]],
      [new THREE.BoxGeometry(0.02, 0.4, 0.1), [-1.42, 0, 0], [Math.PI / 4, 0, 0]],
      [new THREE.BoxGeometry(0.02, 0.4, 0.1), [-1.42, 0, 0], [-Math.PI / 4, 0, 0]],
    ];
    return normalise(sampleMesh(merged(parts), count), 1.1);
  },
  wave(count) {
    // a voice: 28 bars whose heights follow a spoken-word envelope
    const parts = [];
    const bars = 28;
    for (let i = 0; i < bars; i++) {
      const t = i / (bars - 1);
      const env = 0.15 + 0.85 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.8);
      parts.push([new RoundedBoxGeometry(0.09, env * 1.7, 0.09, 2, 0.04), [(i - (bars - 1) / 2) * 0.125, 0, 0]]);
    }
    return normalise(sampleMesh(merged(parts), count), 1.15);
  },
};

/* text becomes a shape by drawing it to a canvas and sampling the ink */
function textShape(count, text, font = "600 150px Geist, sans-serif", depth = 0.05) {
  const c = document.createElement("canvas");
  c.width = 1000; c.height = 280;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.font = font;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts = [];
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (img[(y * c.width + x) * 4 + 3] > 128) pts.push(x, y);
  const out = new Float32Array(count * 3);
  const n = pts.length / 2;
  for (let i = 0; i < count; i++) {
    const j = Math.floor(Math.random() * n);
    out[i * 3] = (pts[j * 2] - c.width / 2) / 280 + (Math.random() - 0.5) * 0.006;
    out[i * 3 + 1] = -(pts[j * 2 + 1] - c.height / 2) / 280 + (Math.random() - 0.5) * 0.006;
    out[i * 3 + 2] = (Math.random() - 0.5) * depth;
  }
  return normalise(out, 1.22);
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aMix;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vMix;
  void main(){
    vMix = aMix;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * aSize * uPixelRatio * (3.4 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uInk; uniform vec3 uAccent; uniform float uAlpha;
  varying float vMix;
  void main(){
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.32, r) * uAlpha;
    vec3 col = mix(uInk, uAccent, step(0.86, vMix));
    gl_FragColor = vec4(col, a);
  }
`;

export function createSwarm(container, options = {}) {
  const count = options.count || 12000;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 2);
  renderer.setPixelRatio(dpr);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0, 5.2);

  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const from = new Float32Array(count * 3);
  const to = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const mixv = new Float32Array(count);
  const delay = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    size[i] = 0.55 + Math.random() * 0.9 + (Math.random() < 0.06 ? 1.2 : 0);
    mixv[i] = Math.random();
    delay[i] = Math.random();
    phase[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr);
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aMix", new THREE.BufferAttribute(mixv, 1));
  const uniforms = {
    uSize: { value: options.pointSize || 3.2 },
    uPixelRatio: { value: dpr },
    uInk: { value: new THREE.Color(options.ink || "#141414") },
    uAccent: { value: new THREE.Color(options.accent || "#ff4d1c") },
    uAlpha: { value: options.alpha ?? 0.9 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // shapes are built lazily and cached
  const cache = {};
  function shape(name) {
    if (cache[name]) return cache[name];
    let arr;
    if (name.startsWith("text:")) arr = textShape(count, name.slice(5), options.textFont);
    else arr = (SHAPES[name] || SHAPES.sphere)(count);
    cache[name] = arr;
    return arr;
  }

  // start scattered
  const scatter = shape("scatter");
  pos.set(scatter); from.set(scatter); to.set(scatter);

  let morphT = 1, morphDur = 1.6, spin = 0.25, current = "scatter";
  let spinAngle = 0;
  function setShape(name, dur = 1.6, opts = {}) {
    if (name === current && morphT >= 1) return;
    const target = shape(name);
    // freeze the current effective target as the morph origin
    from.set(to);
    to.set(target);
    morphT = 0; morphDur = dur; current = name;
    spin = opts.spin ?? (name.startsWith("text:") ? 0.0 : name === "sphere" || name === "scatter" ? 0.25 : 0.32);
  }

  // pointer in swarm space
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, last: 0 };
  const tmp = new THREE.Vector3();
  function setPointer(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    if (r.width < 2) return;
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((clientY - r.top) / r.height) * 2 - 1);
    tmp.set(nx, ny, 0.5).unproject(camera);
    const dir = tmp.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const wx = camera.position.x + dir.x * dist, wy = camera.position.y + dir.y * dist;
    const now = performance.now();
    const dt = Math.max(8, now - pointer.last) / 1000;
    if (pointer.active) { pointer.vx = (wx - pointer.x) / dt; pointer.vy = (wy - pointer.y) / dt; }
    pointer.x = wx; pointer.y = wy; pointer.last = now; pointer.active = true;
  }
  function clearPointer() { pointer.active = false; pointer.vx = pointer.vy = 0; }

  let w = 0, h = 0;
  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width || container.offsetWidth || 2));
    const nh = Math.max(2, Math.round(r.height || container.offsetHeight || 2));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const R = options.blowRadius || 0.42, F = options.blowForce || 9.5, WIND = options.wind || 0.55;
  let paused = false, raf = 0, last = performance.now(), time = 0;
  const K = 34, DAMP = 0.86;

  function step(dt) {
    time += dt;
    if (morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
    spinAngle += dt * spin;
    if (spin === 0) { const k = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2; spinAngle += (k - spinAngle) * Math.min(1, dt * 2.5); }
    const cs = Math.cos(spinAngle), sn = Math.sin(spinAngle);
    const px = pointer.x, py = pointer.y, active = pointer.active;
    const wvx = pointer.vx * WIND, wvy = pointer.vy * WIND;
    const breathe = 1 + 0.012 * Math.sin(time * 1.3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // effective target = eased morph between from and to, with a per-particle delay
      let e = 1;
      if (morphT < 1) { const d = delay[i] * 0.45; e = ease(Math.min(1, Math.max(0, (morphT - d) / (1 - d)))); }
      let tx = from[i3] + (to[i3] - from[i3]) * e;
      let ty = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e;
      let tz = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e;
      // slow spin around Y + a gentle breathe
      const rx = (cs * tx + sn * tz) * breathe, rz = (-sn * tx + cs * tz) * breathe;
      tx = rx; tz = rz; ty *= breathe;
      // shimmer
      ty += 0.012 * Math.sin(time * 2 + phase[i]);
      // spring toward target
      let ax = (tx - pos[i3]) * K, ay = (ty - pos[i3 + 1]) * K, az = (tz - pos[i3 + 2]) * K;
      // the cursor blows particles away
      if (active) {
        const dx = pos[i3] - px, dy = pos[i3 + 1] - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 0.0001;
          const s = (1 - d / R);
          const push = s * s * F * 60;
          ax += (dx / d) * push + wvx * s * 60;
          ay += (dy / d) * push + wvy * s * 60;
          az += (Math.random() - 0.5) * push * 0.6;
        }
      }
      vel[i3] = (vel[i3] + ax * dt) * DAMP;
      vel[i3 + 1] = (vel[i3 + 1] + ay * dt) * DAMP;
      vel[i3 + 2] = (vel[i3 + 2] + az * dt) * DAMP;
      pos[i3] += vel[i3] * dt * 6;
      pos[i3 + 1] += vel[i3 + 1] * dt * 6;
      pos[i3 + 2] += vel[i3 + 2] * dt * 6;
    }
    posAttr.needsUpdate = true;
    // pointer velocity decays when the mouse rests
    pointer.vx *= 0.8; pointer.vy *= 0.8;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused) { last = now; return; }
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt);
    resize();
    renderer.render(scene, camera);
  }
  resize();
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  return {
    setShape,
    setPointer,
    clearPointer,
    get shape() { return current; },
    setColors(ink, accent) { uniforms.uInk.value.set(ink); uniforms.uAccent.value.set(accent); },
    setAlpha(a) { uniforms.uAlpha.value = a; },
    setPaused(v) { paused = !!v; last = performance.now(); },
    burst(strength = 1) { for (let i = 0; i < count * 3; i++) vel[i] += (Math.random() - 0.5) * 2.5 * strength; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); mat.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createSwarm = createSwarm;
window.dispatchEvent(new Event("swarm-ready"));
