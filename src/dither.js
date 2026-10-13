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
  return () => paint(1);
}

/**
 * The visits chart. values[i] is one day, oldest first; it opens on the newest `span` days.
 * onFocus(i) is called with the index under the pointer (or the newest visible day when it leaves).
 */
export function timeline(canvas, values, { span = 21, reduce = false, onFocus = () => {}, onPan = () => {} } = {}) {
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
      fill(ctx, x, h - ch, bw, ch, px, (fx, fy) => (i === hover ? 0.55 : 0.32) + fy * 0.6);
    }
  }
  function loop() {
    raf = 0;
    if (!drag && Math.abs(vel) > 0.002) { off = clamp(off + vel, 0, maxOff()); vel *= 0.92; if (off === 0 || off === maxOff()) vel = 0; }
    else if (!drag) vel = 0;
    if (k < 1) k = Math.min(1, k + 0.035);
    draw();
    if (vel || k < 1 || Math.abs(windowMax() - top) > 0.05) raf = requestAnimationFrame(loop);
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

  onFocus(n - 1);
  kick();
  return {
    resize() { g = setup(canvas); draw(); },
    get window() { return [Math.floor(off), Math.min(n - 1, Math.floor(off) + span - 1)]; },
  };
}
