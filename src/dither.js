/* Dithered charts for "who's been here": ordered (Bayer 4×4) dots in the page's ink, so they read like
   the field behind them. The visits chart is a real chart: hold and drag (or swipe, or scroll sideways,
   or use the arrow keys) to pan through time, and the column under your finger lights up with its count. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function setup(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
  return { ctx: canvas.getContext("2d"), w: canvas.width, h: canvas.height, px: Math.max(2, Math.round(2 * dpr)), dpr };
}

// dots wherever density(fx, fy) beats the Bayer threshold; the grid is anchored to the canvas, not the block,
// so blocks that slide past keep a steady pattern instead of shimmering
function fill(ctx, x0, y0, w, h, px, density) {
  const sx = Math.ceil(x0 / px) * px, sy = Math.ceil(y0 / px) * px;
  for (let y = sy; y < y0 + h; y += px) for (let x = sx; x < x0 + w; x += px) {
    const i = ((y / px) & 3) * 4 + ((x / px) & 3);
    if (density((x - x0) / w, (y - y0) / h) > BAYER[i]) ctx.fillRect(x, y, px, px);
  }
}

function grow(draw, reduce) {
  if (reduce) { draw(1); return; }
  const t0 = performance.now(), D = 900;
  const step = (now) => { const t = Math.min((now - t0) / D, 1); draw(1 - (1 - t) ** 3); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/** One horizontal bar per canvas: share 0..1 of the widest. `lit` draws its dots in the accent. */
export function bar(canvas, share, lit, reduce) {
  const { ctx, w, h, px } = setup(canvas);
  const paint = (k) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css(canvas.dataset.lit === "1" || lit ? "--accent" : "--ink");
    fill(ctx, 0, 0, Math.max(px, Math.round((w * share * k) / px) * px), h, px, (fx) => 0.95 - fx * 0.55);
  };
  grow(paint, reduce);
  return { paint: () => paint(1), grow: () => grow(paint, reduce) };
}

/**
 * The visits chart. values[i] is one day, oldest first; it opens on the newest `span` days.
 * onFocus(i) is called with the index under the pointer (or the newest visible day when it leaves).
 */
