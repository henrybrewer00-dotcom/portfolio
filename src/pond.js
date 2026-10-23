/* The pond behind the page: black and white koi drawn as ASCII tiles on a black cell grid, after
   github.com/stackedlol/ascii-sharks. Each frame: a faint grid, slow clouds of dim dots, a wake that
   lights cells where things swim, small fish as single dashes, and the koi drawn cell by cell as
   shaded glyph tiles. A koi rides a follow-the-leader spine; every cell is supersampled against its
   outline in body coordinates (s along the spine, 0 = nose, 1 = tail; v across it, in px).

   Interactive, but calm: fish scatter from the cursor, koi drift over to see what it is, and a click
   drops food. The view leans in on the spot so the tiles come up close, the koi come and eat, and
   the view eases back out. */

const TAU = Math.PI * 2;
const NODES = 20;
const STEP = 1 / 60;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const angleDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
function hash3(x, y, z) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// smooth value noise, for markings that stay put on the skin
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
  const a = hash3(xi, yi, z), b = hash3(xi + 1, yi, z), c = hash3(xi, yi + 1, z), d = hash3(xi + 1, yi + 1, z);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
// a slow, divergence-free current so the little fish drift without bunching up
function current(x, y, t, out) {
  const a = x / 260 + t * 0.05, b = y / 310 - t * 0.035, c = (x + y) / 190 + t * 0.08;
  out.x = ((-1 / 310) * Math.sin(a) * Math.sin(b) + (0.5 / 190) * Math.cos(c)) * 2400;
  out.y = ((-1 / 260) * Math.cos(a) * Math.cos(b) - (0.5 / 190) * Math.cos(c)) * 2400;
}

/* ---------- the koi ---------- */
const BODY = 1, FIN = 2, EYE = 3;
const KOI = { sizes: [1, 0.86, 0.74], length: 0.5, cruise: 17, beat: 1.25, wave: 0.055, waveK: 5.5, maxBend: 0.085, reach: 0.34 };

function halfWidth(s) {
  if (s < 0) return 0;
  if (s < 0.1) return 0.1 * Math.pow(Math.sin((s / 0.1) * Math.PI / 2), 0.65);
  if (s < 0.34) return 0.1 + 0.016 * smooth(0.1, 0.34, s);
  if (s < 0.8) return 0.042 + 0.074 * Math.pow(1 - (s - 0.34) / 0.46, 1.15);
  return 0.042;
}

// koi alternate: bone-white with black spots, then ink-black with a white crown and white saddles
function koiShape(s, v, L, an, hit) {
  const dark = an.id % 2 === 0;
  const a = Math.abs(v) / L, w = halfWidth(s);
  if (s >= 0 && s <= 0.8 && a <= w) {
    const across = a / (w || 1);
    hit.k = BODY;
    // rounded back lit from the top left, with a soft sheen running down the spine
    const sheen = Math.max(0, 1 - across * 1.6) * 0.08;
    hit.lum = (dark ? 0.03 : 0.9) + hit.light * 0.07 * across + sheen - across * across * 0.06;
    if (s > 0.055 && s < 0.09 && across > 0.55) { hit.k = EYE; hit.lum = dark ? 0.55 : 0.02; return true; }
    const n = noise(s * 8, (v / L) * 10, an.id * 7);
    const crown = dark && s > 0.015 && s < 0.13 && across < 0.62;
    const spot = s > 0.14 && s < 0.74 && n > (dark ? 0.67 : 0.6);
    if (crown || spot) hit.lum = (dark ? 0.94 : 0.02) + sheen;
    return true;
  }
  // the tail: a forked, see-through fan with fine rays, flowing a beat behind the body
  if (s > 0.78 && s < 1.24) {
    const k = (s - 0.78) / 0.46;
    const sway = L * 0.05 * k * k * Math.sin(an.phase * 0.9 - k * 2.4);
    const aa = Math.abs(v - sway) / L;
    let spread = 0.042 + 0.15 * Math.pow(k, 0.85) * (1 - 0.3 * k);
    if (k > 0.82) spread *= Math.sqrt(Math.max(0, 1 - ((k - 0.82) / 0.18) ** 2));
    const fork = k > 0.5 && aa < 0.15 * (k - 0.5) / 0.5;
    if (aa < spread && !fork) {
      const ray = 0.5 + 0.5 * Math.sin((aa / Math.max(0.02, s - 0.77)) * 11);
      hit.k = FIN; hit.lum = (dark ? 0.16 : 0.5) * (0.7 + 0.3 * ray) * (1 - k * 0.35);
      return true;
    }
  }
  // pectoral fans, sculling slowly in turn
  const side = Math.sign(v) || 1, th = 0.95 + 0.3 * Math.sin(an.phase * 0.55 + side * 1.4);
  const du = s - 0.19, da = a - (halfWidth(0.19) - 0.012), dirU = Math.sin(th), dirA = Math.cos(th);
  const t = du * dirU + da * dirA, perp = du * dirA - da * dirU;
  if (da > -0.01 && t > 0 && t < 0.15 && Math.abs(perp) < 0.055 * Math.sin(Math.PI * Math.min(1, t / 0.15 * 0.85 + 0.15))) {
    const ray = 0.5 + 0.5 * Math.sin(perp * 140);
    hit.k = FIN; hit.lum = (dark ? 0.15 : 0.46) * (0.75 + 0.25 * ray);
    return true;
  }
  return false;
}

