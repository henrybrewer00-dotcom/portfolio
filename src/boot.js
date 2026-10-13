/* The opening: a few seconds before "who are you?". The dark screen fills with faint dither static, the static
   gathers into a big "henry." (its dot lit orange), holds a beat, then thins out dot by dot into the page underneath.
   Plays once per browser; any click, tap or key skips it; off for reduced motion and deep links. */

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map((v) => (v + 0.5) / 64);
const T = { noise: 0.9, gather: 1.0, hold: 0.7, out: 0.8 };   // seconds
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function boot({ key = "henry.booted", skip = false } = {}) {
  let seen = false;
  try { seen = localStorage.getItem(key) === "1"; } catch (e) {}
  if (skip || seen || matchMedia("(prefers-reduced-motion: reduce)").matches) { document.documentElement.classList.remove("is-booting"); return Promise.resolve(); }
  try { localStorage.setItem(key, "1"); } catch (e) {}

  const cv = document.createElement("canvas");
  cv.className = "boot"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  document.documentElement.classList.add("is-booting");
  const ctx = cv.getContext("2d"), css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue("--ink").trim() || "#ece8de", accent = css.getPropertyValue("--accent").trim() || "#ff6a2b";
  const paper = css.getPropertyValue("--paper").trim() || "#0e0e0c";

  let W = innerWidth, H = innerHeight, cell, cols, rows, mask, dot;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cell = W < 700 ? 5 : 6;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    // the wordmark, drawn small (one pixel per dot) to read back as a mask
    const m = document.createElement("canvas"); m.width = cols; m.height = rows;
    const mc = m.getContext("2d"), fs = Math.min(cols * 0.26, rows * 0.42);
    mc.font = `400 ${fs}px "Instrument Serif", Georgia, serif`; mc.textAlign = "center"; mc.textBaseline = "middle";
    mc.fillStyle = "#fff"; mc.fillText("henry", cols / 2 - fs * 0.12, rows * 0.46);
    const wordW = mc.measureText("henry").width;
    mc.fillStyle = "#f00"; mc.fillText(".", cols / 2 - fs * 0.12 + wordW / 2 + fs * 0.07, rows * 0.46);
    const d = mc.getImageData(0, 0, cols, rows).data;
    mask = new Float32Array(cols * rows); dot = new Uint8Array(cols * rows);
    for (let k = 0; k < cols * rows; k++) { const r = d[k * 4], g = d[k * 4 + 1]; mask[k] = Math.max(r, g) / 255; dot[k] = r > 128 && g < 80 ? 1 : 0; }
  };
  ctx.fillStyle = paper; ctx.fillRect(0, 0, cv.width, cv.height);
  // the wordmark needs its real face, so wait (briefly) for the font before drawing the mask
  const font = document.fonts ? Promise.race([document.fonts.load('400 100px "Instrument Serif"'), new Promise((r) => setTimeout(r, 700))]) : Promise.resolve();

  return font.then(() => new Promise((resolve) => {
    size();
    addEventListener("resize", size);
    const total = T.noise + T.gather + T.hold + T.out;
    let start = 0, raf = 0, ended = false;
    const end = () => {
      if (ended) return; ended = true;
      cancelAnimationFrame(raf);
      cv.classList.add("is-gone");
      document.documentElement.classList.remove("is-booting");
      removeEventListener("resize", size); removeEventListener("pointerdown", end); removeEventListener("keydown", end);
      setTimeout(() => cv.remove(), 600);
      resolve();
    };
    const frame = (now) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      if (t >= total) { end(); return; }
      const noise = smooth(0, T.noise * 0.8, t) * (1 - smooth(T.noise, T.noise + T.gather * 0.8, t)) * 0.16;
      const gather = smooth(T.noise * 0.6, T.noise + T.gather, t);
      const out = smooth(total - T.out, total, t);
      const seed = Math.floor(t * 9);          // the static shifts nine times a second, not every frame
      ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
      const s = cell - 2;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i, b = BAYER[(j & 7) * 8 + (i & 7)];
          let on = false, hot = false;
          if (mask[k] > 0.4 && b < gather && b >= out) { on = true; hot = dot[k] === 1; }
          else if (hash(i, j, seed) < noise) on = true;
          if (!on) continue;
          ctx.fillStyle = hot ? accent : ink;
          ctx.globalAlpha = hot || mask[k] > 0.4 ? 1 : 0.35;
          ctx.fillRect(i * cell + 1, j * cell + 1, s, s);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // skip on any click, tap or key (the click is swallowed so it can't land on something under the overlay)
    setTimeout(() => { addEventListener("pointerdown", end, { once: true }); addEventListener("keydown", end, { once: true }); }, 150);
  }));
}
