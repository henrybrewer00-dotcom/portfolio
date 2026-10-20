/* The opening: a few seconds before "who are you?". Faint dither static gathers into "henry." (its dot blue),
   which then re-dithers into "hello." in exactly the spot, size and face where the page draws its own "hello.".
   Then the dark cover dissolves dot by dot around the letters, so the page's dotted background comes through,
   and the intro's letters fade into the page's identical ones underneath: no cut, the last frame is the page.
   Plays on every visit (Henry asked for that); any click, tap or key skips it; off for reduced motion and deep links.
   A returning visitor's page already says "henry.", so for them the word just stays put. */

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map((v) => (v + 0.5) / 64);
// seconds: static, gather into "henry.", hold, re-dither into "hello.", dissolve into the page
const T = { noise: 0.8, gather: 0.9, hold: 0.5, morph: 0.7, reveal: 1.1 };
const CELL = 3;   // css px per dot: the same grain as the page's background, so the dots carry straight through
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function boot({ skip = false, word = "hello.", onReveal = () => {} } = {}) {
  const root = document.documentElement;
  if (skip || matchMedia("(prefers-reduced-motion: reduce)").matches) { root.classList.remove("is-booting"); return Promise.resolve(); }

  const cv = document.createElement("canvas");
  cv.className = "boot"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d"), css = getComputedStyle(root);
  const ink = css.getPropertyValue("--ink").trim() || "#ece8de", accent = css.getPropertyValue("--accent").trim() || "#4b7bff";
  const paper = css.getPropertyValue("--paper").trim() || "#0e0e0c";

  let W, H, cols, rows, from, to, dot;
  // a word laid out the way the page's engraving lays it out (src/shader.js layout(), in css px), sampled per dot
  const wordMask = (text) => {
    const small = W < 700, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), face = (s) => `400 ${s}px "Instrument Serif", Georgia, serif`;
    let size = Math.min(H * (small ? 0.3 : 0.42), W * 0.9);
    g.font = face(size);
    let m = g.measureText(text).width;
    if (m > W * 0.88) { size *= (W * 0.88) / m; g.font = face(size); m = g.measureText(text).width; }
    g.textBaseline = "middle"; g.textAlign = "left";
    const x0 = W / 2 - m / 2, y = H * (small ? 0.3 : 0.36);
    g.fillStyle = "#fff"; g.fillText(text.slice(0, -1), x0, y);
    g.fillStyle = "#f00"; g.fillText(text.slice(-1), x0 + g.measureText(text.slice(0, -1)).width, y);
    const d = g.getImageData(0, 0, W, H).data, on = new Uint8Array(cols * rows), last = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = Math.min(W - 1, i * CELL + 1), yy = Math.min(H - 1, j * CELL + 1), p = (yy * W + x) * 4;
      on[j * cols + i] = d[p] > 110 ? 1 : 0; last[j * cols + i] = d[p] > 110 && d[p + 1] < 80 ? 1 : 0;
    }
    return { on, last };
  };
  // drawn straight into pixels at css resolution (one canvas px per css px, scaled up crisp): a full screen of
  // 3px dots is a couple hundred thousand cells a frame, far too many for fillRect calls
  let img, px;
  const rgb = (hex) => { const n = parseInt(hex.replace("#", "").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const P = rgb(paper), I = rgb(ink), A = rgb(accent);
  const shades = new Map();
  const shade = (c, al, covered) => {
    const key = (c === A ? 100 : 0) + (covered ? 50 : 0) + al * 20;
    let v = shades.get(key);
    if (v === undefined) shades.set(key, (v = covered ? pack(c.map((n, q) => Math.round(P[q] + (n - P[q]) * al)), 1) : pack(c, al)));
    return v;
  };
  const pack = (c, a) => ((Math.round(a * 255) << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;   // little-endian RGBA
  const size = () => {
    W = innerWidth; H = innerHeight;
    cv.width = W; cv.height = H;
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
    img = ctx.createImageData(W, H); px = new Uint32Array(img.data.buffer);
    const a = wordMask("henry."), b = word === "henry." ? a : wordMask(word);
    from = a.on; dot = a.last; to = b.on;
  };
  cv.width = innerWidth; cv.height = innerHeight; ctx.fillStyle = paper; ctx.fillRect(0, 0, cv.width, cv.height);
  // the letters need their real face, so wait (briefly) for the font before drawing the masks
  const font = document.fonts ? Promise.race([document.fonts.load('400 100px "Instrument Serif"'), new Promise((r) => setTimeout(r, 700))]) : Promise.resolve();

  return font.then(() => new Promise((resolve) => {
    size();
    addEventListener("resize", size);
    const t1 = T.noise, t2 = t1 + T.gather, t3 = t2 + T.hold, t4 = t3 + T.morph, total = t4 + T.reveal;
    let start = 0, raf = 0, ended = false, revealed = false;
    const reveal = () => { if (revealed) return; revealed = true; root.classList.remove("is-booting"); onReveal(); };
    const end = () => {
      if (ended) return; ended = true;
      cancelAnimationFrame(raf); reveal();
      removeEventListener("resize", size); removeEventListener("pointerdown", end); removeEventListener("keydown", end);
      cv.classList.add("is-gone");               // only matters on a skip: a natural end is already see-through
      setTimeout(() => cv.remove(), 700);
      resolve();
    };
    const frame = (now) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      if (t >= total) { end(); return; }
      if (t >= t4) reveal();                     // the page starts showing through as the cover dissolves
      const noise = smooth(0, t1 * 0.8, t) * (1 - smooth(t1, t2 * 0.9, t)) * 0.16;
      const gather = smooth(t1 * 0.6, t2, t);      // "henry." dots appearing
      const morph = smooth(t3, t4, t);             // "henry." → "hello.", dot by dot
      const cover = 1 - smooth(t4, total - 0.25, t); // share of the dark cover still in place
      const fade = 1 - smooth(t4 + T.reveal * 0.45, total, t); // the intro's letters giving way to the page's own
      const seed = Math.floor(t * 9);             // the static shifts nine times a second, not every frame
      px.fill(0);
      const paperPx = pack(P, 1);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i, b = BAYER[(j & 7) * 8 + (i & 7)];
          const covered = b < cover;
          // which word this dot belongs to right now: each dot switches over at its own threshold
          const inWord = b < morph ? to[k] : from[k] && b < gather;
          let c = null, al = 1;
          if (inWord) { c = b >= morph && dot[k] ? A : I; al = fade; }
          else if (hash(i, j, seed) < noise) { c = I; al = 0.35; }
          if (c && al <= 0.01) c = null;
          if (!covered && !c) continue;
          // over the cover a dot is mixed onto paper; uncovered, it is a translucent dot over the page
          const dotPx = c ? shade(c, Math.round(al * 20) / 20, covered) : 0;
          const x0 = i * CELL, y0 = j * CELL;
          for (let y = y0; y < y0 + CELL && y < H; y++) {
            const row = y * W;
            for (let x = x0; x < x0 + CELL && x < W; x++) {
              const edge = x === x0 + CELL - 1 || y === y0 + CELL - 1;   // a 1px gap keeps them reading as dots
              px[row + x] = c && !edge ? dotPx : covered ? paperPx : 0;
            }
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // skip on any click, tap or key
    setTimeout(() => { addEventListener("pointerdown", end, { once: true }); addEventListener("keydown", end, { once: true }); }, 150);
  }));
}
