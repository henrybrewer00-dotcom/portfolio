/* Buff, the polishing robot. A small hovering bot drawn in the page's own 3px dither grain drifts around the
   background with a buffer pad hanging under it. It does its rounds: a patch of the dot field, every letter of
   the big word, then the top edge of the ask bar. Where the pad has been, the engraving's dots come up a
   little brighter (shader.js polish()) and a few sparkles twinkle there before everything dulls back.

   Calm on purpose: slow, eased drifting, small polishing loops, a rest now and then. Its blue eye looks at
   your cursor. Not interactive (pointer-events: none), off for reduced motion and on touch-only screens it
   keeps to the top of the page. */

const CELL = 3;                                     // css px per dot, the page's grain
// facing right. # ink, : ink in shadow (half-tone), o the eye, = the arm, b the pad (drawn spinning)
const SPRITE = [
  ".....#.....",
  "....#.#....",
  ".....#.....",
  "..#######..",
  ".#########.",
  ".#####o#o#.",
  ".#########.",
  ".:#######:.",
  "..:::::::..",
  ".....=.....",
  "...bbbbb...",
];
const PX = 2;                                       // dots per sprite pixel, each way
const SW = SPRITE[0].length, SH = SPRITE.length;
const PAD_Y = SH - 1;                              // pad row; the bot's position is the pad's centre
const SPEED = 46;                                   // css px per second, cruising
const smooth = (t) => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);