export function timeline(canvas, values, { span = 21, reduce = false, live = false, onFocus = () => {}, onPan = () => {} } = {}) {
  let g = setup(canvas);
  const n = values.length;
  let off = Math.max(0, n - span), vel = 0, drag = null, hover = -1, k = reduce ? 1 : 0, raf = 0, top = 0;
  // the y scale follows the busiest day on screen, easing as you pan so quiet weeks still have shape
  const windowMax = () => { let m = 1; for (let i = Math.floor(off); i <= Math.min(n - 1, Math.floor(off) + span); i++) m = Math.max(m, values[i]); return m; };
  const colW = () => g.w / span;
  const maxOff = () => Math.max(0, n - span);

  function draw() {
    const { ctx, w, h, px } = g, cw = colW(), gap = Math.max(px, Math.round(cw * 0.22 / px) * px);
    ctx.clearRect(0, 0, w, h);
    const target = windowMax(); top = top ? top + (target - top) * 0.15 : target; const max = top;
    const first = Math.floor(off), ink = css("--ink"), acc = css("--accent");
    onPan(Math.round(off), Math.min(n - 1, Math.round(off) + span - 1));
    // keep the readout on a day that's actually on screen
    if (hover >= 0 && (hover < Math.ceil(off) || hover > Math.floor(off) + span - 1)) { hover = clamp(hover, Math.ceil(off), Math.min(n - 1, Math.floor(off) + span - 1)); onFocus(hover); }
    for (let i = first; i <= Math.min(n - 1, first + span); i++) {
      const x = Math.round(((i - off) * cw) / px) * px, bw = Math.floor((cw - gap) / px) * px;
      const ch = Math.max(px, Math.round((h * 0.94 * (values[i] / max) * k) / px) * px);
      ctx.fillStyle = i === hover ? acc : ink;
      // the newest week is still filling up: bands of dots roll up through it, and a dim ghost above it breathes
      if (live && i === n - 1 && !reduce) {
        const t = performance.now() / 1000, gh = Math.round((h * 0.94 * Math.max(0.12, Math.min(1, values[i] / max + 0.18)) * k) / px) * px;
        fill(ctx, x, h - gh, bw, gh, px, (fx, fy) => {
          const solid = fy > 1 - ch / gh, wave = 0.5 + 0.5 * Math.sin(fy * 9 + t * 2.6);
          return solid ? 0.3 + fy * 0.5 + wave * 0.3 : wave * 0.22 * (0.6 + 0.4 * Math.sin(t * 1.3));
        });
        continue;
      }
      fill(ctx, x, h - ch, bw, ch, px, (fx, fy) => (i === hover ? 0.55 : 0.32) + fy * 0.6);
    }
  }
  function loop() {
    raf = 0;
    if (!drag && Math.abs(vel) > 0.002) { off = clamp(off + vel, 0, maxOff()); vel *= 0.92; if (off === 0 || off === maxOff()) vel = 0; }
    else if (!drag) vel = 0;
    if (k < 1) k = Math.min(1, k + 0.035);
    draw();
    if (vel || k < 1 || Math.abs(windowMax() - top) > 0.05 || (live && !reduce && visible)) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const indexAt = (e) => { const r = canvas.getBoundingClientRect(); return clamp(Math.floor(off + clamp((e.clientX - r.left) / r.width, 0, 0.999) * span), 0, n - 1); };
  const focus = (i) => { if (i !== hover) { hover = i; onFocus(i < 0 ? Math.min(n - 1, Math.floor(off) + span - 1) : i); kick(); } };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, off, t: performance.now(), last: e.clientX };
    canvas.classList.add("is-dragging"); vel = 0; focus(indexAt(e));
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      const r = canvas.getBoundingClientRect(), per = r.width / span, now = performance.now();
      off = clamp(drag.off - (e.clientX - drag.x) / per, 0, maxOff());
      vel = (-(e.clientX - drag.last) / per) * 0.6 + vel * 0.4; drag.last = e.clientX; drag.t = now;
    }
    focus(indexAt(e)); kick();
  });
  const end = () => { if (!drag) return; drag = null; canvas.classList.remove("is-dragging"); kick(); };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { if (!drag) focus(-1); });
  canvas.addEventListener("wheel", (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!d) return;
    e.preventDefault(); off = clamp(off + d / (canvas.getBoundingClientRect().width / span), 0, maxOff()); kick();
  }, { passive: false });
  canvas.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -n, End: n }[e.key];
    if (step == null) return;
    e.preventDefault();
    const i = clamp((hover < 0 ? n - 1 : hover) + (Math.abs(step) === 1 ? step : step > 0 ? n : -n), 0, n - 1);
    if (i < off) off = i; if (i >= off + span) off = i - span + 1;
    focus(i);
  });

  // a live chart only animates while it's on screen
  let visible = false;
  if (live) new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) kick(); }).observe(canvas);
  onFocus(n - 1);
  kick();
  return {
    resize() { g = setup(canvas); draw(); },
    replay() { if (!reduce) { k = 0; kick(); } },
    get window() { return [Math.floor(off), Math.min(n - 1, Math.floor(off) + span - 1)]; },
  };
}

/**
 * A stock-style line: values[i] is a running total, one per day, oldest first. The line is drawn in solid dots
 * with a dithered fill under it that fades toward the floor, and it draws itself in from the left. The newest
 * point is live: a dot that pulses with a ring rolling off it, like a ticker. Pointing at (or arrowing through)
 * the chart moves a dotted crosshair and calls onFocus(i); leaving calls onFocus(-1).
 */
