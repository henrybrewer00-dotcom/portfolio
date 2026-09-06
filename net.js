/* =========================================================================
   The network. One layer per section of the page. Scrolling is a forward
   pass: the camera dollies from layer to layer, nodes light up as they come
   into focus, signals run the edges, and touching a node fires it and
   everything downstream of it.

     window.createNet(container, options) -> api
       setFocus(f)          layer index, fractional (scroll-driven)
       setPointer(x, y)     client coords; nodes under it fire
       clearPointer()
       tap(x, y)            a bigger burst at client coords
       burst(layer, u, v)   fire a cluster at (u, v) in [0,1]² of a layer
       wave(layer)          a layer lights up over half a second
       onFire(fn)           fn(nodeIndex, source, energy)
       stats()              { nodes, edges, pulses, fps }
       setPaused(v), destroy()
   ========================================================================= */
import * as THREE from "three";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NODE_VERT = /* glsl */ `
  attribute float aSeed, aAct, aFire;
  uniform float uPx, uTime;
  varying float vAct, vFire, vDepth;
  vec3 drift(vec3 p, float s){
    float k = step(0.0, s);
    return p + k * vec3(sin(uTime * 0.45 + s * 37.0), cos(uTime * 0.38 + s * 23.0), sin(uTime * 0.30 + s * 11.0) * 0.5) * 0.14;
  }
  void main(){
    vec4 mv = modelViewMatrix * vec4(drift(position, aSeed), 1.0);
    float breathe = 1.0 + 0.10 * sin(uTime * 1.6 + aSeed * 40.0);
    float s = (2.0 + 2.6 * aAct + 3.6 * aFire) * breathe;
    gl_PointSize = s * uPx * 30.0 / max(1.0, -mv.z);
    gl_Position = projectionMatrix * mv;
    vAct = aAct; vFire = aFire; vDepth = -mv.z;
  }
`;
const NODE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uAccent;
  varying float vAct, vFire, vDepth;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float core = smoothstep(0.46, 0.20, d);
    float glow = exp(-d * d * 4.5) * 0.55;
    vec3 col = mix(vec3(0.40, 0.42, 0.47), vec3(1.0), vAct);
    col = mix(col, uAccent, clamp(vFire * 1.3, 0.0, 1.0));
    float a = core * (0.30 + 0.70 * vAct) + glow * (0.22 + 0.78 * vAct) + (glow * 2.2 + core) * vFire;
    float fog = smoothstep(36.0, 10.0, vDepth) * 0.93 + 0.07;
    float near = smoothstep(0.8, 4.0, vDepth);
    gl_FragColor = vec4(col * a * fog * near, 1.0);
  }
`;
const EDGE_VERT = /* glsl */ `
  attribute float aT, aPulse, aEnergy, aAct, aSeed;
  uniform float uTime;
  varying float vT, vPulse, vEnergy, vAct, vDepth;
  vec3 drift(vec3 p, float s){
    float k = step(0.0, s);
    return p + k * vec3(sin(uTime * 0.45 + s * 37.0), cos(uTime * 0.38 + s * 23.0), sin(uTime * 0.30 + s * 11.0) * 0.5) * 0.14;
  }
  void main(){
    vec4 mv = modelViewMatrix * vec4(drift(position, aSeed), 1.0);
    gl_Position = projectionMatrix * mv;
    vT = aT; vPulse = aPulse; vEnergy = aEnergy; vAct = aAct; vDepth = -mv.z;
  }
`;
const EDGE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uAccent;
  varying float vT, vPulse, vEnergy, vAct, vDepth;
  void main(){
    float base = 0.030 + 0.15 * vAct;
    vec3 col = vec3(0.78, 0.80, 0.86) * base;
    if (vPulse >= 0.0) {
      float d = abs(vT - vPulse);
      float g = exp(-d * d * 240.0) * vEnergy;
      col += uAccent * g * 1.6;
    }
    float fog = smoothstep(36.0, 10.0, vDepth) * 0.93 + 0.07;
    float near = smoothstep(0.8, 4.0, vDepth);
    gl_FragColor = vec4(col * fog * near, 1.0);
  }
`;

