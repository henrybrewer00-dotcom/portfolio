/* =========================================================================
   Henry's little planet — the game. A small low-poly world you drive the
   S.I.E.G.E. rover around. Every project is a landmark somewhere on the
   globe: find all of them. Coins along the roads, a dog that runs from the
   rover, a compass on the ground pointing to the nearest stop you haven't
   found.

   window.createGame(container, options) -> api
     input(x, z, boost)   -1..1 on each axis (keys or joystick)
     setPointer / clearPointer
     hotTool(slug), setPaused(v), stats(), reset()
     on(event, fn): enter(stopIndex), leave(stopIndex), coin(total), dog(), tick(stats)
   ========================================================================= */
import * as THREE from "three";

const R = 7.0;                       // planet radius
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);

/* ---------- small deterministic noise ---------- */
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(93);
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), u), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), u), v),
           l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), u), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), u), v), w);
}

/* ---------- palette + primitives ---------- */
const C = { grass: 0x7fb069, grass2: 0x6a9a58, sand: 0xd9c38a, water: 0x4f9fd8, snow: 0xf2f4f6, dirt: 0x9a7b55, wood: 0x8d6a45, wood2: 0x6f5236, stone: 0xbfb9ad, dark: 0x2b2a33, white: 0xf4f1ea, red: 0xe25b3a, orange: 0xf29e4c, yellow: 0xf6d55c, blue: 0x4c7dd6, teal: 0x3fb2a3, pink: 0xf08aa8, metal: 0x9aa3ad, black: 0x1e1d24, leaf: 0x5c9c53, leaf2: 0x4f8a48, glass: 0xbfe6ff };
const mats = {};
function mat(c, o = {}) { const k = c + JSON.stringify(o); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.92, metalness: 0, ...o })); }
function mesh(geo, c, x = 0, y = 0, z = 0, o) { const m = new THREE.Mesh(geo, mat(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }
const box = (w, h, d, c, x, y, z, o) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z, o);
const cyl = (rt, rb, h, c, x, y, z, seg = 12, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y, z, o);
const cone = (r, h, c, x, y, z, seg = 8) => mesh(new THREE.ConeGeometry(r, h, seg), c, x, y, z);
const ball = (r, c, x, y, z, seg = 10, o) => mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), c, x, y, z, o);