/* ---------- small fish ---------- */
const SPECIES = [
  { cruise: 24, max: 44, min: 10, size: [12, 20], sep: [1.8, 1.1], align: 1.6, cohesion: 1.4, jitter: 22, mill: 40, drag: 0.6 },
  { cruise: 30, max: 50, min: 14, size: [14, 22], sep: [1.5, 1], align: 3, cohesion: 0.5, jitter: 18, mill: 0, drag: 1.4 },
];

/* ---------- the engine ---------- */
export function createPond(canvas, { ignore = "a, button, input, textarea, select, label, form, [data-pond-ignore]" } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const css = (n, d) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d;
  const rgb = (hex) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const P = rgb(css("--pond", "#000000")), I = rgb(css("--ink", "#ece8de"));
  const mix = (t) => `rgb(${Math.round(P[0] + (I[0] - P[0]) * t)},${Math.round(P[1] + (I[1] - P[1]) * t)},${Math.round(P[2] + (I[2] - P[2]) * t)})`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const font = css("--mono", "ui-monospace, Menlo, monospace");

  let W = 0, H = 0, dpr = 1, cw = 12, ch = 18, cols = 0, rows = 0, time = 0;
  let energy = new Float32Array(0), tmp = new Float32Array(0), cell = new Uint8Array(0), lum = new Float32Array(0), key = new Uint32Array(0), dim = new Float32Array(0), fishAt = new Uint32Array(0), frame = 0;
  let koi = [], fish = [], food = [], lastSpawn = 0, raf = 0, last = 0, acc = 0, running = false;
  const pointer = { x: 0, y: 0, active: false, still: 0 };
  // the camera: a click leans in on a spot (zoom > 1) and then eases back out
  const cam = { x: 0, y: 0, z: 1, tz: 1, until: 0 };
  const cur = { x: 0, y: 0 };

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const first = W === 0;
    W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
    cw = clamp(Math.round(W / 130), 7, 12); ch = Math.round(cw * 1.45);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const n = cols * rows;
    energy = new Float32Array(n); tmp = new Float32Array(n); cell = new Uint8Array(n); lum = new Float32Array(n);
    key = new Uint32Array(n); dim = new Float32Array(n); fishAt = new Uint32Array(n);
    if (first) seed();
    if (!running) still();
  }

  function seed() {
    const minSide = Math.min(W, H);
    const base = clamp(minSide * KOI.length * (W < 600 ? 1.2 : 1), 200, 560);
    koi = KOI.sizes.map((size, i) => {
      const L = base * size, orbitRadius = minSide * rand(0.3, 0.42);
      const ang = (i / KOI.sizes.length) * TAU + rand(-0.4, 0.4), dir = i % 2 ? -1 : 1;
      const x = W / 2 + Math.cos(ang) * orbitRadius * (W / minSide) * 0.9, y = H / 2 + Math.sin(ang) * orbitRadius;
      const heading = ang + (dir * Math.PI) / 2, nodes = new Float32Array(NODES * 2), seg = L / (NODES - 1);
      for (let k = 0; k < NODES; k++) { nodes[k * 2] = x - Math.cos(heading) * seg * k; nodes[k * 2 + 1] = y - Math.sin(heading) * seg * k; }
      return { id: i + 1, L, size, nodes, heading, speed: KOI.cruise, phase: rand(0, TAU), turn: 0, wander: 0, orbitDir: dir, orbitRadius };
    }).sort((a, b) => a.L - b.L);
    const total = clamp(Math.round((W * H) / 11000), 30, 130);
    fish = [];
    while (fish.length < total) {
      const sp = Math.floor(Math.random() * SPECIES.length), S = SPECIES[sp];
      const count = Math.min(Math.round(rand(S.size[0], S.size[1])), total - fish.length);
      const cx = rand(W * 0.06, W * 0.94), cy = rand(H * 0.08, H * 0.92), dir = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.5, 0.5), mill = Math.random() < 0.5 ? 1 : -1;
      for (let k = 0; k < count; k++) fish.push({ x: cx + rand(-1, 1) * cw * 2 * Math.sqrt(count), y: cy + rand(-1, 1) * ch * Math.sqrt(count) * 0.6, vx: Math.cos(dir) * S.cruise, vy: Math.sin(dir) * S.cruise, sp, alarm: 0, alive: true, respawnAt: 0, turn: 0, depth: rand(0.55, 1), mill });
    }
  }

  /* ---------- simulation ---------- */
  function stepFish(dt) {
    const R = Math.max(ch * 3, cw * 5.5), R2 = R * R, calm = Math.exp(-dt * 0.7), spread = Math.min(1, dt * 6);
    const bc = Math.ceil(W / R) + 4, br = Math.ceil(H / R) + 4, head = new Int32Array(bc * br).fill(-1), next = new Int32Array(fish.length);
    const bucket = (x, y) => clamp(Math.floor(y / R) + 2, 0, br - 1) * bc + clamp(Math.floor(x / R) + 2, 0, bc - 1);
    fish.forEach((f, i) => { if (f.alive) { const b = bucket(f.x, f.y); next[i] = head[b]; head[b] = i; } });
    for (let i = 0; i < fish.length; i++) {
      const f = fish[i]; if (!f.alive) continue;
      const S = SPECIES[f.sp], room = 1 + 1.8 * f.alarm, sepX = S.sep[0] * cw * room, sepY = S.sep[1] * ch * room;
      const speed = Math.hypot(f.vx, f.vy) || 1, hx = f.vx / speed, hy = f.vy / speed;
      let ax = 0, ay = 0, sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0, n = 0, near = 0;
      const c0 = clamp(Math.floor(f.x / R) + 2, 0, bc - 1), r0 = clamp(Math.floor(f.y / R) + 2, 0, br - 1);
      for (let r = Math.max(0, r0 - 1); r <= Math.min(br - 1, r0 + 1); r++) for (let c = Math.max(0, c0 - 1); c <= Math.min(bc - 1, c0 + 1); c++) {
        for (let j = head[r * bc + c]; j !== -1; j = next[j]) {
          if (j === i) continue;
          const o = fish[j], dx = o.x - f.x, dy = o.y - f.y, d2 = dx * dx + dy * dy;
          if (d2 >= R2 || d2 < 1e-6) continue;
          const d = Math.sqrt(d2);
          if ((dx * hx + dy * hy) / d < -0.6) continue; // blind spot behind
          const qx = dx / sepX, qy = dy / sepY, q2 = qx * qx + qy * qy;
          if (q2 < 1) { const q = Math.sqrt(q2) || 1e-3, k = (1 - q) / q; sx -= qx * k; sy -= qy * k; }
          if (o.sp === f.sp) { avx += o.vx; avy += o.vy; cx += dx; cy += dy; n++; }
          else if (d < cw * 3) { const k = ((1 - d / (cw * 3)) / d) * 0.6; sx -= dx * k; sy -= dy * k; }
          if (o.alarm > near) near = o.alarm;
        }
      }
      ax += sx * 420; ay += sy * 420;
      if (n) {
        const al = 1.4 * S.align, co = S.cohesion * (1 - 0.8 * f.alarm);
        ax += (avx / n - f.vx) * al + (cx / n) * co; ay += (avy / n - f.vy) * al + (cy / n) * co;
        if (S.mill) { const cl = Math.hypot(cx, cy) || 1; ax += (-cy / cl) * f.mill * S.mill * (1 - f.alarm); ay += (cx / cl) * f.mill * S.mill * (1 - f.alarm); }
      }
      // give the koi room: break sideways around their path
      let fear = 0;
      for (const an of koi) {
        const fr = an.L * 0.5 + 40;
        let best = Infinity, bx = 0, by = 0;
        for (let k = 0; k <= 12; k += 3) { const d2 = (f.x - an.nodes[k * 2]) ** 2 + (f.y - an.nodes[k * 2 + 1]) ** 2; if (d2 < best) { best = d2; bx = an.nodes[k * 2]; by = an.nodes[k * 2 + 1]; } }
        const d = Math.sqrt(best); if (d >= fr || d < 1e-3) continue;
        const w = (1 - d / fr) ** 2, ex = Math.cos(an.heading), ey = Math.sin(an.heading);
        const side = ex * (f.y - an.nodes[1]) - ey * (f.x - an.nodes[0]) >= 0 ? 1 : -1;
        ax += (((f.x - bx) / d) * 0.7 - ey * side * 0.9) * 800 * w; ay += (((f.y - by) / d) * 0.7 + ex * side * 0.9) * 800 * w;
        fear = Math.max(fear, Math.sqrt(w) * 0.5);
      }
      if (pointer.active) {
        const dx = f.x - pointer.x, dy = f.y - pointer.y, d = Math.hypot(dx, dy);
        if (d < 120 && d > 1e-3) { const w = (1 - d / 120) ** 2; ax += (dx / d) * 900 * w; ay += (dy / d) * 900 * w; fear = Math.max(fear, Math.sqrt(w) * 0.7); }
      }
      let alarm = Math.max(f.alarm * calm, fear);
      if (near * 0.86 > alarm) alarm += (near * 0.86 - alarm) * spread;
      f.alarm = alarm;
      const m = 36;
      if (f.x < m) ax += (m - f.x) * 7; else if (f.x > W - m) ax -= (f.x - W + m) * 7;
      if (f.y < m) ay += (m - f.y) * 7; else if (f.y > H - m) ay -= (f.y - H + m) * 7;
      current(f.x, f.y, time, cur);
      ax += cur.x * 0.5 + (Math.random() - 0.5) * S.jitter; ay += cur.y * 0.5 + (Math.random() - 0.5) * S.jitter;
      ay -= f.vy * S.drag * (1 - 0.7 * f.alarm);
      const want = S.cruise * (1 + 1.1 * f.alarm);
      ax += (want - speed) * hx * 1.6; ay += (want - speed) * hy * 1.6;
      const before = Math.atan2(f.vy, f.vx);
      f.vx += ax * dt; f.vy += ay * dt;
      const max = S.max * (1 + 1.4 * f.alarm), s = Math.hypot(f.vx, f.vy);
      if (s > max) { f.vx *= max / s; f.vy *= max / s; } else if (s < S.min && s > 1e-3) { f.vx *= S.min / s; f.vy *= S.min / s; }
      f.turn += (angleDiff(before, Math.atan2(f.vy, f.vx)) / dt - f.turn) * Math.min(1, dt * 8);
      f.x = clamp(f.x + f.vx * dt, -60, W + 60); f.y = clamp(f.y + f.vy * dt, -60, H + 60);
    }
  }

  function stepKoi(dt) {
    const minSide = Math.min(W, H);
    for (const an of koi) {
      const L = an.L, N = an.nodes, hx = N[0], hy = N[1];
      let dx = Math.cos(an.heading), dy = Math.sin(an.heading);
      an.wander = clamp(an.wander + (Math.random() - 0.5) * dt * 2, -1, 1);
      dx += Math.cos(an.heading + an.wander) * 0.4; dy += Math.sin(an.heading + an.wander) * 0.4;
      // food in the water wins over everything; a resting cursor gets a curious look
      let goal = null, eager = 0;
      for (const p of food) { const d = Math.hypot(p.x - hx, p.y - hy); if (!goal || d < goal.d) goal = { x: p.x, y: p.y, d }; }
      if (goal) eager = 2.6;
      else if (pointer.active && pointer.still > 0.6) { const d = Math.hypot(pointer.x - hx, pointer.y - hy); if (d < minSide * 0.5) { goal = { x: pointer.x, y: pointer.y, d }; eager = 0.9 * clamp(1 - d / (minSide * 0.5), 0, 1); } }
      if (goal && goal.d > L * 0.06) { dx += ((goal.x - hx) / goal.d) * eager; dy += ((goal.y - hy) / goal.d) * eager; }
      else if (!goal) {
        // otherwise a lazy loop around the middle of the page
        const rx = (hx - W / 2) / (W / minSide), ry = hy - H / 2, r = Math.hypot(rx, ry) || 1;
        const radius = an.orbitRadius * (1 + 0.15 * Math.sin(time * 0.05 + an.id)), radial = clamp((radius - r) / radius, -1, 1);
        dx += ((-ry / r) * an.orbitDir + (rx / r) * radial * 0.9) * 0.55; dy += ((rx / r) * an.orbitDir + (ry / r) * radial * 0.9) * 0.55;
        // and keep the headline mostly clear
        const ex = (hx - W / 2) / (W * 0.28), ey = (hy - H * 0.4) / (H * 0.15), e2 = ex * ex + ey * ey;
        if (e2 < 1) { const e = Math.sqrt(e2) || 1e-3, w = (1 - e) * 2; dx += (ex / e) * w; dy += (ey / e) * w; }
      }
      for (const o of koi) {
        if (o === an) continue;
        for (let k = 0; k < NODES; k += 4) {
          const ox = hx - o.nodes[k * 2], oy = hy - o.nodes[k * 2 + 1], d = Math.hypot(ox, oy), range = (L + o.L) * (goal ? 0.18 : 0.4);
          if (d < range && d > 1e-3) { const w = (1 - d / range) * 3; dx += (ox / d) * w; dy += (oy / d) * w; }
        }
      }
      // dip off the edge now and then, but always come back
      const over = Math.max(-hx, hx - W, -hy, hy - H);
      if (over > -L * 0.05) { const w = clamp((over + L * 0.05) / (L * 0.35), 0, 1) * 3.5, tx = W / 2 - hx, ty = H / 2 - hy, d = Math.hypot(tx, ty) || 1; dx += (tx / d) * w; dy += (ty / d) * w; }
      const agility = Math.min(goal && eager > 2 ? 1.1 : 0.6, an.speed / (L * 0.2)), maxTurn = agility * dt;
      const turned = clamp(angleDiff(an.heading, Math.atan2(dy, dx)), -maxTurn, maxTurn);
      an.heading += turned; an.turn += (turned / dt - an.turn) * Math.min(1, dt * 3);
      const cruise = KOI.cruise + L * 0.025, want = eager > 2 ? cruise * 1.7 : cruise;
      an.speed += (want - an.speed) * Math.min(1, dt * 0.8);
      an.phase += dt * KOI.beat * (1 + an.speed / 50);
      N[0] += Math.cos(an.heading) * an.speed * dt; N[1] += Math.sin(an.heading) * an.speed * dt;
      // follow the leader, with a bend limit per joint so the body never folds on itself
      const seg = L / (NODES - 1);
      let prev = an.heading + Math.PI;
      for (let k = 1; k < NODES; k++) {
        const px = N[(k - 1) * 2], py = N[(k - 1) * 2 + 1];
        const ang = prev + clamp(angleDiff(prev, Math.atan2(N[k * 2 + 1] - py, N[k * 2] - px)), -KOI.maxBend, KOI.maxBend);
        N[k * 2] = px + Math.cos(ang) * seg; N[k * 2 + 1] = py + Math.sin(ang) * seg; prev = ang;
      }
      // a gulp at the surface: the pellet is gone and a ring spreads
      const mr = L * 0.06 + 6;
      food = food.filter((p) => { if ((p.x - N[0]) ** 2 + (p.y - N[1]) ** 2 < mr * mr) { ring(p.x, p.y, 3, 0.9); return false; } return true; });
    }
    food = food.filter((p) => time - p.t < 14);
  }

  function respawn() {
    const due = fish.filter((f) => !f.alive && f.respawnAt <= time);
    if (!due.length || (due.length < 6 && time - lastSpawn < 9)) return;
    lastSpawn = time;
    const side = Math.floor(Math.random() * 4), along = rand(0.15, 0.85);
    const x = side === 0 ? -20 : side === 1 ? W + 20 : along * W, y = side === 2 ? -20 : side === 3 ? H + 20 : along * H;
    const inward = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.5, 0.5), sp = Math.floor(Math.random() * SPECIES.length), S = SPECIES[sp];
    for (const f of due.slice(0, S.size[1])) Object.assign(f, { alive: true, sp, alarm: 0, turn: 0, x: x + rand(-60, 60), y: y + rand(-60, 60), vx: Math.cos(inward) * S.cruise * 1.4, vy: Math.sin(inward) * S.cruise * 1.4 });
  }

  function step(dt) {
    time += dt;
    pointer.still += dt;
    stepFish(dt); stepKoi(dt); respawn();
    // the camera eases toward its target; after a dive it drifts back out
    if (cam.tz > 1 && time > cam.until) cam.tz = 1;
    cam.z += (cam.tz - cam.z) * Math.min(1, dt * (cam.tz > cam.z ? 2.2 : 1.1));
  }

  /* ---------- drawing ---------- */
  function cellOf(x, y) { const c = Math.floor(x / cw), r = Math.floor(y / ch); return c < 0 || r < 0 || c >= cols || r >= rows ? -1 : r * cols + c; }
  function ring(x, y, radius, amount) {
    const c0 = Math.floor(x / cw), r0 = Math.floor(y / ch);
    for (let r = r0 - radius; r <= r0 + radius; r++) for (let c = c0 - radius; c <= c0 + radius; c++) {
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      const d = Math.hypot(c - c0, (r - r0) * 1.4); if (d > radius + 0.5) continue;
      const i = r * cols + c; energy[i] = Math.min(1.6, energy[i] + amount * (1 - d / (radius + 1)));
    }
  }

  const spine = new Float32Array(NODES * 2), arc = new Float32Array(NODES), hit = { k: 0, lum: 0, light: 0, s: 0, v: 0, a: 0 };
  let arcTotal = 1;
  function sample(px, py, an) {
    let best = Infinity, bs = 0, sign = 1, nx = 0, ny = 0;
    for (let k = 0; k < NODES - 1; k++) {
      const ax = spine[k * 2], ay = spine[k * 2 + 1], sx = spine[k * 2 + 2] - ax, sy = spine[k * 2 + 3] - ay, len2 = sx * sx + sy * sy || 1;
      // the first and last segments run on past the ends, so the tail fan can reach beyond them
      const t = clamp(((px - ax) * sx + (py - ay) * sy) / len2, k === 0 ? -2 : 0, k === NODES - 2 ? 5.5 : 1);
      const qx = ax + sx * t, qy = ay + sy * t, d2 = (px - qx) ** 2 + (py - qy) ** 2;
      if (d2 < best) {
        best = d2; const len = Math.sqrt(len2);
        bs = (arc[k] + t * len) / arcTotal;
        sign = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
        nx = (-sy / len) * sign; ny = (sx / len) * sign;
      }
    }
    const a = Math.sqrt(best);
    hit.s = bs; hit.a = a; hit.v = a * sign;
    hit.light = nx * -0.6 + ny * -0.8; // lit from the top left
    return koiShape(bs, a * sign, an.L, an, hit);
  }

  const SUB = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];
  function rasterize() {
    cell.fill(0);
    for (const an of koi) {
      const L = an.L, N = an.nodes, swim = clamp(an.speed / 30, 0.6, 1.3);
      for (let k = 0; k < NODES; k++) {
        const s = k / (NODES - 1), a = Math.max(0, k - 1), b = Math.min(NODES - 1, k + 1);
        let tx = N[a * 2] - N[b * 2], ty = N[a * 2 + 1] - N[b * 2 + 1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const off = L * KOI.wave * (0.1 + 0.9 * Math.pow(s, 1.8)) * swim * Math.sin(an.phase - s * KOI.waveK);
        spine[k * 2] = N[k * 2] - ty * off; spine[k * 2 + 1] = N[k * 2 + 1] + tx * off;
      }
      arc[0] = 0;
      for (let k = 1; k < NODES; k++) arc[k] = arc[k - 1] + Math.hypot(spine[k * 2] - spine[k * 2 - 2], spine[k * 2 + 1] - spine[k * 2 - 1]);
      arcTotal = arc[NODES - 1] || 1;
      // the box covers the tail fan, which runs a quarter length past the last node
      const tx = spine[(NODES - 1) * 2] - spine[(NODES - 2) * 2], ty = spine[(NODES - 1) * 2 + 1] - spine[(NODES - 2) * 2 + 1];
      const ex = spine[(NODES - 1) * 2] + tx * 6, ey = spine[(NODES - 1) * 2 + 1] + ty * 6;
      let x0 = ex, y0 = ey, x1 = ex, y1 = ey;
      for (let k = 0; k < NODES; k++) { x0 = Math.min(x0, spine[k * 2]); x1 = Math.max(x1, spine[k * 2]); y0 = Math.min(y0, spine[k * 2 + 1]); y1 = Math.max(y1, spine[k * 2 + 1]); }
      const reach = L * KOI.reach + Math.hypot(cw, ch);
      const c0 = Math.max(0, Math.floor((x0 - reach) / cw)), c1 = Math.min(cols - 1, Math.floor((x1 + reach) / cw));
      const r0 = Math.max(0, Math.floor((y0 - reach) / ch)), r1 = Math.min(rows - 1, Math.floor((y1 + reach) / ch));
      const depth = 0.8 + 0.2 * an.size;
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = c * cw, y = r * ch, center = sample(x + cw / 2, y + ch / 2, an);
        if (!center && hit.a > reach) continue;
        const k = hit.k, l = hit.lum, s = hit.s, v = hit.v;
        let hits = center ? 1 : 0;
        for (let j = 0; j < SUB.length; j += 2) if (sample(x + SUB[j] * cw, y + SUB[j + 1] * ch, an)) hits++;
        if (!hits) continue;
        const i = r * cols + c, cover = hits / 5;
        key[i] = (hash3(Math.round(s * 60), Math.round(v / (cw * 0.9)), an.id) * 4294967295) >>> 0; // rides along with the skin
        dim[i] = depth;
        if (center && cover >= 0.6) { cell[i] = k; lum[i] = clamp(l + (hash3(c, r, Math.floor(time * 3)) - 0.5) * 0.04, 0, 1); }
        else { cell[i] = 9; lum[i] = cover * (k === FIN ? 0.6 : 1); } // soft edge
      }
    }
  }

  function wake(dt) {
    for (const f of fish) if (f.alive) { const i = cellOf(f.x, f.y); if (i >= 0) energy[i] = Math.min(1.6, energy[i] + 0.008 + f.alarm * 0.02); }
    for (const an of koi) {
      const N = an.nodes;
      for (let k = NODES - 6; k < NODES; k++) { const i = cellOf(N[k * 2], N[k * 2 + 1]); if (i >= 0) energy[i] = Math.min(1.6, energy[i] + 0.035 + an.speed * 0.0012); }
    }
    for (const p of food) if (Math.random() < dt * 2) ring(p.x, p.y, 1, 0.5);
    if (pointer.active) ring(pointer.x, pointer.y, 1, 0.06);
    const decay = Math.exp(-dt * 1.4);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, e = energy[i];
      tmp[i] = (e * 4 + (c > 0 ? energy[i - 1] : e) + (c < cols - 1 ? energy[i + 1] : e) + (r > 0 ? energy[i - cols] : e) + (r < rows - 1 ? energy[i + cols] : e)) * 0.125 * decay;
    }
    [energy, tmp] = [tmp, energy];
  }

  const RAMP = ":;t%SX8#@", FINS = "|/;:'", EDGE_HEAVY = ":;", EDGE_LIGHT = ".',`";
  const DOTS = [0.12, 0.2, 0.3, 0.42, 0.56, 0.72].map((a) => `rgba(${I.join(",")},${a})`);
  const FISH = [0.22, 0.34, 0.48, 0.62, 0.78].map((a) => `rgba(${I.join(",")},${a})`);

  function draw(dt) {
    if (!cols) return;
    rasterize(); wake(dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = mix(0); ctx.fillRect(0, 0, W, H);
    // lean the camera in on the focus point
    const z = cam.z;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * cam.x * (1 - z), dpr * cam.y * (1 - z));
    const n = cols * rows; frame++;
    // the grid
    ctx.strokeStyle = `rgba(${I.join(",")},0.05)`; ctx.lineWidth = 1 / (dpr * z); ctx.beginPath();
    for (let c = 0; c <= cols; c++) { ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, rows * ch); }
    for (let r = 0; r <= rows; r++) { ctx.moveTo(0, r * ch); ctx.lineTo(cols * cw, r * ch); }
    ctx.stroke();
    // fish: one dash per cell, brighter when near or turning hard
    const buckets = FISH.map(() => []);
    for (const f of fish) {
      if (!f.alive) continue;
      const i = cellOf(f.x, f.y); if (i < 0 || fishAt[i] === frame || cell[i]) continue;
      fishAt[i] = frame;
      const v = 0.3 + (0.4 * (f.depth - 0.55)) / 0.45 + 0.3 * Math.max(clamp(Math.abs(f.turn) / 3.5, 0, 1), f.alarm);
      buckets[clamp(Math.floor(v * FISH.length), 0, FISH.length - 1)].push(i);
    }
    // dots: slow, faint clouds drifting over the grid, and the wake flaring up wherever things swim
    const size = Math.max(2, Math.round(cw * 0.2));
    const dotBuckets = DOTS.map(() => []);
    for (let i = 0; i < n; i++) {
      if (cell[i] || fishAt[i] === frame) continue;
      const col = i % cols, row = (i / cols) | 0, e = energy[i];
      let v = e > 0.36 ? 0.3 + (e - 0.36) * 0.9 : 0;
      if (!v) {
        const cloud = noise(col * 0.09 + time * 0.03, row * 0.13 - time * 0.02, 5);
        if (cloud > 0.68 && hash3(col, row, 9) < (cloud - 0.68) * 2.2) v = 0.05 + 0.1 * (0.5 + 0.5 * Math.sin(time * (0.4 + hash3(col, row, 3)) + col));
      }
      if (v > 0) dotBuckets[clamp(Math.floor(v * DOTS.length), 0, DOTS.length - 1)].push(i);
    }
    dotBuckets.forEach((b, k) => {
      ctx.fillStyle = DOTS[k];
      for (const i of b) ctx.fillRect(Math.round((i % cols) * cw + cw * 0.66 - size / 2), Math.round(((i / cols) | 0) * ch + ch * 0.64 - size / 2), size, size);
    });
    // food: a small bright pellet, bobbing
    ctx.font = `600 ${Math.round(ch * 0.74)}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const p of food) { const i = cellOf(p.x, p.y); if (i < 0) continue; ctx.fillStyle = mix(0.9 - 0.2 * Math.sin(time * 4 + p.t)); ctx.fillText("o", (i % cols) * cw + cw / 2, ((i / cols) | 0) * ch + ch / 2 + 1); }
    buckets.forEach((b, k) => { ctx.fillStyle = FISH[k]; for (const i of b) ctx.fillText("-", (i % cols) * cw + cw / 2, ((i / cols) | 0) * ch + ch / 2 + 1); });
    // the koi: a shaded tile per cell with a glyph cut into it
    for (let i = 0; i < n; i++) {
      const k = cell[i]; if (!k) continue;
      const x = (i % cols) * cw, y = ((i / cols) | 0) * ch, kk = key[i], l = lum[i] * dim[i];
      const flash = hash3(kk, Math.floor(time * 1.4 + (kk % 997) / 97), 7) < 0.035; // a scale catches the light now and then
      if (k === 9) {
        ctx.fillStyle = mix(0.22 + l * 0.35);
        ctx.fillText((l >= 0.5 ? EDGE_HEAVY : EDGE_LIGHT)[(kk >>> 8) % (l >= 0.5 ? 2 : 4)], x + cw / 2, y + ch / 2 + 1);
        continue;
      }
      const tone = 0.07 + l * 0.9;
      ctx.fillStyle = mix(tone);
      ctx.fillRect(x + 1, y + 1, cw - 1, ch - 1);
      let glyph;
      if (k === EYE) glyph = "o";
      else if (k === FIN) glyph = FINS[(kk >>> 8) % FINS.length];
      else glyph = RAMP[clamp(Math.floor((1 - lum[i]) * 8.99) + ((kk >>> 4) % 3) - 1, 0, RAMP.length - 1)];
      ctx.fillStyle = flash && k === BODY ? mix(tone > 0.5 ? 0.35 : 1) : tone > 0.5 ? mix(0.1) : mix(Math.min(1, tone + 0.3));
      ctx.fillText(glyph, x + cw / 2, y + ch / 2 + 1);
    }
  }

  /* ---------- loop ---------- */
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 4) { step(STEP); acc -= STEP; steps++; }
    if (steps === 4) acc = 0;
    draw(dt);
    raf = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(raf); running = false;
    if (reduce.matches || document.hidden) return still();
    running = true; last = performance.now(); raf = requestAnimationFrame(tick);
  }
  function still() { if (time < 4) for (let i = 0; i < 240; i++) step(STEP); draw(STEP); }

  // screen → pond, through the camera
  const local = (e) => { const r = canvas.getBoundingClientRect(), z = cam.z; return { x: (e.clientX - r.left - cam.x) / z + cam.x, y: (e.clientY - r.top - cam.y) / z + cam.y }; };
  const onMove = (e) => {
    const p = local(e);
    if (Math.hypot(p.x - pointer.x, p.y - pointer.y) > 3) pointer.still = 0;
    pointer.x = p.x; pointer.y = p.y; pointer.active = e.pointerType !== "touch";
  };
  const onDown = (e) => {
    if (reduce.matches || (e.target instanceof Element && e.target.closest(ignore))) return;
    const { x, y } = local(e);
    ring(x, y, 4, 1.1);
    for (const f of fish) { const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy); if (f.alive && d < 180 && d > 1e-3) { const k = (1 - d / 180) * 180; f.vx += (dx / d) * k; f.vy += (dy / d) * k; f.alarm = 1; } }
    // a few pellets scattered around the spot, and the view leans in close enough to see the tiles
    for (let k = 0; k < 3; k++) food.push({ x: x + rand(-1, 1) * cw * 2, y: y + rand(-1, 1) * ch, t: time + k * 0.01 });
    if (food.length > 9) food.splice(0, food.length - 9);
    if (cam.z < 1.05) { cam.x = x; cam.y = y; }
    cam.tz = 2.1; cam.until = time + 3.2;
  };
  const onLeave = () => { pointer.active = false; };
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onDown, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  document.addEventListener("visibilitychange", start);
  reduce.addEventListener?.("change", start);
  resize(); start();
  document.fonts?.load(`600 16px ${font}`).then(() => { if (!running) draw(STEP); });

  return {
    /** Drop food at a point in page coordinates (the koi come to it), without moving the camera. */
    feed(x, y) { for (let k = 0; k < 3; k++) food.push({ x: x + rand(-1, 1) * cw * 2, y: y + rand(-1, 1) * ch, t: time }); ring(x, y, 3, 0.9); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener("pointermove", onMove); removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave); document.removeEventListener("visibilitychange", start);
    },
  };
}