export function createNet(container, options = {}) {
  const L = options.layers || 15, PER = options.perLayer || 96, GAP = options.gap || 6, K = options.k || 3;
  const RX = 7.6, RY = 4.5;
  let FOCUS = 9.5;
  const ink = new THREE.Color(options.ink || "#07080a"), accent = new THREE.Color(options.accent || "#c8ff4d");

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.5);
  renderer.setPixelRatio(dpr); renderer.setClearColor(ink, 1);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 90);
  camera.position.set(0, 0, FOCUS);

  /* ---------- layout: nodes in layered ellipses ---------- */
  const rnd = mulberry32(1414);
  const N = L * PER;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N), layerOf = new Uint16Array(N);
  for (let l = 0; l < L; l++) for (let k = 0; k < PER; k++) {
    const i = l * PER + k, r = Math.sqrt(rnd()), a = rnd() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r * RX; pos[i * 3 + 1] = Math.sin(a) * r * RY; pos[i * 3 + 2] = -l * GAP + (rnd() - 0.5) * 1.8;
    seed[i] = rnd(); layerOf[i] = l;
  }
  /* ---------- edges: each node to its K nearest in the next layer, a few skip two ---------- */
  const src = [], dst = [];
  for (let l = 0; l < L - 1; l++) for (let k = 0; k < PER; k++) {
    const i = l * PER + k, cand = [];
    for (let m = 0; m < PER; m++) { const j = (l + 1) * PER + m, dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1]; cand.push([dx * dx + dy * dy, j]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (let q = 0; q < K; q++) { src.push(i); dst.push(cand[q][1]); }
    if (l < L - 2 && rnd() < 0.08) { src.push(i); dst.push((l + 2) * PER + Math.floor(rnd() * PER)); }
  }
  const E = src.length;
  const out = Array.from({ length: N }, () => []);
  for (let e = 0; e < E; e++) out[src[e]].push(e);

  /* ---------- state ---------- */
  const act = new Float32Array(N), fire = new Float32Array(N), cool = new Float32Array(N);
  const pulse = new Float32Array(E).fill(-1), energy = new Float32Array(E);
  const pend = [];                       // [time, node, energy, source]
  const listeners = [];
  let time = 0, pulses = 0, fps = 60;

  /* ---------- geometry ---------- */
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  nodeGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const aAct = new THREE.BufferAttribute(act, 1), aFire = new THREE.BufferAttribute(fire, 1);
  aAct.setUsage(THREE.DynamicDrawUsage); aFire.setUsage(THREE.DynamicDrawUsage);
  nodeGeo.setAttribute("aAct", aAct); nodeGeo.setAttribute("aFire", aFire);
  const U = { uPx: { value: dpr }, uTime: { value: 0 }, uAccent: { value: accent } };
  const nodeMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: NODE_VERT, fragmentShader: NODE_FRAG, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true });
  scene.add(new THREE.Points(nodeGeo, nodeMat));

  const ePos = new Float32Array(E * 6), eT = new Float32Array(E * 2), eSeed = new Float32Array(E * 2), ePulse = new Float32Array(E * 2).fill(-1), eEnergy = new Float32Array(E * 2), eAct = new Float32Array(E * 2);
  for (let e = 0; e < E; e++) {
    const a = src[e], b = dst[e];
    ePos.set([pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]], e * 6);
    eT[e * 2] = 0; eT[e * 2 + 1] = 1; eSeed[e * 2] = seed[a]; eSeed[e * 2 + 1] = seed[b];
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  edgeGeo.setAttribute("aT", new THREE.BufferAttribute(eT, 1));
  edgeGeo.setAttribute("aSeed", new THREE.BufferAttribute(eSeed, 1));
  const bPulse = new THREE.BufferAttribute(ePulse, 1), bEnergy = new THREE.BufferAttribute(eEnergy, 1), bAct = new THREE.BufferAttribute(eAct, 1);
  bPulse.setUsage(THREE.DynamicDrawUsage); bEnergy.setUsage(THREE.DynamicDrawUsage); bAct.setUsage(THREE.DynamicDrawUsage);
  edgeGeo.setAttribute("aPulse", bPulse); edgeGeo.setAttribute("aEnergy", bEnergy); edgeGeo.setAttribute("aAct", bAct);
  const edgeMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true });
  scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

  /* the layer frames: a thin rectangle on each plane */
  const fPos = [], fT = [], fPulse = [], fEnergy = [], fAct = [], fSeed = [];
  for (let l = 0; l < L; l++) {
    const z = -l * GAP, x = RX * 1.06, y = RY * 1.10, c = [[-x, -y], [x, -y], [x, y], [-x, y]];
    for (let q = 0; q < 4; q++) { const a = c[q], b = c[(q + 1) % 4]; fPos.push(a[0], a[1], z, b[0], b[1], z); fT.push(0, 1); fPulse.push(-1, -1); fEnergy.push(0, 0); fAct.push(0.45, 0.45); fSeed.push(-1, -1); }
  }
  const frameGeo = new THREE.BufferGeometry();
  frameGeo.setAttribute("position", new THREE.Float32BufferAttribute(fPos, 3));
  frameGeo.setAttribute("aT", new THREE.Float32BufferAttribute(fT, 1));
  frameGeo.setAttribute("aPulse", new THREE.Float32BufferAttribute(fPulse, 1));
  frameGeo.setAttribute("aEnergy", new THREE.Float32BufferAttribute(fEnergy, 1));
  frameGeo.setAttribute("aAct", new THREE.Float32BufferAttribute(fAct, 1));
  frameGeo.setAttribute("aSeed", new THREE.Float32BufferAttribute(fSeed, 1));
  scene.add(new THREE.LineSegments(frameGeo, edgeMat));

  /* ---------- firing ---------- */
  function fireNode(i, en, source) {
    if (en < 0.13) return;
    if (fire[i] < en) fire[i] = en;
    for (const e of out[i]) if (pulse[e] < 0) { pulse[e] = 0; energy[e] = en; pulses++; }
    for (const fn of listeners) fn(i, source, en);
  }

  /* ---------- camera + pointer ---------- */
  let focus = 0, focusCur = 0, px = 0, py = 0, ptrOn = false;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ptrW = new THREE.Vector3();
  let w = 2, h = 2;
  function toWorld(cx, cy, outV) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const fz = -focusCur * GAP, t = (fz - ray.ray.origin.z) / ray.ray.direction.z;
    outV.copy(ray.ray.origin).addScaledVector(ray.ray.direction, t);
    return outV;
  }
  function fireAround(wx, wy, R, en, source, limit, respectCool) {
    let n = 0;
    const R2 = R * R;
    for (let i = 0; i < N && n < limit; i++) {
      if (Math.abs(layerOf[i] - focusCur) > 1.2) continue;
      if (respectCool && cool[i] > 0) continue;
      const dx = pos[i * 3] - wx, dy = pos[i * 3 + 1] - wy;
      if (dx * dx + dy * dy < R2) { fireNode(i, en, source); cool[i] = 0.9; n++; }
    }
    return n;
  }

  /* ---------- per-frame ---------- */
  let ambientT = 0.3, boost = 0;
  function step(dt) {
    time += dt; U.uTime.value = time;
    focusCur += (focus - focusCur) * Math.min(1, dt * 6);
    camera.position.z = FOCUS - focusCur * GAP;
    camera.position.x += ((ptrOn ? px : 0) * 0.55 - camera.position.x) * Math.min(1, dt * 2.5);
    camera.position.y += ((ptrOn ? py : 0) * 0.35 - camera.position.y) * Math.min(1, dt * 2.5);
    const fz = -focusCur * GAP;

    // pending fires (waves, bursts)
    for (let q = pend.length - 1; q >= 0; q--) if (pend[q][0] <= time) { const p = pend[q]; pend.splice(q, 1); fireNode(p[1], p[2], p[3]); }

    // the pointer fires what it touches
    if (ptrOn) { toWorld(px * w / 2 + w / 2, -py * h / 2 + h / 2, ptrW); fireAround(ptrW.x, ptrW.y, 1.35, 1.0, "pointer", 3, true); }

    // ambient life near the focused layer
    ambientT -= dt * (1 + 5 * boost); boost *= Math.exp(-dt * 1.6);
    if (ambientT <= 0) {
      ambientT = 0.10 + Math.random() * 0.22;
      const l = Math.max(0, Math.min(L - 1, Math.round(focusCur + (Math.random() - 0.5) * 2)));
      fireNode(l * PER + Math.floor(Math.random() * PER), 0.5 + Math.random() * 0.3, "ambient");
    }

    // nodes: focus activation + decay
    const decay = Math.exp(-dt * 2.8);
    for (let i = 0; i < N; i++) {
      const dz = Math.abs(pos[i * 3 + 2] - fz) / (GAP * 0.95);
      let a = 1 - Math.min(1, dz); a = a * a * (3 - 2 * a);
      act[i] = a; fire[i] *= decay; if (cool[i] > 0) cool[i] -= dt;
    }
    // edges: pulses travel, arrive, pass the signal on
    pulses = 0;
    for (let e = 0; e < E; e++) {
      if (pulse[e] >= 0) {
        pulse[e] += dt * (1.2 + 0.7 * energy[e]);
        if (pulse[e] >= 1) { const en = energy[e] * 0.62; pulse[e] = -1; fireNode(dst[e], en, "signal"); }
        else pulses++;
      }
      const a = (act[src[e]] + act[dst[e]]) * 0.5, p = pulse[e], en = energy[e];
      eAct[e * 2] = a; eAct[e * 2 + 1] = a; ePulse[e * 2] = p; ePulse[e * 2 + 1] = p; eEnergy[e * 2] = en; eEnergy[e * 2 + 1] = en;
    }
    aAct.needsUpdate = true; aFire.needsUpdate = true; bPulse.needsUpdate = true; bEnergy.needsUpdate = true; bAct.needsUpdate = true;
  }

  function resize() {
    const r = container.getBoundingClientRect();
    const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    FOCUS = camera.aspect < 0.8 ? 12.5 : camera.aspect < 1.2 ? 11 : 9.5;
  }

  let paused = false, raf = 0, last = performance.now(), fpsAcc = 0, fpsN = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    resize(); step(dt);
    renderer.render(scene, camera);
  }
  resize(); step(0.016);
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setFocus(f) { focus = Math.max(0, Math.min(L - 1, f)); },
    setPointer(cx, cy) { px = (cx / w) * 2 - 1; py = -((cy / h) * 2 - 1); ptrOn = true; },
    clearPointer() { ptrOn = false; },
    tap(cx, cy) { toWorld(cx, cy, ptrW); fireAround(ptrW.x, ptrW.y, 2.2, 1.25, "tap", 12, false); },
    burst(layer, u, v) {
      const l = Math.max(0, Math.min(L - 1, Math.round(layer))), wx = (u * 2 - 1) * RX, wy = (v * 2 - 1) * RY;
      let n = 0;
      for (let k = 0; k < PER && n < 7; k++) { const i = l * PER + k, dx = pos[i * 3] - wx, dy = pos[i * 3 + 1] - wy; if (dx * dx + dy * dy < 4.5) { pend.push([time + n * 0.04, i, 1.0, "burst"]); n++; } }
      if (!n) pend.push([time, l * PER + Math.floor(Math.random() * PER), 1.0, "burst"]);
    },
    wave(layer) {
      const l = Math.max(0, Math.min(L - 1, Math.round(layer)));
      for (let q = 0; q < 14; q++) pend.push([time + Math.random() * 0.5, l * PER + Math.floor(Math.random() * PER), 0.75, "wave"]);
    },
    excite(v) { boost = Math.min(1, boost + v); },
    onFire(fn) { listeners.push(fn); },
    stats() { return { nodes: N, edges: E, pulses, fps }; },
    setPaused(v) { paused = !!v; last = performance.now(); },
    get focus() { return focusCur; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createNet = createNet;
window.dispatchEvent(new Event("net-ready"));