/* text on a plank: a canvas texture */
function textTexture(lines, opts = {}) {
  const W = opts.w || 1024, H = opts.h || 256, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = opts.bg || "#f4f1ea"; ctx.fillRect(0, 0, W, H);
  if (opts.border) { ctx.strokeStyle = opts.border; ctx.lineWidth = 14; ctx.strokeRect(7, 7, W - 14, H - 14); }
  ctx.fillStyle = opts.fg || "#1e1d24"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const n = lines.length, size = opts.size || Math.min(H / (n * 1.15), W / (Math.max(...lines.map((l) => l.length)) * 0.6));
  ctx.font = `${opts.weight || 600} ${size}px ${opts.font || "Geist, system-ui, sans-serif"}`;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + (i - (n - 1) / 2) * size * 1.1));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function plank(lines, w, h, opts = {}) {
  const t = textTexture(lines, opts);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), [mat(C.wood2), mat(C.wood2), mat(C.wood2), mat(C.wood2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), mat(C.wood2)]);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function logoTexture(d, label) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const ctx = cv.getContext("2d");
  ctx.fillStyle = "#f4f1ea"; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#8d6a45"; ctx.lineWidth = 10; ctx.strokeRect(5, 5, 246, 246);
  ctx.fillStyle = "#1e1d24";
  if (d && window.Path2D) { ctx.save(); ctx.translate(48, 40); ctx.scale(160 / 24, 160 / 24); ctx.fill(new Path2D(d)); ctx.restore(); }
  else { ctx.font = "600 44px Geist, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label || "?", 128, 128); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- landmarks (each returns a Group standing on y = 0, facing +z) ---------- */
function tree(s = 1, c = C.leaf) { const g = new THREE.Group(); g.add(cyl(0.05 * s, 0.07 * s, 0.35 * s, C.wood, 0, 0.17 * s, 0, 6)); g.add(cone(0.28 * s, 0.5 * s, c, 0, 0.55 * s, 0, 7)); g.add(cone(0.22 * s, 0.4 * s, c, 0, 0.8 * s, 0, 7)); return g; }
const LM = {
  house() {
    const g = new THREE.Group();
    g.add(box(1.0, 0.6, 0.8, C.white, 0, 0.3, 0));
    const roof = cone(0.85, 0.5, C.red, 0, 0.85, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof);
    g.add(box(0.22, 0.34, 0.04, C.wood2, 0.25, 0.17, 0.41)); g.add(box(0.2, 0.2, 0.04, C.glass, -0.25, 0.36, 0.41));
    g.add(box(0.16, 0.36, 0.16, C.stone, 0.28, 0.9, -0.2));
    g.add(box(0.5, 0.3, 0.6, C.stone, 0.85, 0.15, 0.05)); // the garage
    g.add(box(0.36, 0.22, 0.02, C.dark, 0.85, 0.13, 0.36));
    const t1 = tree(0.8); t1.position.set(-0.85, 0, 0.1); g.add(t1);
    return g;
  },
  sign(text) { const g = new THREE.Group(); g.add(cyl(0.035, 0.045, 0.9, C.wood, 0, 0.45, 0, 6)); const p = plank([text], 1.15, 0.36, { size: 150, bg: "#f4f1ea", border: "#8d6a45" }); p.position.set(0, 0.85, 0); g.add(p); return g; },
  billboard(lines) {
    const g = new THREE.Group();
    g.add(cyl(0.05, 0.06, 1.1, C.wood, -0.7, 0.55, 0, 6)); g.add(cyl(0.05, 0.06, 1.1, C.wood, 0.7, 0.55, 0, 6));
    const p = plank(lines, 2.1, 1.05, { w: 1024, h: 512, size: 140, border: "#8d6a45" }); p.position.set(0, 1.35, 0.02); g.add(p);
    g.add(box(0.5, 0.06, 0.1, C.metal, -0.7, 1.9, 0.12)); g.add(box(0.5, 0.06, 0.1, C.metal, 0.7, 1.9, 0.12));
    return g;
  },
  bust() {
    const g = new THREE.Group();
    g.add(box(0.5, 0.35, 0.5, C.stone, 0, 0.175, 0)); g.add(cyl(0.18, 0.2, 0.3, C.stone, 0, 0.5, 0, 8));
    g.add(box(0.6, 0.18, 0.28, C.white, 0, 0.72, 0)); g.add(cyl(0.08, 0.08, 0.15, C.white, 0, 0.86, 0, 8)); g.add(ball(0.2, C.white, 0, 1.06, 0, 10));
    const t = tree(0.9, C.leaf2); t.position.set(0.7, 0, -0.2); g.add(t);
    return g;
  },
  lighthouse() {
    const g = new THREE.Group();
    g.add(cyl(0.22, 0.3, 1.3, C.white, 0, 0.65, 0, 10));
    for (let i = 0; i < 3; i++) g.add(cyl(0.26 - i * 0.02, 0.27 - i * 0.02, 0.16, C.red, 0, 0.25 + i * 0.4, 0, 10));
    g.add(cyl(0.24, 0.24, 0.08, C.dark, 0, 1.34, 0, 10)); g.add(cyl(0.16, 0.16, 0.26, C.yellow, 0, 1.5, 0, 8, { emissive: 0xffe08a, emissiveIntensity: 0.9 }));
    g.add(cone(0.24, 0.22, C.red, 0, 1.74, 0, 10));
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    beam.rotation.z = Math.PI / 2; beam.position.set(1.35, 1.5, 0); const pivot = new THREE.Group(); pivot.position.set(0, 0, 0); pivot.add(beam); g.add(pivot);
    g.userData.anim = (t) => { pivot.rotation.y = t * 0.9; };
    g.add(box(0.7, 0.14, 0.7, C.stone, 0, 0.07, 0));
    return g;
  },
  phone() {
    const g = new THREE.Group();
    g.add(box(0.5, 0.95, 0.5, C.red, 0, 0.475, 0)); g.add(box(0.36, 0.55, 0.52, C.glass, 0, 0.5, 0)); g.add(box(0.56, 0.1, 0.56, C.dark, 0, 1.0, 0));
    const bars = []; for (let i = 0; i < 7; i++) { const b = box(0.07, 0.3, 0.07, C.teal, -0.45 + i * 0.15, 1.35, 0); bars.push(b); g.add(b); }
    g.userData.anim = (t) => { bars.forEach((b, i) => { const h = 0.12 + 0.3 * Math.abs(Math.sin(t * 3.1 + i * 0.9) * Math.sin(t * 1.3 + i)); b.scale.y = h / 0.3; b.position.y = 1.2 + h / 2; }); };
    const cot = box(0.7, 0.45, 0.6, C.white, 1.0, 0.225, -0.1); g.add(cot); const r2 = cone(0.6, 0.35, C.orange, 1.0, 0.62, -0.1, 4); r2.rotation.y = Math.PI / 4; g.add(r2);
    return g;
  },
  trophies() {
    const g = new THREE.Group();
    g.add(box(1.5, 0.3, 0.7, C.stone, 0, 0.15, 0));
    [-0.5, 0, 0.5].forEach((x, i) => { g.add(cyl(0.06, 0.1, 0.12, C.dark, x, 0.36, 0, 8)); g.add(cyl(0.16, 0.06, 0.28, C.yellow, x, 0.56, 0, 10, { metalness: 0.4, roughness: 0.5 })); g.add(cyl(0.05, 0.05, 0.08, C.yellow, x, 0.4, 0, 8)); });
    return g;
  },
  camera() {
    const g = new THREE.Group();
    [-0.25, 0.25, 0].forEach((x, i) => { const leg = cyl(0.025, 0.025, 1.0, C.dark, x * 0.9, 0.5, i === 2 ? -0.3 : 0.15, 6); leg.rotation.z = -x * 0.5; leg.rotation.x = i === 2 ? -0.3 : 0.15; g.add(leg); });
    g.add(box(0.5, 0.32, 0.3, C.dark, 0, 1.15, 0)); g.add(cyl(0.11, 0.11, 0.3, C.metal, 0, 1.15, 0.28, 12)); g.add(cyl(0.14, 0.14, 0.05, C.red, 0, 1.15, 0.45, 12, { emissive: 0xff3b1f, emissiveIntensity: 0.8 }));
    const r1 = cyl(0.16, 0.16, 0.06, C.dark, -0.14, 1.42, 0, 12), r2 = cyl(0.16, 0.16, 0.06, C.dark, 0.14, 1.42, 0, 12); r1.rotation.x = r2.rotation.x = Math.PI / 2; g.add(r1); g.add(r2);
    g.userData.anim = (t) => { r1.rotation.y = t * 2; r2.rotation.y = -t * 2; };
    return g;
  },
  drivethru() {
    const g = new THREE.Group();
    g.add(box(1.4, 0.7, 0.9, C.white, 0, 0.35, 0)); g.add(box(1.5, 0.12, 1.0, C.red, 0, 0.76, 0));
    g.add(box(0.5, 0.35, 0.04, C.glass, 0.3, 0.4, 0.46)); g.add(box(0.3, 0.1, 0.3, C.dark, -0.4, 0.35, 0.55));
    g.add(cyl(0.04, 0.04, 1.4, C.metal, -0.95, 0.7, 0.2, 6));
    g.add(cyl(0.22, 0.25, 0.1, C.orange, -0.95, 1.45, 0.2, 12)); g.add(cyl(0.24, 0.24, 0.07, C.wood, -0.95, 1.37, 0.2, 12)); g.add(cyl(0.24, 0.24, 0.05, C.leaf, -0.95, 1.31, 0.2, 12)); g.add(cyl(0.2, 0.24, 0.09, C.orange, -0.95, 1.24, 0.2, 12));
    return g;
  },
  stage() {
    const g = new THREE.Group();
    g.add(box(1.6, 0.25, 0.9, C.dark, 0, 0.125, 0));
    [-0.4, 0.4].forEach((x) => { g.add(cyl(0.02, 0.02, 0.7, C.metal, x, 0.6, 0.15, 6)); g.add(ball(0.07, C.metal, x, 0.98, 0.15, 8)); });
    g.add(box(0.35, 0.5, 0.35, C.black, -0.95, 0.5, -0.2)); g.add(box(0.35, 0.5, 0.35, C.black, 0.95, 0.5, -0.2));
    g.add(cyl(0.12, 0.12, 0.04, C.metal, -0.95, 0.55, -0.02, 10)); g.add(cyl(0.12, 0.12, 0.04, C.metal, 0.95, 0.55, -0.02, 10));
    const spot = box(0.12, 0.12, 0.2, C.dark, 0, 1.4, -0.3); g.add(cyl(0.02, 0.02, 1.5, C.metal, -0.7, 0.9, -0.4, 6)); g.add(cyl(0.02, 0.02, 1.5, C.metal, 0.7, 0.9, -0.4, 6)); g.add(box(1.5, 0.05, 0.05, C.metal, 0, 1.65, -0.4)); g.add(spot);
    g.userData.anim = (t) => { spot.rotation.y = Math.sin(t * 1.5) * 0.6; };
    return g;
  },
  doghouse() {
    const g = new THREE.Group();
    g.add(box(0.7, 0.5, 0.7, C.wood, 0, 0.25, 0)); const roof = cone(0.6, 0.35, C.red, 0, 0.67, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof);
    g.add(cyl(0.16, 0.16, 0.05, C.dark, 0, 0.22, 0.36, 12));
    const p = plank(["🐾 PawBot"], 0.9, 0.3, { size: 110 }); p.position.set(0.85, 0.7, 0.1); g.add(p); g.add(cyl(0.03, 0.03, 0.6, C.wood, 0.85, 0.3, 0.1, 6));
    g.add(ball(0.1, C.white, -0.55, 0.1, 0.25, 8)); g.add(ball(0.08, C.white, -0.66, 0.16, 0.32, 8));
    return g;
  },
  garage() {
    const g = new THREE.Group();
    g.add(box(1.2, 0.7, 1.0, C.metal, 0, 0.35, 0)); g.add(box(1.3, 0.08, 1.1, C.dark, 0, 0.74, 0));
    g.add(box(0.7, 0.5, 0.03, C.dark, 0, 0.28, 0.51)); g.add(box(0.7, 0.06, 0.03, C.orange, 0, 0.56, 0.52));
    g.add(cyl(0.16, 0.16, 0.1, C.black, 0.8, 0.08, 0.3, 12)); g.add(cyl(0.16, 0.16, 0.1, C.black, 0.85, 0.24, 0.3, 12));
    g.add(box(0.3, 0.02, 0.5, C.wood, -0.8, 0.3, 0.2)); g.add(box(0.04, 0.3, 0.04, C.wood, -0.92, 0.15, 0.4)); g.add(box(0.04, 0.3, 0.04, C.wood, -0.68, 0.15, 0.0));
    const p = plank(["S.I.E.G.E."], 1.0, 0.3, { size: 120, bg: "#2b2a33", fg: "#f4f1ea" }); p.position.set(0, 0.95, 0.4); g.add(p);
    return g;
  },
  ocean() {
    const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.35, transparent: true, opacity: 0.85 })); w.rotation.x = -Math.PI / 2; w.position.y = 0.02; w.receiveShadow = true; g.add(w);
    const sub = new THREE.Group();
    const hull = mesh(new THREE.CapsuleGeometry(0.16, 0.6, 4, 10), C.yellow); hull.rotation.z = Math.PI / 2; sub.add(hull);
    sub.add(box(0.22, 0.16, 0.14, C.yellow, 0.05, 0.2, 0)); sub.add(cyl(0.015, 0.015, 0.3, C.metal, 0.0, 0.42, 0, 6)); sub.add(box(0.03, 0.2, 0.3, C.yellow, -0.42, 0.0, 0));
    sub.add(mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), C.metal, -0.5, 0, 0)); sub.children[sub.children.length - 1].rotation.y = Math.PI / 2;
    sub.position.set(0.1, 0.05, 0.2); g.add(sub);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0.1, 0.03, 0.2); g.add(ring);
    g.userData.anim = (t) => { sub.position.y = 0.02 + Math.sin(t * 1.4) * 0.05; sub.rotation.z = Math.sin(t * 0.9) * 0.05; const s = 0.6 + ((t * 0.4) % 1) * 1.2; ring.scale.set(s, s, 1); ring.material.opacity = 0.4 * (1 - ((t * 0.4) % 1)); };
    return g;
  },
  graph() {
    const g = new THREE.Group();
    g.add(cyl(0.05, 0.07, 1.1, C.wood, 0, 0.55, 0, 6));
    const branch = cyl(0.035, 0.045, 0.8, C.wood, 0.28, 0.9, 0, 6); branch.rotation.z = -0.7; g.add(branch);
    const b2 = cyl(0.03, 0.04, 0.6, C.wood, -0.22, 1.1, 0, 6); b2.rotation.z = 0.6; g.add(b2);
    [[0, 1.15, C.teal], [0.55, 1.2, C.pink], [-0.45, 1.38, C.yellow], [0, 0.2, C.blue]].forEach(([x, y, c]) => g.add(ball(0.11, c, x, y, 0, 10, { emissive: c, emissiveIntensity: 0.25 })));
    const p = plank(["merged"], 0.8, 0.26, { size: 110, bg: "#f4f1ea" }); p.position.set(0.75, 0.45, 0.15); g.add(p); g.add(cyl(0.03, 0.03, 0.4, C.wood, 0.75, 0.2, 0.15, 6));
    return g;
  },
  crates(tools) {
    const g = new THREE.Group(); const crates = {};
    const rows = [[0, 1, 2, 3], [4, 5, 6], [7, 8], [9]];
    rows.forEach((row, r) => row.forEach((i, k) => {
      const slug = tools[i]; if (!slug) return;
      const L = window.LOGOS && window.LOGOS[slug]; const t = logoTexture(L && L.d, L && L.label);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
      m.castShadow = m.receiveShadow = true;
      m.position.set((k - (row.length - 1) / 2) * 0.46, 0.21 + r * 0.44, r * 0.02); g.add(m); crates[slug] = m;
    }));
    g.userData.crates = crates;
    return g;
  },
  scoreboard() {
    const g = new THREE.Group();
    g.add(cyl(0.04, 0.05, 1.0, C.metal, -0.45, 0.5, 0, 6)); g.add(cyl(0.04, 0.05, 1.0, C.metal, 0.45, 0.5, 0, 6));
    const p = plank(["99.5"], 1.3, 0.7, { w: 1024, h: 512, size: 300, bg: "#2b2a33", fg: "#f6d55c", weight: 700 }); p.position.set(0, 1.3, 0); g.add(p);
    g.add(box(0.14, 0.06, 0.06, C.red, 0, 0.7, 0.05));
    return g;
  },
  mailbox() {
    const g = new THREE.Group();
    g.add(box(0.06, 0.8, 0.06, C.wood, 0, 0.4, 0));
    const bx = mesh(new THREE.CapsuleGeometry(0.16, 0.34, 4, 10), C.blue); bx.rotation.z = Math.PI / 2; bx.position.set(0, 0.9, 0); g.add(bx);
    g.add(box(0.28, 0.02, 0.24, C.blue, 0, 0.74, 0)); g.add(box(0.03, 0.18, 0.06, C.red, 0.18, 1.08, 0.12));
    const p = plank(["hire me"], 0.9, 0.28, { size: 110, bg: "#e25b3a", fg: "#f4f1ea" }); p.position.set(0.7, 0.55, 0.1); g.add(p); g.add(cyl(0.03, 0.03, 0.45, C.wood, 0.7, 0.22, 0.1, 6));
    const rocket = new THREE.Group(); rocket.add(cyl(0.09, 0.09, 0.5, C.white, 0, 0.35, 0, 10)); rocket.add(cone(0.09, 0.2, C.red, 0, 0.7, 0, 10)); [0, 1, 2].forEach((i) => { const f = box(0.05, 0.16, 0.12, C.red, 0, 0.1, 0); f.rotation.y = (i * TAU) / 3; f.position.set(Math.cos((i * TAU) / 3) * 0.1, 0.1, Math.sin((i * TAU) / 3) * 0.1); rocket.add(f); });
    rocket.position.set(-0.7, 0, -0.1); g.add(rocket);
    return g;
  },
};

