/* The enter buttons: on hover, black dither dots fill the bone-white button from left to right, with a ragged ordered-dither
   edge rather than a hard wipe, and the label swaps (↵ → enter). Leaving drains it back the same way. Pressing it
   (or hitting Enter in its form) fills it all the way once, as the "sent" beat. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CELL = 3;   // css px per dot, same grain as the background
const BAND = 0.5; // how ragged the edge is, as a share of the button's width
const ease = (t) => t * t * (3 - 2 * t);

export function fillButtons(buttons) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const btn of buttons) {
    const cv = btn.querySelector(".fill-dots"), ctx = cv.getContext("2d");
    let w = 0, h = 0, p = 0, target = 0, raf = 0, last = 0, hold = 0;
    const size = () => {
      const r = btn.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      if (!w) size();
      ctx.clearRect(0, 0, w, h);
      btn.classList.toggle("is-filled", p > 0.55);
      if (p <= 0) return;
      ctx.fillStyle = getComputedStyle(btn).getPropertyValue("--paper").trim() || "#000";
      const front = ease(p) * (1 + BAND);
      for (let y = 0, j = 0; y < h; y += CELL, j++) {
        for (let x = 0, i = 0; x < w; x += CELL, i++) {
          // a dot is on once the front has passed it by more than its threshold
          if (front - x / w > BAYER[(j & 3) * 4 + (i & 3)] * BAND) ctx.fillRect(x, y, CELL, CELL);
        }
      }
    };
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      const goal = hold > now ? 1 : target, speed = goal > p ? 2.4 : 1.8; // fills in ~0.4s, drains a bit slower
      p = goal > p ? Math.min(goal, p + dt * speed) : Math.max(goal, p - dt * speed);
      draw();
      raf = p !== goal || hold > now ? requestAnimationFrame(tick) : 0;
    };
    const go = (t) => {
      target = t;
      if (reduce) { p = hold > performance.now() ? 1 : t; draw(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const on = () => go(1), off = () => { if (!btn.matches(":focus-visible")) go(0); };
    btn.addEventListener("pointerenter", on);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("focus", () => { if (btn.matches(":focus-visible")) on(); });
    btn.addEventListener("blur", () => go(0));
    const pulse = () => { hold = performance.now() + 450; go(target); };
    (btn.form || btn.closest("form"))?.addEventListener("submit", pulse);
    addEventListener("resize", () => { w = 0; draw(); });
  }
}
