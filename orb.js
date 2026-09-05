/* =========================================================================
   The orb — an iridescent, softly-deforming blob rendered with Three.js.
   Exposes window.createOrb(container, options) -> { setPaused, destroy }
   Loaded as an ES module (three comes from the import map in index.html).
   ========================================================================= */
import * as THREE from "three";

const NOISE = /* glsl */ `
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  varying float vDisp;
  ${NOISE}
  float displace(vec3 p){
    float n1 = snoise(p * uFreq + vec3(uTime * 0.18, uTime * 0.11, -uTime * 0.09));
    float n2 = snoise(p * uFreq * 2.3 - vec3(uTime * 0.07, -uTime * 0.13, uTime * 0.05));
    return n1 * uAmp + n2 * uAmp * 0.25;
  }
  void main(){
    float d = displace(position);
    vec3 p = position + normal * d;
    // recompute the normal from neighbours so lighting follows the bumps
    vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.0001)));
    vec3 b = normalize(cross(normal, t));
    float e = 0.02;
    vec3 pt = position + t * e; pt += normal * displace(pt);
    vec3 pb = position + b * e; pb += normal * displace(pb);
    vec3 n = normalize(cross(pt - p, pb - p));
    if (dot(n, normal) < 0.0) n = -n;
    vDisp = d;
    vPos = p;
    vNormal = normalize(normalMatrix * n);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
  uniform float uTime;
  uniform float uGloss;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  varying float vDisp;
  ${NOISE}
  vec3 palette(float t){
    t = clamp(t, 0.0, 1.0);
    if (t < 0.25) return mix(uC0, uC1, t / 0.25);
    if (t < 0.5)  return mix(uC1, uC2, (t - 0.25) / 0.25);
    if (t < 0.75) return mix(uC2, uC3, (t - 0.5) / 0.25);
    return mix(uC3, uC4, (t - 0.75) / 0.25);
  }
  void main(){
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float NdV = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - NdV, 2.2);
    // slow, large colour drift across the surface
    float n = snoise(vPos * 0.7 + vec3(uTime * 0.05, -uTime * 0.03, uTime * 0.04));
    float t = 0.5 + 0.34 * N.x + 0.10 * N.y + 0.16 * n;
    vec3 base = palette(t);
    // warm yellow cap toward the top, like light catching the crown
    float top = smoothstep(0.35, 0.95, N.y + 0.25 * n);
    base = mix(base, vec3(0.98, 0.80, 0.25), top * 0.55);
    // thin-film style shift toward the rim
    vec3 film = mix(uC4, uC3, smoothstep(0.2, 0.9, fres));
    base = mix(base, film, fres * 0.55);
    // key light (top-left) + fill (right) + soft specular
    vec3 L1 = normalize(vec3(-0.6, 0.9, 0.8));
    vec3 L2 = normalize(vec3(0.9, 0.2, 0.5));
    float diff = 0.55 + 0.45 * clamp(dot(N, L1), 0.0, 1.0);
    float fill = 0.25 * clamp(dot(N, L2), 0.0, 1.0);
    vec3 H1 = normalize(L1 + V);
    float spec = pow(clamp(dot(N, H1), 0.0, 1.0), 40.0 * uGloss) * 0.7;
    vec3 H2 = normalize(L2 + V);
    float spec2 = pow(clamp(dot(N, H2), 0.0, 1.0), 20.0) * 0.18;
    vec3 col = base * (diff + fill) + vec3(spec + spec2);
    col = mix(col, vec3(1.0), fres * 0.18);
    // soft, slightly blurred silhouette
    float alpha = smoothstep(0.0, 0.08, NdV + 0.06);
    gl_FragColor = vec4(col, alpha);
  }
`;

const DEFAULT_PALETTE = ["#f2588c", "#ffa066", "#fff1dc", "#f6f8fb", "#8fc4ea"];

export function createOrb(container, options = {}) {
  const palette = (options.palette || DEFAULT_PALETTE).map((c) => new THREE.Color(c));
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.5));
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0, 4.2);

  const uniforms = {
    uTime: { value: options.seed || 0 },
    uAmp: { value: options.amp ?? 0.11 },
    uFreq: { value: options.freq ?? 0.8 },
    uGloss: { value: options.gloss ?? 1.0 },
    uC0: { value: palette[0] }, uC1: { value: palette[1] }, uC2: { value: palette[2] },
    uC3: { value: palette[3] }, uC4: { value: palette[4] },
  };
  const seg = options.segments || 220;
  const geo = new THREE.SphereGeometry(1, seg, seg);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = options.tilt ?? -0.35;
  scene.add(mesh);

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

  let paused = false, raf = 0, last = performance.now();
  const speed = options.speed ?? 1;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += dt * speed;
    mesh.rotation.y += dt * 0.08 * speed;
    resize();
    renderer.render(scene, camera);
  }
  resize();
  renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  return {
    setPaused(v) { paused = !!v; last = performance.now(); },
    renderOnce() { resize(); renderer.render(scene, camera); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); geo.dispose(); mat.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createOrb = createOrb;
window.dispatchEvent(new Event("orb-ready"));