/* ---------- the rover ---------- */
function makeRover() {
  const g = new THREE.Group(), body = new THREE.Group();
  body.add(box(0.62, 0.16, 0.34, C.orange, 0, 0.2, 0)); body.add(box(0.3, 0.14, 0.3, C.white, -0.05, 0.34, 0));
  body.add(box(0.12, 0.05, 0.3, C.dark, 0.2, 0.36, 0)); body.add(cyl(0.012, 0.012, 0.36, C.metal, 0.18, 0.55, 0, 5)); body.add(ball(0.045, C.red, 0.18, 0.74, 0, 8, { emissive: 0xff3b1f, emissiveIntensity: 0.7 }));
  body.add(box(0.1, 0.05, 0.05, C.glass, 0.31, 0.22, 0.1)); body.add(box(0.1, 0.05, 0.05, C.glass, 0.31, 0.22, -0.1));
  const wheels = [];
  [[0.2, 0.19], [-0.2, 0.19], [0.2, -0.19], [-0.2, -0.19]].forEach(([x, z]) => { const w = cyl(0.11, 0.11, 0.08, C.black, x, 0.11, z, 10); w.rotation.x = Math.PI / 2; const hub = cyl(0.05, 0.05, 0.09, C.metal, 0, 0, 0, 8); w.add(hub); wheels.push(w); g.add(w); });
  g.add(body); g.userData.body = body; g.userData.wheels = wheels;
  return g;
}


