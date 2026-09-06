/* =========================================================================
   Card swarms — 2D particle drawings for the work cards. Each card gets a
   canvas whose dots gather into a shape (eye, waveform, record button,
   burger, mic, paw, rover, submarine, git graph, play button, arrow) and
   blow away from the cursor. window.CardSwarm / window.SHAPES2D
   ========================================================================= */
(function () {
  /* ---------- shape drawings: black ink on a transparent 200×200 canvas ---------- */
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
  const stroke = (ctx, w) => { ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); };

  const SHAPES2D = {
    eye(ctx, s) { // SiteLight — is anyone looking?
      ctx.beginPath(); ctx.moveTo(0.08 * s, 0.5 * s);
      ctx.bezierCurveTo(0.3 * s, 0.14 * s, 0.7 * s, 0.14 * s, 0.92 * s, 0.5 * s);
      ctx.bezierCurveTo(0.7 * s, 0.86 * s, 0.3 * s, 0.86 * s, 0.08 * s, 0.5 * s);
      ctx.closePath(); stroke(ctx, 0.06 * s);
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.17 * s, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0.5 * s + Math.cos(a) * 0.26 * s, 0.5 * s + Math.sin(a) * 0.26 * s); ctx.lineTo(0.5 * s + Math.cos(a) * 0.32 * s, 0.5 * s + Math.sin(a) * 0.32 * s); stroke(ctx, 0.035 * s); }
    },
    wave(ctx, s) { // Lily — a voice
      const bars = 22;
      for (let i = 0; i < bars; i++) {
        const t = i / (bars - 1);
        const env = 0.12 + 0.88 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.7);
        const h = env * 0.7 * s, x = 0.08 * s + t * 0.84 * s;
        rr(ctx, x - 0.016 * s, 0.5 * s - h / 2, 0.032 * s, h, 0.016 * s);
      }
    },
    rec(ctx, s) { // Glasscast — record
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.36 * s, 0, Math.PI * 2); stroke(ctx, 0.05 * s);
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.2 * s, 0, Math.PI * 2); ctx.fill();
    },
    burger(ctx, s) { // Drive-thru
      ctx.beginPath(); ctx.moveTo(0.14 * s, 0.4 * s); ctx.bezierCurveTo(0.14 * s, 0.14 * s, 0.86 * s, 0.14 * s, 0.86 * s, 0.4 * s); ctx.closePath(); ctx.fill();
      rr(ctx, 0.12 * s, 0.45 * s, 0.76 * s, 0.09 * s, 0.04 * s);
      rr(ctx, 0.16 * s, 0.58 * s, 0.68 * s, 0.1 * s, 0.03 * s);
      rr(ctx, 0.14 * s, 0.72 * s, 0.72 * s, 0.14 * s, 0.06 * s);
    },
    mic(ctx, s) { // Eleven Mile
      rr(ctx, 0.38 * s, 0.1 * s, 0.24 * s, 0.44 * s, 0.12 * s);
      ctx.beginPath(); ctx.arc(0.5 * s, 0.46 * s, 0.24 * s, 0, Math.PI); stroke(ctx, 0.05 * s);
      ctx.beginPath(); ctx.moveTo(0.5 * s, 0.7 * s); ctx.lineTo(0.5 * s, 0.86 * s); ctx.moveTo(0.34 * s, 0.87 * s); ctx.lineTo(0.66 * s, 0.87 * s); stroke(ctx, 0.05 * s);
    },
    paw(ctx, s) { // PawBot
      const toe = (x, y) => { ctx.beginPath(); ctx.ellipse(x * s, y * s, 0.085 * s, 0.11 * s, 0, 0, Math.PI * 2); ctx.fill(); };
      toe(0.3, 0.3); toe(0.5, 0.22); toe(0.7, 0.3); toe(0.18, 0.5); toe(0.82, 0.5);
      ctx.beginPath(); ctx.ellipse(0.5 * s, 0.64 * s, 0.24 * s, 0.2 * s, 0, 0, Math.PI * 2); ctx.fill();
    },
    car(ctx, s) { // S.I.E.G.E.
      rr(ctx, 0.1 * s, 0.46 * s, 0.8 * s, 0.2 * s, 0.05 * s);
      rr(ctx, 0.24 * s, 0.3 * s, 0.36 * s, 0.2 * s, 0.05 * s);
      ctx.beginPath(); ctx.moveTo(0.7 * s, 0.46 * s); ctx.lineTo(0.7 * s, 0.24 * s); stroke(ctx, 0.03 * s);
      ctx.beginPath(); ctx.arc(0.7 * s, 0.21 * s, 0.045 * s, 0, Math.PI * 2); ctx.fill();
      for (const x of [0.28, 0.72]) { ctx.beginPath(); ctx.arc(x * s, 0.7 * s, 0.11 * s, 0, Math.PI * 2); ctx.fill(); }
    },
    sub(ctx, s) { // ROV submarine
      rr(ctx, 0.1 * s, 0.42 * s, 0.7 * s, 0.24 * s, 0.12 * s);
      rr(ctx, 0.42 * s, 0.28 * s, 0.18 * s, 0.16 * s, 0.04 * s);
      ctx.beginPath(); ctx.moveTo(0.5 * s, 0.28 * s); ctx.lineTo(0.5 * s, 0.16 * s); ctx.lineTo(0.58 * s, 0.16 * s); stroke(ctx, 0.03 * s);
      ctx.beginPath(); ctx.moveTo(0.14 * s, 0.34 * s); ctx.lineTo(0.14 * s, 0.74 * s); stroke(ctx, 0.045 * s);
      ctx.beginPath(); ctx.arc(0.86 * s, 0.54 * s, 0.05 * s, 0, Math.PI * 2); stroke(ctx, 0.03 * s);
      for (const [x, y] of [[0.64, 0.5], [0.7, 0.44], [0.74, 0.38]]) { ctx.beginPath(); ctx.arc(x * s, y * s, 0.018 * s, 0, Math.PI * 2); ctx.fill(); }
    },
    git(ctx, s) { // Open source — a merge
      ctx.beginPath(); ctx.moveTo(0.3 * s, 0.22 * s); ctx.lineTo(0.3 * s, 0.78 * s); stroke(ctx, 0.05 * s);
      ctx.beginPath(); ctx.moveTo(0.7 * s, 0.3 * s); ctx.bezierCurveTo(0.7 * s, 0.52 * s, 0.32 * s, 0.44 * s, 0.3 * s, 0.7 * s); stroke(ctx, 0.05 * s);
      for (const [x, y] of [[0.3, 0.2], [0.3, 0.8], [0.7, 0.28]]) { ctx.beginPath(); ctx.arc(x * s, y * s, 0.075 * s, 0, Math.PI * 2); ctx.fill(); }
    },
    play(ctx, s) { // the on-stage video — an outlined play button
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.4 * s, 0, Math.PI * 2); stroke(ctx, 0.045 * s);
      ctx.beginPath(); ctx.moveTo(0.42 * s, 0.32 * s); ctx.lineTo(0.66 * s, 0.5 * s); ctx.lineTo(0.42 * s, 0.68 * s); ctx.closePath(); stroke(ctx, 0.045 * s);
    },
    pressme(ctx, s) { // ...and after five seconds, a nudge
      ctx.font = `bold ${0.3 * s}px Geist, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("PRESS", 0.5 * s, 0.2 * s);
      ctx.fillText("ME", 0.5 * s, 0.5 * s);
      ctx.beginPath(); ctx.moveTo(0.5 * s, 0.68 * s); ctx.lineTo(0.5 * s, 0.94 * s); stroke(ctx, 0.06 * s);
      ctx.beginPath(); ctx.moveTo(0.34 * s, 0.8 * s); ctx.lineTo(0.5 * s, 0.94 * s); ctx.lineTo(0.66 * s, 0.8 * s); stroke(ctx, 0.06 * s);
    },
  };

  /* ---------- sample a drawing into points ---------- */
  const off = document.createElement("canvas");
  const RES = 220;
  off.width = off.height = RES;
  const octx = off.getContext("2d", { willReadFrequently: true });
  function sample(drawFn, count) {
    octx.clearRect(0, 0, RES, RES);
    octx.fillStyle = "#000"; octx.strokeStyle = "#000";
    drawFn(octx, RES);
    const img = octx.getImageData(0, 0, RES, RES).data;
    const pts = [];
    for (let y = 0; y < RES; y++) for (let x = 0; x < RES; x++) if (img[(y * RES + x) * 4 + 3] > 100) pts.push(x / RES, y / RES);
    const n = pts.length / 2;
    const out = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const j = n ? Math.floor(Math.random() * n) : 0;
      out[i * 2] = (pts[j * 2] ?? 0.5) + (Math.random() - 0.5) * 0.006;
      out[i * 2 + 1] = (pts[j * 2 + 1] ?? 0.5) + (Math.random() - 0.5) * 0.006;
    }
    return out;
  }

  /* ---------- a card swarm ---------- */
  function make(canvas, drawFn, opts = {}) {
    const count = opts.count || 1400;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, box = 0, ox = 0, oy = 0;
    const px = new Float32Array(count), py = new Float32Array(count);
    const vx = new Float32Array(count), vy = new Float32Array(count);
    const from = new Float32Array(count * 2), to = new Float32Array(count * 2);
    const delay = new Float32Array(count), phase = new Float32Array(count), sz = new Float32Array(count), accent = new Uint8Array(count);
    for (let i = 0; i < count; i++) { delay[i] = Math.random(); phase[i] = Math.random() * 6.28; sz[i] = 0.6 + Math.random() * 0.9; accent[i] = Math.random() < 0.12 ? 1 : 0; }
    let morphT = 1, morphDur = 1.2, inited = false;
    const pointer = { x: -9, y: -9, vx: 0, vy: 0, active: false, last: 0 };
    const fit = opts.fit || 0.66; // shape box as a fraction of the shorter side
    const align = opts.align || "center";

    function resize() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
      if (w === W && h === H) return;
      W = w; H = h;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      box = Math.min(W, H) * fit;
      ox = align === "left" ? Math.min(W, H) * 0.08 : (W - box) / 2;
      oy = (H - box) / 2;
    }
    function setShape(fn, dur = 1.2) {
      const t = sample(fn, count);
      from.set(to); to.set(t);
      morphT = inited ? 0 : 1; morphDur = dur;
      if (!inited) {
        inited = true;
        for (let i = 0; i < count; i++) { px[i] = to[i * 2] + (Math.random() - 0.5) * 1.6; py[i] = to[i * 2 + 1] + (Math.random() - 0.5) * 1.6; }
        morphT = 0; morphDur = 1.6;
      }
    }
    function setPointer(cx, cy) {
      const r = canvas.getBoundingClientRect();
      const nx = (cx - r.left - ox) / box, ny = (cy - r.top - oy) / box;
      const now = performance.now(), dt = Math.max(8, now - pointer.last) / 1000;
      if (pointer.active) { pointer.vx = (nx - pointer.x) / dt; pointer.vy = (ny - pointer.y) / dt; }
      pointer.x = nx; pointer.y = ny; pointer.active = true; pointer.last = now;
    }
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const R = opts.blowRadius || 0.22, F = opts.blowForce || 5.5;
    let paused = false, last = performance.now(), time = 0, raf = 0;
    const ink = () => getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#141414";
    const acc = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff4d1c";
    let inkC = ink(), accC = acc(), colorTick = 0;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (paused || !inited) { last = now; return; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now; time += dt;
      resize();
      if ((colorTick++ & 63) === 0) { inkC = ink(); accC = acc(); }
      if (morphT < 1) morphT = Math.min(1, morphT + dt / morphDur);
      const K = 30, DAMP = 0.84, wvx = pointer.vx * 0.3, wvy = pointer.vy * 0.3;
      ctx.clearRect(0, 0, W, H);
      const dot = Math.max(1.2, box / 110);
      for (let i = 0; i < count; i++) {
        let e = 1;
        if (morphT < 1) { const d = delay[i] * 0.5; e = ease(Math.min(1, Math.max(0, (morphT - d) / (1 - d)))); }
        const tx = from[i * 2] + (to[i * 2] - from[i * 2]) * e + 0.004 * Math.sin(time * 1.7 + phase[i]);
        const ty = from[i * 2 + 1] + (to[i * 2 + 1] - from[i * 2 + 1]) * e + 0.004 * Math.cos(time * 1.3 + phase[i]);
        let ax = (tx - px[i]) * K, ay = (ty - py[i]) * K;
        if (pointer.active) {
          const dx = px[i] - pointer.x, dy = py[i] - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < R * R) { const d = Math.sqrt(d2) || 0.0001, s = 1 - d / R, p = s * s * F * 40; ax += (dx / d) * p + wvx * s * 40; ay += (dy / d) * p + wvy * s * 40; }
        }
        vx[i] = (vx[i] + ax * dt) * DAMP; vy[i] = (vy[i] + ay * dt) * DAMP;
        px[i] += vx[i] * dt * 6; py[i] += vy[i] * dt * 6;
        ctx.fillStyle = accent[i] ? accC : inkC;
        ctx.beginPath(); ctx.arc(ox + px[i] * box, oy + py[i] * box, dot * sz[i], 0, 6.283); ctx.fill();
      }
      pointer.vx *= 0.8; pointer.vy *= 0.8;
    }
    resize();
    setShape(drawFn);
    raf = requestAnimationFrame(frame);

    // pointer on the card (the canvas itself is pointer-events none so the link still works)
    const host = opts.pointerHost || canvas.parentElement;
    const onMove = (e) => setPointer(e.clientX, e.clientY);
    const onLeave = () => { pointer.active = false; pointer.vx = pointer.vy = 0; };
    const onTouch = (e) => { const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); };
    host.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    host.addEventListener("touchmove", onTouch, { passive: true });
    host.addEventListener("touchend", onLeave);

    return {
      setShape,
      setPaused(v) { paused = !!v; last = performance.now(); },
      burst(strength = 1) { for (let i = 0; i < count; i++) { vx[i] += (Math.random() - 0.5) * 3 * strength; vy[i] += (Math.random() - 0.5) * 3 * strength; } },
      destroy() { cancelAnimationFrame(raf); host.removeEventListener("mousemove", onMove); host.removeEventListener("mouseleave", onLeave); host.removeEventListener("touchmove", onTouch); host.removeEventListener("touchend", onLeave); },
    };
  }

  /* ---------- a still image of a shape (for the 3d grid tiles) ---------- */
  function snapshot(drawFn, w = 560, h = 360, ink = "#141414", bg = "#eae4d8", count = 900) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const pts = sample(drawFn, count);
    const box = Math.min(w, h) * 0.72, ox = (w - box) / 2, oy = (h - box) / 2;
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = Math.random() < 0.12 ? "#ff4d1c" : ink;
      ctx.beginPath(); ctx.arc(ox + pts[i * 2] * box, oy + pts[i * 2 + 1] * box, 2 + Math.random() * 2, 0, 6.283); ctx.fill();
    }
    return c.toDataURL("image/png");
  }

  window.SHAPES2D = SHAPES2D;
  window.CardSwarm = { make, snapshot, sample };
})();