export function stock(canvas, values, { reduce = false, onFocus = () => {}, stride = 1 } = {}) {
  let g = setup(canvas), k = reduce ? 1 : 0, hover = -1, raf = 0, visible = false;
  const n = values.length, max = Math.max(1, ...values) * 1.12;
  const xAt = (i) => (i / Math.max(1, n - 1)) * (g.w - g.px * 6);
  const yAt = (v) => g.h - g.px * 2 - (v / max) * (g.h - g.px * 8);
  const valueAtX = (x) => { const f = clamp(x / (g.w - g.px * 6), 0, 1) * (n - 1), i = Math.floor(f), t = f - i; return values[i] + ((values[Math.min(n - 1, i + 1)] ?? values[i]) - values[i]) * t; };

  function draw(now) {
    const { ctx, w, h, px } = g, ink = css("--ink"), t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    const reach = (w - px * 6) * (1 - (1 - k) ** 3);   // how far the line has drawn in
    // the faint floor grid: a dotted rule every quarter
    ctx.fillStyle = ink; ctx.globalAlpha = 0.18;
    for (let q = 1; q <= 3; q++) { const y = Math.round((h * q) / 4 / px) * px; for (let x = 0; x < w; x += px * 4) ctx.fillRect(x, y, px, px); }
    ctx.globalAlpha = 1;
    // the fill under the line, then the line itself, a column of dots at a time
    for (let x = 0; x <= reach; x += px) {
      const y = Math.round(yAt(valueAtX(x)) / px) * px, depth = h - y;
      for (let yy = y + px * 2; yy < h; yy += px) {
        const d = 0.62 * (1 - (yy - y) / depth) ** 1.4;
        if (d > BAYER[((yy / px) & 3) * 4 + ((x / px) & 3)]) ctx.fillRect(x, yy, px, px);
      }
      ctx.fillRect(x, y - px, px, px * 2);
      // keep the line unbroken where it climbs a step
      const y2 = Math.round(yAt(valueAtX(x + px)) / px) * px;
      if (Math.abs(y2 - y) > px) ctx.fillRect(x, Math.min(y, y2), px, Math.abs(y2 - y));
    }
    // the crosshair: a dotted upright and a hollow square on the line
    if (hover >= 0 && k >= 1) {
      const x = Math.round(xAt(hover) / px) * px, y = Math.round(yAt(values[hover]) / px) * px;
      for (let yy = 0; yy < h; yy += px * 3) ctx.fillRect(x, yy, px, px);
      ctx.clearRect(x - px * 3, y - px * 3, px * 7, px * 7); ctx.fillRect(x - px * 2, y - px * 2, px * 5, px * 5); ctx.clearRect(x - px, y - px, px * 3, px * 3);
    }
    // the live end: a pulsing dot and a ring of dots rolling off it
    if (k >= 1) {
      const x = Math.round(xAt(n - 1) / px) * px, y = Math.round(yAt(values[n - 1]) / px) * px;
      const beat = reduce ? 0 : (t * 0.8) % 1, size = px * (2 + Math.round(1 + Math.sin(t * 5)));
      ctx.fillRect(x - size, y - size, size * 2 + px, size * 2 + px);
      if (!reduce) {
        const r = px * (3 + beat * 9), steps = 18;
        ctx.globalAlpha = 1 - beat;
        for (let s = 0; s < steps; s++) { const a = (s / steps) * Math.PI * 2; ctx.fillRect(Math.round((x + Math.cos(a) * r) / px) * px, Math.round((y + Math.sin(a) * r) / px) * px, px, px); }
        ctx.globalAlpha = 1;
      }
    }
  }
  function loop(now) {
    raf = 0;
    if (k < 1) k = Math.min(1, k + 0.02);
    draw(now);
    if (k < 1 || (visible && !reduce)) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const indexAt = (e) => { const r = canvas.getBoundingClientRect(); return clamp(Math.round(((e.clientX - r.left) / r.width) * (n - 1) * (g.w / (g.w - g.px * 6))), 0, n - 1); };
  const focus = (i) => { if (i !== hover) { hover = i; onFocus(i); kick(); if (reduce) draw(performance.now()); } };
  canvas.addEventListener("pointermove", (e) => focus(indexAt(e)));
  canvas.addEventListener("pointerdown", (e) => focus(indexAt(e)));
  canvas.addEventListener("pointerleave", () => focus(-1));
  canvas.addEventListener("blur", () => focus(-1));
  canvas.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -n, End: n }[e.key];
    if (step == null) return;
    e.preventDefault(); focus(clamp((hover < 0 ? n - 1 : hover) + step * (Math.abs(step) === 1 ? stride : 1), 0, n - 1));
  });
  new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) kick(); }).observe(canvas);
  onFocus(-1);
  kick();
  return {
    resize() { g = setup(canvas); kick(); },
    replay() { if (!reduce) { k = 0; kick(); } },
  };
}