/* ---------- the dog (from S.I.E.G.E.: "chases my dogs around") ---------- */
function makeDog() {
  const g = new THREE.Group();
  g.add(box(0.34, 0.16, 0.16, C.wood, 0, 0.2, 0)); g.add(box(0.16, 0.14, 0.14, C.wood, 0.22, 0.3, 0)); g.add(box(0.05, 0.08, 0.03, C.wood2, 0.26, 0.4, 0.06)); g.add(box(0.05, 0.08, 0.03, C.wood2, 0.26, 0.4, -0.06));
  g.add(box(0.04, 0.04, 0.04, C.black, 0.31, 0.3, 0));
  const tail = box(0.12, 0.03, 0.03, C.wood, -0.22, 0.28, 0); tail.rotation.z = 0.6; g.add(tail);
  const legs = [[0.12, 0.06], [-0.12, 0.06], [0.12, -0.06], [-0.12, -0.06]].map(([x, z]) => { const l = box(0.05, 0.14, 0.05, C.wood2, x, 0.07, z); g.add(l); return l; });
  g.userData.legs = legs; g.userData.tail = tail;
  return g;
}
function makeCoin() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 14), mat(C.yellow, { metalness: 0.5, roughness: 0.4, emissive: 0xf6d55c, emissiveIntensity: 0.25 }));
  m.rotation.z = Math.PI / 2; m.castShadow = true; return m;
}

