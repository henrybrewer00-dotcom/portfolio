/* The pick tiles' frame: a soft dithered border that fades inward, drawn on a canvas behind each tile's text in the
   same 3px ordered-dither grain as the background and the enter button. Hover eases one number from 0 to 1, and the
   border thickens a little and turns orange with it, so nothing jumps or bounces. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CELL = 3;
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const BONE = "rgba(236, 232, 222, 0.2)";

// whether the dot at (x, y) with threshold b is off (0), grey ("g") or orange ("o"), at hover progress p
function frame(x, y, w, h, b, p) {
  const e = Math.min(x, y, w - x - CELL, h - y - CELL), reach = 10 + 4 * p;
  const d = clamp(1 - e / reach) ** 1.6;
  if (b >= d * 0.85) return 0;
  return b < d * 0.85 * p ? "o" : "g";
}

export function ditherTiles(container) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff6a2b";

  const setup = (pin) => {
    if (pin.querySelector(".pin-dots")) return;
    const cv = document.createElement("canvas");
    cv.className = "pin-dots"; cv.setAttribute("aria-hidden", "true");
    pin.prepend(cv);
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, p = 0, target = 0, raf = 0, last = 0;
    const size = () => {
      const r = pin.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      if (!w) size();
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const k = ease(p), grey = [], orange = [];
      for (let y = 0, j = 0; y < h; y += CELL, j++) {
        for (let x = 0, i = 0; x < w; x += CELL, i++) {
          const c = frame(x, y, w, h, BAYER[(j & 3) * 4 + (i & 3)], k);
          if (c === "g") grey.push(x, y); else if (c === "o") orange.push(x, y);
        }
      }
      ctx.fillStyle = BONE;
      for (let n = 0; n < grey.length; n += 2) ctx.fillRect(grey[n], grey[n + 1], CELL - 1, CELL - 1);
      ctx.fillStyle = accent;
      for (let n = 0; n < orange.length; n += 2) ctx.fillRect(orange[n], orange[n + 1], CELL - 1, CELL - 1);
    };
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      p = target > p ? Math.min(target, p + dt * 1.6) : Math.max(target, p - dt * 1.3); // in ~0.6s, out a touch slower
      draw();
      raf = p !== target ? requestAnimationFrame(tick) : 0;
    };
    const go = (t) => {
      target = t;
      if (reduce) { p = t; draw(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    pin.addEventListener("pointerenter", () => go(1));
    pin.addEventListener("pointerleave", () => { if (!pin.matches(":focus-visible")) go(0); });
    pin.addEventListener("focus", () => { if (pin.matches(":focus-visible")) go(1); });
    pin.addEventListener("blur", () => go(0));
    new ResizeObserver(() => { w = 0; draw(); }).observe(pin);
  };

  const scan = () => container.querySelectorAll(".pin").forEach(setup);
  new MutationObserver(scan).observe(container, { childList: true });
  scan();
}
