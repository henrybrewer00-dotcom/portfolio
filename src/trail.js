/* The cursor trail: the mouse leaves a short smear of dither dots behind it that thins out and fades, like
   the background's own dots briefly lit up. A coarse grid of "heat" gets painted along the path and decays every
   frame; a cell shows a dot while its heat is above its ordered-dither threshold. Mouse only, and off for
   reduced motion. The loop sleeps as soon as the trail is gone. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CELL = 5;      // css px per cell
const RADIUS = 12;   // css px brush
const LIFE = 0.7;    // seconds for full heat to fade out

export function createTrail(cv) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = cv.getContext("2d");
  let cols = 0, rows = 0, heat = null, live = new Set(), raf = 0, last = 0, px = -1, py = -1, color = "#ff6a2b";
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(innerWidth / CELL); rows = Math.ceil(innerHeight / CELL);
    heat = new Float32Array(cols * rows); live.clear();
    color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || color;
  };
  size();
  addEventListener("resize", size);

  const stamp = (x, y, amt) => {
    const r = RADIUS / CELL, cx = x / CELL, cy = y / CELL;
    for (let j = Math.max(0, Math.floor(cy - r)); j <= Math.min(rows - 1, Math.ceil(cy + r)); j++) {
      for (let i = Math.max(0, Math.floor(cx - r)); i <= Math.min(cols - 1, Math.ceil(cx + r)); i++) {
        const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy) / r;
        if (d >= 1) continue;
        const k = j * cols + i, v = amt * (1 - d * d);
        if (v > heat[k]) { heat[k] = v; live.add(k); }
      }
    }
  };
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const fade = dt / LIFE;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.fillStyle = color;
    for (const k of live) {
      const v = (heat[k] -= fade);
      if (v <= 0) { heat[k] = 0; live.delete(k); continue; }
      const i = k % cols, j = (k / cols) | 0;
      if (v > BAYER[(j & 3) * 4 + (i & 3)]) ctx.fillRect(i * CELL + 1, j * CELL + 1, CELL - 2, CELL - 2);
    }
    raf = live.size ? requestAnimationFrame(tick) : 0;
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const x = e.clientX, y = e.clientY;
    if (px < 0) { px = x; py = y; return; }
    const dist = Math.hypot(x - px, y - py);
    // faster moves leave a hotter, denser trail; resting leaves nothing
    const amt = Math.min(0.95, 0.35 + dist / 60);
    const steps = Math.max(1, Math.ceil(dist / (CELL * 1.5)));
    for (let s = 1; s <= steps; s++) stamp(px + ((x - px) * s) / steps, py + ((y - py) * s) / steps, amt * (0.6 + 0.4 * s / steps));
    px = x; py = y;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { px = py = -1; });
}