export function createGame(container, options = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.5);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x0d1024, 1);
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d1024, 16, 34);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const small = !!options.small;
  const CAM = new THREE.Vector3(0, R + 3.6, small ? 10.2 : 8.0), LOOK = new THREE.Vector3(0, R + 0.1, -0.9);
  camera.position.copy(CAM); camera.lookAt(LOOK);

  /* ---------- light ---------- */
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.4); sun.position.set(-6, R + 8, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 40; sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -6; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target); sun.target.position.set(0, R, 0);
  scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x3a2f2f, 0.75));
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  /* ---------- the planet ---------- */
  const planet = new THREE.Group(); scene.add(planet);
  const geo = new THREE.IcosahedronGeometry(R, 6);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), cg = new THREE.Color(), tmp = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    tmp.fromBufferAttribute(pos, i); const n = tmp.clone().normalize();
    const h = noise3(n.x * 3.1 + 5, n.y * 3.1 + 7, n.z * 3.1 + 9) * 0.7 + noise3(n.x * 7 + 1, n.y * 7 + 2, n.z * 7 + 3) * 0.3;
    const bump = (h - 0.5) * 0.16;
    tmp.copy(n).multiplyScalar(R + bump); pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    if (bump < -0.04) cg.setHex(C.sand); else cg.setHex(h > 0.55 ? C.grass2 : C.grass);
    col[i * 3] = cg.r; col[i * 3 + 1] = cg.g; col[i * 3 + 2] = cg.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  ground.receiveShadow = true; ground.castShadow = true; planet.add(ground);

  /* helpers on the sphere */
  const stand = (obj, n, yaw = 0) => { obj.position.copy(n).multiplyScalar(R - 0.02); obj.quaternion.setFromUnitVectors(UP, n); if (yaw) obj.rotateY(yaw); };
  const fromFlat = (u, v) => new THREE.Vector3(u, R, -v).normalize();   // tangent offsets at the start (x right, v forward)
  const dist = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * R;   // arc length between unit vectors

  /* ---------- stops ---------- */
  const stopsIn = options.stops || [];
  const stops = [];        // { i, n (unit, planet-local), group, radius, found, kind }
  const spiral = []; {
    const cand = []; for (let k = 0; k < 90; k++) { const y = 1 - (2 * (k + 0.5)) / 90, r = Math.sqrt(1 - y * y), ph = k * 2.399963 + 0.7; cand.push(new THREE.Vector3(Math.cos(ph) * r, y, Math.sin(ph) * r)); }
    cand.sort((a, b) => a.angleTo(UP) - b.angleTo(UP));
    for (const c of cand) { if (spiral.length >= 14) break; if (c.angleTo(UP) < 0.62) continue; if (spiral.some((s) => s.angleTo(c) < 0.66)) continue; spiral.push(c); }
  }
  let signK = 0, projK = 0, crateGroup = null;
  stopsIn.forEach((s, i) => {
    let n;
    if (s.kind === "house") n = fromFlat(-1.6, 0.4);
    else if (s.kind === "sign") { n = fromFlat(signK % 2 ? 1.4 : -1.4, 1.8 + signK * 1.5); signK++; }
    else if (s.kind === "billboard") n = fromFlat(0, 8.6);
    else n = spiral[projK++ % spiral.length];
    let g;
    if (s.kind === "sign") g = LM.sign(s.arg);
    else if (s.kind === "billboard") g = LM.billboard((s.arg || "").split("|"));
    else if (s.kind === "crates") g = crateGroup = LM.crates(options.tools || []);
    else g = (LM[s.kind] || LM.sign)(s.kind);
    g.scale.setScalar(0.9);
    stand(g, n, s.kind === "house" ? 0.9 : 0); planet.add(g);
    stops.push({ i, n, group: g, radius: s.kind === "billboard" ? 1.2 : s.kind === "sign" ? 0.35 : s.kind === "ocean" ? 1.3 : 0.9, found: false, kind: s.kind, face: s.kind === "sign" || s.kind === "billboard" || s.kind === "scoreboard" });
  });

  /* trees and rocks, away from the stops */
  const props = [];
  for (let i = 0; i < 220; i++) {
    const th = rnd() * TAU, ph = Math.acos(rnd() * 2 - 1); const n = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
    if (stops.some((s) => dist(s.n, n) < s.radius + 1.6)) continue;
    if (dist(n, UP) < 1.6) continue;
    const isTree = rnd() < 0.8;
    const t = isTree ? tree(0.5 + rnd() * 0.6, rnd() < 0.5 ? C.leaf : C.leaf2) : (() => { const g = new THREE.Group(); g.add(ball(0.1 + rnd() * 0.12, C.stone, 0, 0.05, 0, 6)); return g; })();
    stand(t, n, rnd() * TAU); planet.add(t); props.push({ n, r: isTree ? 0.32 : 0.2 });
  }

  /* ---------- coins along three great circles ---------- */
  const coins = [];
  for (const s of stops) {
    if (s.kind === "sign" || s.kind === "house" || s.kind === "billboard") continue;
    const t0 = new THREE.Vector3(1, 0, 0).cross(s.n).normalize(), t1 = s.n.clone().cross(t0).normalize();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU, rr = (s.radius + 1.0) / R; const n = s.n.clone().multiplyScalar(Math.cos(rr)).addScaledVector(t0, Math.sin(rr) * Math.cos(a)).addScaledVector(t1, Math.sin(rr) * Math.sin(a)).normalize(); const m = makeCoin(); m.position.copy(n).multiplyScalar(R + 0.2); m.quaternion.setFromUnitVectors(UP, n); planet.add(m); coins.push({ n, m, got: false, phase: rnd() * TAU }); }
  }
  for (let c = 0; c < 3; c++) {
    const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    const a0 = new THREE.Vector3(1, 0, 0).cross(axis).normalize();
    for (let k = 0; k < 26; k++) {
      const n = a0.clone().applyAxisAngle(axis, (k / 26) * TAU);
      if (stops.some((s) => dist(s.n, n) < s.radius + 0.5)) continue;
      const m = makeCoin(); m.position.copy(n).multiplyScalar(R + 0.2); m.quaternion.setFromUnitVectors(UP, n); planet.add(m);
      coins.push({ n, m, got: false, phase: rnd() * TAU });
    }
  }

  /* ---------- the rover, on top of the world ---------- */
  const rover = makeRover(); rover.position.set(0, R + 0.005, 0); scene.add(rover);
  /* the compass: an arrow on the ground that points to the nearest stop you haven't found */
  const compass = new THREE.Group();
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 3), new THREE.MeshBasicMaterial({ color: 0xf6d55c, transparent: true, opacity: 0.85 })); arrow.rotation.x = -Math.PI / 2; arrow.rotation.z = Math.PI; arrow.position.z = -0.95; compass.add(arrow);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.66, 40), new THREE.MeshBasicMaterial({ color: 0xf6d55c, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; compass.add(ring);
  compass.position.set(0, R + 0.03, 0); scene.add(compass);

  /* ---------- the dog ---------- */
  const dog = makeDog(); planet.add(dog);
  const dogS = { n: fromFlat(2.6, -1.2), yaw: 0, state: "wander", wanderT: 0, dir: new THREE.Vector3(1, 0, 0), bark: 0 };
  stand(dog, dogS.n);

  /* ---------- sky ---------- */
  const starGeo = new THREE.BufferGeometry(), NS = 1600, sp = new Float32Array(NS * 3), ss = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { const th = rnd() * TAU, ph = Math.acos(rnd() * 2 - 1), r = 70 + rnd() * 30; sp[i * 3] = r * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); sp[i * 3 + 2] = r * Math.cos(ph); ss[i] = rnd(); }
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3)); starGeo.setAttribute("aSeed", new THREE.BufferAttribute(ss, 1));
  const starMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPx: { value: dpr } }, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute float aSeed; uniform float uTime, uPx; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float tw = 0.6 + 0.4 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0); vA = tw * (0.4 + 0.6 * aSeed); gl_PointSize = (1.2 + 1.8 * aSeed) * uPx; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `precision highp float; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0; float a = smoothstep(1.0, 0.3, d) * vA; gl_FragColor = vec4(vec3(0.92, 0.95, 1.0), a); }` });
  scene.add(new THREE.Points(starGeo, starMat));
  const moon = ball(0.4, C.stone, 0, 0, 0, 10); moon.castShadow = false; scene.add(moon);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 48, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `varying vec3 vN, vV; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `precision highp float; varying vec3 vN, vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.2); gl_FragColor = vec4(vec3(0.45, 0.65, 1.0) * f * 1.6, f); }` }));
  scene.add(atmo);
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group(); const n = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) { const b = ball(0.14 + rnd() * 0.16, C.white, (k - n / 2) * 0.18, rnd() * 0.06, (rnd() - 0.5) * 0.1, 8, { roughness: 1 }); b.castShadow = true; g.add(b); }
    const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(); const start = rnd() * TAU; const rad = R + 1.1 + rnd() * 0.6;
    clouds.push({ g, axis, start, rad, speed: 0.02 + rnd() * 0.03 }); scene.add(g);
  }
  /* dust puffs + sparkles */
  const NP = 70, puffs = []; for (let i = 0; i < NP; i++) { const p = ball(0.05, C.sand, 0, -10, 0, 6, { transparent: true, opacity: 0.6 }); p.material = p.material.clone(); p.castShadow = false; p.receiveShadow = false; scene.add(p); puffs.push({ m: p, life: 0, v: new THREE.Vector3(), c: 0 }); }
  let puffHead = 0;
  function puff(x, z, color = C.sand, up = 0.5, scale = 1) { const p = puffs[puffHead]; puffHead = (puffHead + 1) % NP; p.m.position.set(x, R + 0.06, z); p.life = 1; p.v.set((Math.random() - 0.5) * 0.6, up + Math.random() * 0.5, (Math.random() - 0.5) * 0.6); p.m.material.color.setHex(color); p.m.scale.setScalar((0.6 + Math.random() * 0.6) * scale); }

  /* ---------- state ---------- */
  let w = 2, h = 2, aspect = 1;
  function resize() {
    const r = container.getBoundingClientRect(); const nw = Math.max(2, Math.round(r.width)), nh = Math.max(2, Math.round(r.height));
    if (nw === w && nh === h) return; w = nw; h = nh; aspect = w / h; renderer.setSize(w, h, false); camera.aspect = aspect; camera.updateProjectionMatrix();
  }
  const input = { x: 0, z: 0, boost: false };
  const vel = new THREE.Vector3(), heading = new THREE.Vector3(0, 0, -1);
  let yaw = 0, speed = 0, time = 0, playTime = 0, running = false, wheelSpin = 0, hot = null, nearStop = -1, coinsGot = 0, dogCaught = false, bounce = 0;
  const pointer = { x: 0, y: 0, active: false }, camOff = new THREE.Vector3(), camLead = new THREE.Vector3();
  const handlers = {}; const emit = (ev, ...a) => { (handlers[ev] || []).forEach((fn) => fn(...a)); };
  const q = new THREE.Quaternion(), axis = new THREE.Vector3(), wp = new THREE.Vector3(), tan = new THREE.Vector3();
  const MAX = 4.2, BOOST = 7.0;

  function worldOf(n, out) { return out.copy(n).applyQuaternion(planet.quaternion); }
  function localDir(worldDir, out) { return out.copy(worldDir).applyQuaternion(planet.quaternion.clone().invert()); }
  /* roll the planet so the rover moves by `d` along world tangent `dir` */
  function roll(dir, d) { if (d === 0) return; axis.crossVectors(dir, UP).normalize(); q.setFromAxisAngle(axis, d / R); planet.quaternion.premultiply(q); }
  /* move a planet-local unit vector along a world tangent direction */
  function moveLocal(n, worldDir, d) { const a = axis.crossVectors(worldOf(n, wp).normalize(), worldDir).normalize(); localDir(a, tan); n.applyAxisAngle(tan, d / R).normalize(); }

  function step(dt) {
    time += dt; if (running) playTime += dt;
    // --- drive
    const want = new THREE.Vector3(input.x, 0, -input.z);
    const mag = Math.min(1, want.length());
    if (mag > 0.05) want.normalize().multiplyScalar(mag * (input.boost ? BOOST : MAX));
    else want.set(0, 0, 0);
    const accel = mag > 0.05 ? 6.5 : 4.5;
    vel.lerp(want, Math.min(1, dt * accel));
    speed = vel.length();
    if (speed > 0.15) { const target = Math.atan2(vel.x, -vel.z); let d = target - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * 9); }
    heading.set(Math.sin(yaw), 0, -Math.cos(yaw));
    if (speed > 0.001) { const dir = vel.clone().normalize(); roll(dir, speed * dt); }
    // collisions: stops and trees push the rover back out
    for (const s of stops) {
      worldOf(s.n, wp); if (wp.y < 0) continue;
      const dd = dist(s.n.clone().applyQuaternion(planet.quaternion), UP);   // arc from the top
      const rr = s.radius * 0.9 + 0.35;
      if (dd < rr) { const push = new THREE.Vector3(-wp.x, 0, -wp.z); if (push.lengthSq() < 1e-6) push.set(1, 0, 0); push.normalize(); roll(push, rr - dd); const along = vel.dot(push); if (along < 0) vel.addScaledVector(push, -along * 1.4); bounce = 1; }
    }
    for (const p of props) {
      worldOf(p.n, wp); if (wp.y < R * 0.8) continue;
      const dd = dist(wp.clone().normalize(), UP), rr = p.r + 0.3;
      if (dd < rr) { const push = new THREE.Vector3(-wp.x, 0, -wp.z).normalize(); roll(push, rr - dd); const along = vel.dot(push); if (along < 0) vel.addScaledVector(push, -along * 1.2); }
    }
    // rover body
    wheelSpin += (speed * dt) / 0.11;
    rover.userData.wheels.forEach((wh) => { wh.rotation.y = wheelSpin; });
    rover.rotation.y = Math.PI / 2 - yaw;
    const body = rover.userData.body;
    bounce *= Math.exp(-dt * 8);
    body.position.y = Math.abs(Math.sin(time * 16)) * 0.012 * Math.min(1, speed * 0.4) + bounce * 0.06;
    const turn = Math.atan2(Math.sin(Math.atan2(vel.x, -vel.z) - yaw), 1);
    body.rotation.x += (-(speed > 0.15 ? turn : 0) * 0.35 - body.rotation.x) * Math.min(1, dt * 6);
    body.rotation.z += ((input.boost ? 0.06 : 0) * Math.min(1, speed / MAX) - body.rotation.z) * Math.min(1, dt * 5);
    if (speed > 0.8 && Math.random() < Math.min(0.95, speed * 0.22)) puff(-heading.x * 0.3 + (Math.random() - 0.5) * 0.25, -heading.z * 0.3 + (Math.random() - 0.5) * 0.25, input.boost ? C.orange : C.sand, input.boost ? 0.9 : 0.5);
    // --- coins
    for (const c of coins) {
      if (c.got) continue;
      c.m.rotation.y = time * 2.5 + c.phase;
      worldOf(c.n, wp); if (wp.y < R * 0.85) continue;
      if (dist(wp.clone().normalize(), UP) < 0.62) { c.got = true; c.m.visible = false; coinsGot++; for (let k = 0; k < 6; k++) puff(wp.x, wp.z, C.yellow, 1.2, 0.6); emit("coin", coinsGot, coins.length); }
    }
    // --- the dog
    worldOf(dogS.n, wp); const dArc = dist(wp.clone().normalize(), UP);
    if (dogS.state !== "follow") {
      if (dArc < 2.6 && wp.y > 0) { dogS.state = "flee"; const away = new THREE.Vector3(wp.x, 0, wp.z); if (away.lengthSq() > 1e-6) { dogS.dir.copy(away.normalize()); } }
      else if (dogS.state === "flee" && dArc > 4) dogS.state = "wander";
      if (dogS.state === "wander") { dogS.wanderT -= dt; if (dogS.wanderT <= 0) { dogS.wanderT = 1 + Math.random() * 2; const a = Math.random() * TAU; dogS.dir.set(Math.cos(a), 0, Math.sin(a)); } }
      const sp = dogS.state === "flee" ? 3.4 : 1.1;
      // keep the direction tangent at the dog's world position
      const nW = wp.clone().normalize(); dogS.dir.addScaledVector(nW, -dogS.dir.dot(nW)).normalize();
      moveLocal(dogS.n, dogS.dir, sp * dt);
      if (dArc < 0.55 && wp.y > 0) { dogS.state = "follow"; dogCaught = true; emit("dog"); for (let k = 0; k < 12; k++) puff(wp.x, wp.z, C.pink, 1.4, 0.8); }
    } else {
      // trots behind the rover
      const behind = new THREE.Vector3(-heading.x * 0.75, R, -heading.z * 0.75).normalize();
      const target = localDir(behind, new THREE.Vector3());
      dogS.n.lerp(target, Math.min(1, dt * 4)).normalize();
      worldOf(dogS.n, wp); dogS.dir.copy(heading);
    }
    stand(dog, dogS.n); { const nW = worldOf(dogS.n, wp).normalize(); const dwp = nW.clone().multiplyScalar(R - 0.02); dog.up.copy(nW); dog.lookAt(dwp.clone().add(dogS.dir)); dog.rotateY(-Math.PI / 2); }
    const trot = dogS.state === "follow" ? Math.min(1, speed / 2) : dogS.state === "flee" ? 1 : 0.35;
    dog.userData.legs.forEach((l, k) => { l.rotation.z = Math.sin(time * 14 + k * 1.6) * 0.5 * trot; });
    dog.userData.tail.rotation.z = 0.6 + Math.sin(time * 9) * 0.35;
    // --- stops: enter / leave
    let near = -1, nearD = 1e9, nearest = -1, nearestD = 1e9;
    for (const s of stops) {
      worldOf(s.n, wp); const dd = dist(wp.clone().normalize(), UP);
      if (s.kind !== "sign" && dd < s.radius + 1.0 && dd < nearD) { near = s.i; nearD = dd; }
      if (!s.found && s.kind !== "sign" && dd < nearestD) { nearest = s.i; nearestD = dd; }
      if (s.group.userData.anim) s.group.userData.anim(time, dt);
      if (s.face) { const nW = wp.clone().normalize(), wpos = nW.clone().multiplyScalar(R); const toCam = camera.position.clone().sub(wpos); toCam.addScaledVector(nW, -toCam.dot(nW)); if (toCam.lengthSq() > 1e-4) { s.group.up.copy(nW); s.group.lookAt(wpos.add(toCam.normalize())); } }
    }
    if (near !== nearStop) { if (nearStop >= 0) emit("leave", nearStop); nearStop = near; if (near >= 0) { const s = stops[near]; const fresh = !s.found; s.found = true; emit("enter", near, fresh); if (fresh) for (let k = 0; k < 16; k++) puff((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, C.yellow, 1.6, 0.7); } }
    // compass
    compass.visible = nearest >= 0;
    if (nearest >= 0) { worldOf(stops[nearest].n, wp); const a = Math.atan2(wp.x, -wp.z); compass.rotation.y = -a; compass.children[0].material.opacity = 0.5 + 0.35 * Math.sin(time * 4); }
    // crates
    if (crateGroup) for (const [slug, m] of Object.entries(crateGroup.userData.crates)) { const on = slug === hot; m.userData.lift = (m.userData.lift || 0) + ((on ? 1 : 0) - (m.userData.lift || 0)) * Math.min(1, dt * 6); m.position.y = m.userData.baseY ?? (m.userData.baseY = m.position.y); m.position.y += m.userData.lift * 0.22; m.material.emissive.setHex(0xf6d55c); m.material.emissiveIntensity = m.userData.lift * 0.5; }
    // sky
    starMat.uniforms.uTime.value = time;
    const ma = time * 0.07; moon.position.set(Math.cos(ma) * 9.5, 2 + Math.sin(ma * 0.7) * 1.0, Math.sin(ma) * 9.5);
    for (const c of clouds) { const a = c.start + time * c.speed; const qq = new THREE.Quaternion().setFromAxisAngle(c.axis, a); const p = new THREE.Vector3(c.rad, 0, 0).applyQuaternion(qq); c.g.position.copy(p); c.g.quaternion.setFromUnitVectors(UP, p.clone().normalize()); }
    for (const p of puffs) { if (p.life <= 0) continue; p.life -= dt * 1.5; p.m.position.addScaledVector(p.v, dt); p.m.material.opacity = 0.6 * Math.max(0, p.life); p.m.scale.multiplyScalar(1 + dt * 1.4); if (p.life <= 0) p.m.position.y = -10; }
    // camera: leads the rover a little, leans with the pointer
    camLead.lerp(vel.clone().multiplyScalar(0.12), Math.min(1, dt * 2));
    camOff.x += ((pointer.active ? pointer.x : 0) * 0.3 - camOff.x) * Math.min(1, dt * 2.5);
    camOff.y += ((pointer.active ? pointer.y : 0) * 0.15 - camOff.y) * Math.min(1, dt * 2.5);
    camera.position.set(CAM.x + camOff.x + camLead.x, CAM.y + camOff.y, CAM.z + camLead.z); camera.lookAt(LOOK.x + camOff.x * 0.5 + camLead.x, LOOK.y + camOff.y * 0.5, LOOK.z + camLead.z);
    emit("tick", { speed, boost: input.boost, playTime, coins: coinsGot, coinsTotal: coins.length, found: stops.filter((s) => s.found && s.kind !== "sign" && s.kind !== "house" && s.kind !== "billboard").length, total: stops.filter((s) => s.kind !== "sign" && s.kind !== "house" && s.kind !== "billboard").length, dog: dogCaught, nearest });
  }

  let paused = false, raf = 0, last = performance.now(), fps = 60, fpsAcc = 0, fpsN = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    fpsAcc += dt; fpsN++; if (fpsAcc > 1) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
    resize(); step(dt); renderer.render(scene, camera);
  }
  resize(); step(0.016);
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    input(x, z, boost) { input.x = Math.max(-1, Math.min(1, x || 0)); input.z = Math.max(-1, Math.min(1, z || 0)); input.boost = !!boost; },
    start() { running = true; },
    setFound(list) { for (const i of list) if (stops[i]) stops[i].found = true; },
    setPointer(cx, cy) { const r = renderer.domElement.getBoundingClientRect(); if (r.width < 2) return; pointer.x = ((cx - r.left) / r.width) * 2 - 1; pointer.y = -(((cy - r.top) / r.height) * 2 - 1); pointer.active = true; },
    clearPointer() { pointer.active = false; },
    hotTool(slug) { hot = slug; },
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    stats() { return { fps: Math.round(fps), speed, playTime, coins: coinsGot, found: stops.filter((s) => s.found).length }; },
    _facing() { const out = []; for (const s of stops) { if (!s.face) continue; const z = new THREE.Vector3(0, 0, 1).applyQuaternion(s.group.getWorldQuaternion(new THREE.Quaternion())); const p = s.group.getWorldPosition(new THREE.Vector3()); const toCam = camera.position.clone().sub(p).normalize(); out.push(+z.dot(toCam).toFixed(2)); } return out; },
    setPaused(v) { paused = !!v; last = performance.now(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

window.createGame = createGame;
window.dispatchEvent(new Event("game-ready"));
