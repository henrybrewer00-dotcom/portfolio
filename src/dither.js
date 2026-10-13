/* Dithered charts for "who's been here": ordered (Bayer 4×4) dithering in ink on the paper,
   so the bars read like the engraving above them. Bars grow in, a pixel step at a time. */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function setup(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = canvas.getContext("2d");
  return { ctx, w: canvas.width, h: canvas.height, px: Math.max(2, Math.round(2 * dpr)) };
}

// fills a w×h block at (x0, y0) with dots wherever density(fx, fy) beats the Bayer threshold
function fill(ctx, x0, y0, w, h, px, density) {
  for (let y = 0; y < h; y += px) for (let x = 0; x < w; x += px) {
    const i = ((y / px) & 3) * 4 + ((x / px) & 3);
    if (density(x / w, y / h) > BAYER[i]) ctx.fillRect(x0 + x, y0 + y, px, px);
  }
}

function grow(draw, reduce) {
  if (reduce) { draw(1); return; }
  const t0 = performance.now(), D = 900;
  const step = (now) => { const t = Math.min((now - t0) / D, 1); draw(1 - (1 - t) ** 3); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/** One horizontal bar per canvas: share 0..1 of the widest; `you` puts a pink wash behind it. */
export function bar(canvas, share, you, reduce) {
  const { ctx, w, h, px } = setup(canvas), ink = css("--ink"), pink = css("--pink");
  grow((k) => {
    ctx.clearRect(0, 0, w, h);
    const bw = Math.max(px, Math.round((w * share * k) / px) * px);
    if (you) { ctx.fillStyle = pink; ctx.fillRect(0, 0, bw, h); }
    ctx.fillStyle = ink;
    fill(ctx, 0, 0, bw, h, px, (fx) => 0.92 - fx * 0.5);
  }, reduce);
}

/** Columns for visits per day; the last one (today) gets the pink wash. */
export function columns(canvas, values, reduce) {
  const { ctx, w, h, px } = setup(canvas), ink = css("--ink"), pink = css("--pink");
  const max = Math.max(...values, 1), n = values.length, gap = px * 2;
  const cw = Math.floor((w - gap * (n - 1)) / n / px) * px;
  grow((k) => {
    ctx.clearRect(0, 0, w, h);
    values.forEach((v, i) => {
      const ch = Math.max(px, Math.round((h * (v / max) * k) / px) * px), x = i * (cw + gap), y = h - ch;
      if (i === n - 1) { ctx.fillStyle = pink; ctx.fillRect(x, y, cw, ch); }
      ctx.fillStyle = ink;
      fill(ctx, x, y, cw, ch, px, (fx, fy) => 0.4 + fy * 0.5);
    });
  }, reduce);
}