export function createRobot(cv, { engraving, bar, avoid } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const ctx = cv.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue("--ink").trim() || "#ece8de";
  const accent = css.getPropertyValue("--accent").trim() || "#4b7bff";
  const paper = css.getPropertyValue("--paper").trim() || "#0e0e0c";
  let dpr = 1;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  const eng = () => (typeof engraving === "function" ? engraving() : engraving);
  const bot = { x: -40, y: innerHeight * 0.2, vx: 0, vy: 0, face: 1, pad: 0, eye: 1, look: 0 };
  const pointer = { x: -1e4, y: -1e4 };
  addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

  /* ---------- the rounds: a queue of small jobs ---------- */
  // goto: drift to a point; buff: small polishing loops on the spot; sweep: buff along a line; rest: power down
  let jobs = [], job = null, jobT = 0, round = 0;

  const fieldSpot = () => {
    // somewhere in the open background, clear of the column of content if the screen is wide enough
    const r = avoid && avoid();
    const W = innerWidth, H = innerHeight;
    if (r && W - r.right > 160 && Math.random() < 0.75) {
      const left = Math.random() < 0.5;
      return { x: left ? rand(50, r.left - 60) : rand(r.right + 60, W - 50), y: rand(110, H - 90) };
    }
    return { x: rand(60, W - 60), y: rand(90, Math.max(120, H * 0.22)) };
  };

  function plan() {
    jobs = [];
    const spot = fieldSpot();
    jobs.push({ type: "goto", ...spot }, { type: "buff", x: spot.x, y: spot.y, loops: 2 });
    const word = eng() && eng().letters();
    if (word && round % 2 === 0) {
      // every letter of the word, left to right, a loop or two each, slightly below each letter's middle
      for (const l of word.letters) {
        if (l.ch === " ") continue;
        const p = { x: l.x, y: l.y + word.size * (l.ch === "." ? 0.3 : 0.06) };
        jobs.push({ type: "goto", ...p }, { type: "buff", ...p, loops: l.ch === "." ? 1 : 2, r: Math.min(14, word.size * 0.09) });
      }
      jobs.push({ type: "glint", what: "word" });
    }
    const b = bar && bar.getBoundingClientRect();
    if (b && b.top > 60 && b.top < innerHeight - 40 && round % 2 === 1) {
      const y = b.top - 1, x0 = b.left + b.height * 0.5, x1 = b.right - b.height * 0.5;
      jobs.push({ type: "goto", x: x0, y }, { type: "sweep", x0, x1, y }, { type: "glint", what: "bar" });
    }
    if (Math.random() < 0.6) { const s = fieldSpot(); jobs.push({ type: "goto", ...s }, { type: "rest", t: rand(4, 7) }); }
    round++;
  }

  /* ---------- sparkles: little four-point stars of dots ---------- */
  const sparkles = [];
  const recent = [];                                 // where the pad has been lately, for after-sparkles
  const sparkle = (x, y, big = false) => sparkles.push({ x, y, t: 0, life: big ? 0.9 : rand(0.5, 0.8), arm: big ? 3 : Math.random() < 0.4 ? 2 : 1 });
  let barGlint = null, wordGlint = null, sinceSparkle = 0, sinceAmbient = 0;

  function polishAt(x, y, r, amount, dt) {
    const e = eng();
    e && e.polish(x, y, r, amount);
    if (!recent.length || Math.hypot(recent[recent.length - 1].x - x, recent[recent.length - 1].y - y) > 8) recent.push({ x, y, at: performance.now() });
    if (recent.length > 120) recent.shift();
    sinceSparkle += dt;
    if (sinceSparkle > 0.45) { sinceSparkle = rand(0, 0.15); sparkle(x + rand(-r, r) * 1.4, y + rand(-r, r)); }
  }

  /* ---------- motion ---------- */
  // ease toward a point; returns true on arrival
  function driftTo(tx, ty, dt) {
    const dx = tx - bot.x, dy = ty - bot.y, d = Math.hypot(dx, dy);
    const want = Math.min(SPEED, d * 1.4);           // slows into the stop
    const k = 1 - Math.exp(-dt * 3);
    bot.vx += ((d > 0.01 ? (dx / d) * want : 0) - bot.vx) * k;
    bot.vy += ((d > 0.01 ? (dy / d) * want : 0) - bot.vy) * k;
    bot.x += bot.vx * dt; bot.y += bot.vy * dt;
    if (Math.abs(bot.vx) > 6) bot.face = bot.vx > 0 ? 1 : -1;
    return d < 1.5;
  }

  function step(dt, now) {
    if (!job) { if (!jobs.length) plan(); job = jobs.shift(); jobT = 0; }
    jobT += dt;
    let spinning = false;
    switch (job.type) {
      case "goto": if (driftTo(job.x, job.y, dt) || jobT > 25) job = null; break;
      case "buff": {
        // small, slow loops around the spot: wax on, wax off
        const r = job.r || 7, period = 2.2, loops = job.loops || 1;
        const t = jobT / period, a = t * Math.PI * 2;
        bot.x = job.x + Math.sin(a) * r * Math.min(1, t * 2); bot.y = job.y + (1 - Math.cos(a)) * r * 0.45 * Math.min(1, t * 2);
        bot.vx = bot.vy = 0; spinning = true;
        polishAt(bot.x, bot.y, (job.r || 7) + 9, 1.4 * dt, dt);
        if (t >= loops) { sparkle(job.x, job.y - 4, true); job = null; }
        break;
      }
      case "sweep": {
        const len = Math.abs(job.x1 - job.x0), t = Math.min(1, jobT / (len / (SPEED * 0.55)));
        bot.x = job.x0 + (job.x1 - job.x0) * t; bot.y = job.y; bot.face = job.x1 > job.x0 ? 1 : -1; spinning = true;
        barGlint = barGlint || { from: bot.x, upto: bot.x, at: 0, sweep: -1 };
        barGlint.upto = bot.x; barGlint.at = now;
        polishAt(bot.x, bot.y, 12, 0.9 * dt, dt);
        if (t >= 1) job = null;
        break;
      }
      case "glint":
        if (job.what === "bar" && barGlint) barGlint.sweep = now;
        if (job.what === "word") { const w = eng() && eng().letters(); if (w) wordGlint = { at: now, w }; }
        job = null; break;
      case "rest":
        bot.vx *= 0.9; bot.vy *= 0.9;
        if (jobT > job.t) job = null;
        break;
    }
    // hover bob, and the eye: on unless resting, glancing at the cursor when it's near
    const resting = job && job.type === "rest";
    bot.eye += ((resting ? 0.25 : 1) - bot.eye) * (1 - Math.exp(-dt * 2));
    const near = Math.hypot(pointer.x - bot.x, pointer.y - bot.y) < 220;
    bot.look = near ? Math.sign(pointer.x - bot.x) * bot.face : 0;
    if (spinning) bot.pad += dt * 9;
    else bot.pad += dt * 1.5;

    // after-sparkles: now and then, a twinkle somewhere it has polished in the last few seconds
    sinceAmbient += dt;
    if (sinceAmbient > 0.9) {
      sinceAmbient = rand(0, 0.5);
      const fresh = recent.filter((p) => now - p.at < 9000);
      if (fresh.length) { const p = fresh[(Math.random() * fresh.length) | 0]; sparkle(p.x + rand(-10, 10), p.y + rand(-8, 8)); }
    }
  }

  /* ---------- drawing, all snapped to the 3px grid ---------- */
  const snap = (v) => Math.round(v / CELL) * CELL;
  const dot = (x, y, color, alpha = 1) => { ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(x, y, CELL - 1, CELL - 1); };
  // one sprite pixel: a 2×2 block of dots
  const big = (x, y, color, alpha = 1) => { for (let b = 0; b < PX * PX; b++) dot(x + (b % PX) * CELL, y + ((b / PX) | 0) * CELL, color, alpha); };

  function drawBot(now) {
    const bob = Math.sin(now / 900) * 1.5;
    const S = CELL * PX, ox = snap(bot.x) - Math.floor(SW / 2) * S, oy = snap(bot.y) - PAD_Y * S + snap(bob);
    // a dark silhouette a dot wider all round, so it reads over the bright letters too
    ctx.globalAlpha = 0.92; ctx.fillStyle = paper;
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
      if (SPRITE[j][bot.face > 0 ? i : SW - 1 - i] !== ".") ctx.fillRect(ox + i * S - CELL, oy + j * S - CELL, S + CELL * 2, S + CELL * 2);
    }
    for (let j = 0; j < SH; j++) {
      const row = SPRITE[j];
      for (let i = 0; i < SW; i++) {
        let c = row[bot.face > 0 ? i : SW - 1 - i];
        if (c === ".") continue;
        const x = ox + i * S, y = oy + j * S;
        if (c === "#") big(x, y, ink, 0.95);
        else if (c === ":") { dot(x, y, ink, 0.5); dot(x + CELL, y + CELL, ink, 0.5); }   // half-tone shadow
        else if (c === "=") { dot(x, y, ink, 0.6); dot(x, y + CELL, ink, 0.6); }
        else if (c === "o") {
          // the eyes: blue; they shift a dot toward the cursor
          const look = bot.look * bot.face;
          big(x + look * CELL, y, accent, bot.eye);
        } else if (c === "b") {
          // the pad: a row of dots whose bright one runs along it, so it reads as spinning
          const k = ((i - 3) - Math.floor(bot.pad) % 5 + 5) % 5;
          big(x, y, k === 0 ? "#ffffff" : ink, k === 0 ? 1 : 0.45);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawSparkles(dt) {
    for (let s = sparkles.length - 1; s >= 0; s--) {
      const p = sparkles[s];
      p.t += dt;
      const k = p.t / p.life;
      if (k >= 1) { sparkles.splice(s, 1); continue; }
      const grow = Math.sin(k * Math.PI);           // up and back down
      const arm = Math.round(p.arm * grow + 0.2), x = snap(p.x), y = snap(p.y);
      dot(x, y, "#ffffff", grow);
      for (let a = 1; a <= arm; a++) {
        const al = grow * (1 - a / (arm + 1)) * 0.9;
        dot(x + a * CELL, y, ink, al); dot(x - a * CELL, y, ink, al);
        dot(x, y + a * CELL, ink, al); dot(x, y - a * CELL, ink, al);
      }
    }
    ctx.globalAlpha = 1;
  }

  // the bar's top edge: where the pad has passed it catches the light, and when it's done a glint runs along it
  function drawBarGlint(now) {
    if (!barGlint || !bar) return;
    const b = bar.getBoundingClientRect(), y = Math.round(b.top) + 0.5;
    const age = (now - barGlint.at) / 1000;
    const fadeOut = Math.max(0, 1 - Math.max(0, age - 4) / 6);
    if (fadeOut <= 0) { barGlint = null; return; }
    ctx.lineWidth = 1;
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.55 * fadeOut;
    ctx.beginPath(); ctx.moveTo(barGlint.from, y); ctx.lineTo(barGlint.upto, y); ctx.stroke();
    if (barGlint.sweep > 0) {
      const t = (now - barGlint.sweep) / 1300;
      if (t <= 1) {
        const x0 = b.left + b.height * 0.5, x1 = b.right - b.height * 0.5, cx = x0 + (x1 - x0) * smooth(t);
        const g = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g; ctx.globalAlpha = Math.sin(t * Math.PI); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(Math.max(x0, cx - 70), y); ctx.lineTo(Math.min(x1, cx + 70), y); ctx.stroke();
        if (t > 0.97 && !barGlint.done) { barGlint.done = true; sparkle(x1 - 4, y - 2, true); }
      }
    }
    ctx.globalAlpha = 1;
  }

  // when the word is done, a few sparkles pop across its letters one after another
  function stepWordGlint(now) {
    if (!wordGlint) return;
    const t = (now - wordGlint.at) / 1000, L = wordGlint.w.letters;
    L.forEach((l, i) => {
      if (!l.sparkled && t > i * 0.18) { l.sparkled = true; sparkle(l.x + rand(-0.2, 0.2) * wordGlint.w.size * 0.3, l.y - wordGlint.w.size * rand(0.05, 0.25), i === L.length - 1); }
    });
    if (t > L.length * 0.18 + 1) wordGlint = null;
  }

  /* ---------- loop ---------- */
  let raf = 0, last = 0;
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    step(dt, now);
    stepWordGlint(now);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    drawBarGlint(now);
    drawSparkles(dt);
    drawBot(now);
  };
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
  return { stop, start };
}
