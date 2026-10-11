/* =========================================================================
   henry. — the engraving ("money shader"), ink on paper, and the physics
   behind it. Wavy banknote lines whose thickness carries the shading; the
   word is drawn to an offscreen mask and the lines swell where it is.

   Two simulations run on the CPU every frame:
   - a water surface (2D wave equation on a coarse grid) that the cursor drags
     through, typing taps, and Enter splashes. The lines ride its height, and
     its slopes shade them like light on a relief.
   - the letters of the word, each a small rigid body on a spring. The cursor is
     a solid disc that knocks them; you can grab one, throw it, and it wobbles
     home. Fast letters splash the water.
   Raw WebGL2, no library.
   ========================================================================= */

const VERT = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uA, uB, uW;
uniform float uMix, uHotA, uHotB, uTime, uTilt, uDpr;
uniform vec2 uRes, uWTexel;
uniform vec3 uPaper, uPaperDeep, uInk, uPink;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }

// one family of engraved lines. v is the line coordinate; width 0..1 is how much of each period is ink
float engrave(float v, float width) {
  float d = abs(fract(v) - 0.5) * 2.0;
  float aa = fwidth(v) * 1.6;
  return smoothstep(1.0 - width - aa, 1.0 - width + aa, d);
}
float water(vec2 t) { return (texture(uW, t).r - 0.5) * 4.0; }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 tuv = vec2(uv.x, 1.0 - uv.y);
  vec2 p = gl_FragCoord.xy / uDpr;                 // css pixels, so line spacing is the same on every screen

  // the water: height and slope
  float h = water(tuv);
  vec2 g = vec2(water(tuv + vec2(uWTexel.x, 0.0)) - water(tuv - vec2(uWTexel.x, 0.0)),
                water(tuv + vec2(0.0, uWTexel.y)) - water(tuv - vec2(0.0, uWTexel.y)));

  // the new word inks in with a ragged left-to-right sweep, like a plate being pulled
  float rag = vnoise(vec2(p.y * 0.02, 3.0)) * 0.18;
  float front = uMix * 1.5 - 0.25;
  float m = uMix >= 1.0 ? 1.0 : 1.0 - smoothstep(front - 0.08, front + 0.08, uv.x + rag);
  vec2 wt = tuv - g * 0.012;                       // the word refracts through the water
  vec2 src = mix(texture(uA, wt).rg, texture(uB, wt).rg, m);
  float hot = mix(uHotA, uHotB, m);
  float sharp = src.r, glow = src.g;

  float n = fbm(p * 0.0024 + vec2(uTime * 0.03, -uTime * 0.02));
  float relief = glow * 2.2 + sharp * 0.35;        // lines bow over the letters, so the word reads as raised metal
  float wave = sin(p.x * 0.006 + uTime * 0.25) * 1.2 + sin(p.x * 0.0021 - uTime * 0.11) * 2.0;
  float v = (p.y + p.x * (0.08 + uTilt)) / 5.0 + wave + n * 1.6 + relief + h * 2.4;

  // light from the top left: slopes facing away from it get heavier lines, slopes facing it get lighter
  float shade = clamp((g.x - g.y) * 1.6, -1.0, 1.0);
  float field = 0.06 + 0.04 * n;
  float tone = clamp(field + max(shade, 0.0) * 0.4 + glow * 0.26 + sharp * mix(0.62, 0.3, hot), 0.0, 0.92);
  tone *= 1.0 - max(-shade, 0.0) * 0.6;
  float ink = engrave(v, tone);

  // the "money" cross-hatch, only in the letter cores
  float v2 = (p.x - p.y * 0.55) / 3.4 + relief * 0.6;
  ink = max(ink, engrave(v2, 0.32) * smoothstep(0.55, 0.95, sharp) * (1.0 - hot));

  float vig = smoothstep(1.15, 0.25, length((uv - vec2(0.5, 0.55)) * vec2(uRes.x / uRes.y, 1.0)));
  ink *= mix(0.25, 1.0, max(max(vig, sharp), min(abs(h) * 2.0, 1.0)));   // ripples show even out at the edges

  float word = smoothstep(0.1, 0.6, sharp + glow * 0.3);
  float strength = mix(0.88, 0.55, hot * (1.0 - word));

  vec3 paper = mix(uPaperDeep, uPaper, smoothstep(1.4, 0.2, length(uv - 0.5)));
  paper -= (vnoise(p * 0.9) - 0.5) * 0.02;
  paper += max(-shade, 0.0) * 0.035;                // a glint on the lit side of a wave
  // pink is a fill, never a line: the answer's letters, and the crest of a big splash
  paper = mix(paper, uPink, hot * smoothstep(0.35, 0.8, sharp) + smoothstep(0.6, 1.6, h) * 0.45);
  o = vec4(mix(paper, uInk, ink * strength), 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ show(text: string, hot: boolean): void, pulse(x: number, y: number): void, ripple(x: number, y: number, amount?: number): void, tilt(v: number): void } | null} null when WebGL2 is missing
 */
export function createEngraving(canvas, { reduceMotion = false } = {}) {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ["uA", "uB", "uW", "uMix", "uHotA", "uHotB", "uTime", "uTilt", "uDpr", "uRes", "uWTexel", "uPaper", "uPaperDeep", "uInk", "uPink"]) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform3fv(U.uPaper, hex("#efede8"));
  gl.uniform3fv(U.uPaperDeep, hex("#e4e2da"));
  gl.uniform3fv(U.uInk, hex("#141412"));
  gl.uniform3fv(U.uPink, hex("#f2a9b8"));
  gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1); gl.uniform1i(U.uW, 2);

  const newTex = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const tex = [newTex(), newTex()], waterTex = newTex();
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  /* ---------- the water ---------- */
  const CELL = 7;                                  // css px per cell
  let GW = 2, GH = 2, wa = new Float32Array(4), wb = new Float32Array(4), wbytes = new Uint8Array(4), calm = true;

  function resizeWater() {
    GW = Math.ceil(innerWidth / CELL) + 2; GH = Math.ceil(innerHeight / CELL) + 2;
    wa = new Float32Array(GW * GH); wb = new Float32Array(GW * GH); wbytes = new Uint8Array(GW * GH).fill(128);
    gl.bindTexture(gl.TEXTURE_2D, waterTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, GW, GH, 0, gl.RED, gl.UNSIGNED_BYTE, wbytes);
  }

  // push the surface down (or up) around a point, in css px
  function disturb(x, y, radius, amount) {
    const cx = x / CELL, cy = y / CELL, r = radius / CELL, r2 = r * r;
    for (let j = Math.max(1, Math.floor(cy - r)); j <= Math.min(GH - 2, Math.ceil(cy + r)); j++) {
      for (let i = Math.max(1, Math.floor(cx - r)); i <= Math.min(GW - 2, Math.ceil(cx + r)); i++) {
        const d2 = (i - cx) ** 2 + (j - cy) ** 2;
        if (d2 < r2) wa[j * GW + i] += amount * (1 - d2 / r2) ** 2;
      }
    }
    calm = false;
  }

  function stepWater() {
    if (calm) return;
    let energy = 0;
    for (let k = 0; k < 2; k++) {
      for (let j = 1; j < GH - 1; j++) {
        const row = j * GW;
        for (let i = 1; i < GW - 1; i++) {
          const c = row + i;
          wb[c] = ((wa[c - 1] + wa[c + 1] + wa[c - GW] + wa[c + GW]) * 0.5 - wb[c]) * 0.982;
        }
      }
      const t = wa; wa = wb; wb = t;
    }
    for (let c = 0; c < wa.length; c++) {
      const v = wa[c];
      energy += v < 0 ? -v : v;
      wbytes[c] = clamp(128 + v * 32, 0, 255);
    }
    if (energy < 0.5) { wa.fill(0); wb.fill(0); wbytes.fill(128); calm = true; }
    gl.bindTexture(gl.TEXTURE_2D, waterTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.RED, gl.UNSIGNED_BYTE, wbytes);
  }

  /* ---------- the word: a mask (R = letters, G = halo) and one body per letter ---------- */
  const mask = document.createElement("canvas");
  const mx = mask.getContext("2d");
  const font = (size) => `400 ${size}px "Instrument Serif", Georgia, serif`;
  let W = 64, H = 64;                              // mask px = css px / 2

  function layout(text, hot) {
    const small = innerWidth < 700;
    let size = Math.min(H * (small ? 0.3 : 0.42), W * 0.9);
    mx.font = font(size);
    let m = mx.measureText(text).width;
    if (m > W * 0.88) { size *= (W * 0.88) / m; mx.font = font(size); m = mx.measureText(text).width; }
    const y = H * (hot ? 0.8 : small ? 0.3 : 0.36), x0 = W / 2 - m / 2;
    const letters = [...text].map((ch, i) => {
      const before = mx.measureText(text.slice(0, i)).width, w = mx.measureText(ch).width;
      // radius: a letter is roughly as wide as it is, but never thinner than a third of the type size
      return { ch, w, r: Math.max(w, size * 0.32) * 0.48, rx: x0 + before + w / 2, ry: y, ox: 0, oy: 0, vx: 0, vy: 0, a: 0, va: 0 };
    });
    return { text, hot, size, letters, awake: true };
  }

  function paint(target, word) {
    mx.globalCompositeOperation = "source-over"; mx.shadowBlur = 0;
    mx.fillStyle = "#000"; mx.fillRect(0, 0, W, H);
    mx.globalCompositeOperation = "lighter";
    mx.font = font(word.size); mx.textBaseline = "middle"; mx.textAlign = "center";
    const pass = (color, blur) => {
      mx.fillStyle = color; mx.shadowColor = color; mx.shadowBlur = blur;
      for (const l of word.letters) {
        // squash and stretch along the direction of travel
        const sp = Math.hypot(l.vx, l.vy), st = Math.min(sp * 0.012, 0.22);
        const dir = sp > 0.01 ? Math.atan2(l.vy, l.vx) : 0;
        mx.save(); mx.translate(l.rx + l.ox, l.ry + l.oy);
        mx.rotate(dir); mx.scale(1 + st, 1 - st * 0.6); mx.rotate(-dir);
        mx.rotate(l.a); mx.fillText(l.ch, 0, 0); mx.restore();
      }
    };
    pass("#00ff00", word.size * 0.3);
    pass("#ff0000", 0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  }

  /* ---------- the cursor ---------- */
  const mouse = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, vx: 0, vy: 0, inside: false, grab: null, gx: 0, gy: 0 };
  const CURSOR_R = 26;                             // css px: the solid disc the cursor pushes with
  let cur = null, prev = null;

  const letterAt = (x, y) => {
    let best = null, bd = Infinity;
    for (const l of cur.letters) {
      const d = Math.hypot(l.rx + l.ox - x / 2, l.ry + l.oy - y / 2);
      if (d < l.r * 1.15 && d < bd) { best = l; bd = d; }
    }
    return best;
  };
  const busy = (el) => el && el.closest && el.closest("a, button, input, .card, .pin, .chips, .bar, .answer");

  addEventListener("pointermove", (e) => {
    if (mouse.x < -1e3) { mouse.px = e.clientX; mouse.py = e.clientY; }
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true;
    if (!mouse.grab && e.pointerType !== "touch") {
      document.documentElement.style.cursor = !busy(e.target) && letterAt(e.clientX, e.clientY) ? "grab" : "";
    }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mouse.inside = false; });
  addEventListener("pointerdown", (e) => {
    if (reduceMotion || busy(e.target)) return;
    const l = letterAt(e.clientX, e.clientY);
    if (!l) { disturb(e.clientX, e.clientY, 60, -2.2); return; }   // a click on the paper is a tap on the water
    mouse.grab = l; mouse.gx = e.clientX / 2 - (l.rx + l.ox); mouse.gy = e.clientY / 2 - (l.ry + l.oy);
    mouse.x = mouse.px = e.clientX; mouse.y = mouse.py = e.clientY; mouse.inside = true;
    document.documentElement.style.cursor = "grabbing"; document.body.style.userSelect = "none";
    cur.awake = true;
    e.preventDefault();
  });
  const release = () => { if (mouse.grab) { mouse.grab = null; document.documentElement.style.cursor = ""; document.body.style.userSelect = ""; } };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);

  /* ---------- letter physics, in mask px ---------- */
  function stepLetters(word) {
    let moving = false;
    const L = word.letters, cmx = mouse.x / 2, cmy = mouse.y / 2, cr = CURSOR_R / 2;
    const mvx = clamp(mouse.vx / 2, -18, 18), mvy = clamp(mouse.vy / 2, -18, 18);
    for (const l of L) {
      if (l === mouse.grab) {
        // held: chase the hand hard, tilt with the swing
        const tx = cmx - mouse.gx - l.rx, ty = cmy - mouse.gy - l.ry;
        l.vx = (tx - l.ox) * 0.45; l.vy = (ty - l.oy) * 0.45;
        l.va += (clamp(l.vx * 0.03, -0.5, 0.5) - l.a) * 0.2; l.va *= 0.7;
      } else {
        l.vx += -l.ox * 0.055; l.vy += -l.oy * 0.055; // spring home
        l.va += -l.a * 0.06;
        l.vx *= 0.9; l.vy *= 0.9; l.va *= 0.88;
        // the cursor is solid: if it overlaps a letter, the letter is pushed out and picks up its momentum
        if (mouse.inside && !mouse.grab) {
          const cx = l.rx + l.ox, cy = l.ry + l.oy, dx = cx - cmx, dy = cy - cmy, d = Math.hypot(dx, dy) || 1, min = l.r + cr;
          if (d < min) {
            const nx = dx / d, ny = dy / d, push = min - d;
            l.ox += nx * push * 0.5; l.oy += ny * push * 0.5;
            const along = Math.max(0, mvx * nx + mvy * ny);
            l.vx += nx * (along * 0.55 + 0.5); l.vy += ny * (along * 0.55 + 0.5);
            l.va += (mvx * ny - mvy * nx) * 0.004;   // a glancing hit spins it
          }
        }
      }
      l.ox += l.vx; l.oy += l.vy; l.a = clamp(l.a + l.va, -1.2, 1.2);
      // a loose tether: thrown letters can fly, but never off into the corners
      const far = Math.hypot(l.ox, l.oy), lim = word.size * (l === mouse.grab ? 3 : 1.4);
      if (far > lim) { l.ox *= lim / far; l.oy *= lim / far; l.vx *= 0.5; l.vy *= 0.5; }
    }
    // letters bump each other instead of passing through
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < Math.min(L.length, i + 3); j++) {
      const p = L[i], q = L[j];
      const dx = (q.rx + q.ox) - (p.rx + p.ox), dy = (q.ry + q.oy) - (p.ry + p.oy), d = Math.hypot(dx, dy) || 1;
      const rest = Math.hypot(q.rx - p.rx, q.ry - p.ry), min = Math.min(rest, (p.r + q.r) * 0.8);
      if (d < min) {
        const nx = dx / d, ny = dy / d, k = (min - d) * 0.5;
        if (p !== mouse.grab) { p.ox -= nx * k; p.oy -= ny * k; }
        if (q !== mouse.grab) { q.ox += nx * k; q.oy += ny * k; }
        const rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
        if (rv < 0) { p.vx += nx * rv * 0.5; p.vy += ny * rv * 0.5; q.vx -= nx * rv * 0.5; q.vy -= ny * rv * 0.5; }
      }
    }
    for (const l of L) {
      const sp = Math.hypot(l.vx, l.vy);
      if (sp > 4) disturb((l.rx + l.ox) * 2, (l.ry + l.oy) * 2, 34, Math.min(sp * 0.05, 0.9));   // fast letters splash
      if (l === mouse.grab || Math.abs(l.ox) + Math.abs(l.oy) + Math.abs(l.a) * 40 + sp + Math.abs(l.va) * 40 > 0.05) moving = true;
      else { l.ox = l.oy = l.vx = l.vy = l.a = l.va = 0; }
    }
    return moving;
  }

  /* ---------- frame ---------- */
  let mixStart = -1e9, tiltTarget = 0, tiltNow = 0, dpr = 1;
  const FADE = 1100;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    W = mask.width = Math.max(64, Math.round(innerWidth / 2)); H = mask.height = Math.max(64, Math.round(innerHeight / 2));
    const same = !cur || prev === cur;
    prev = layout(prev ? prev.text : "henry.", prev ? prev.hot : 0);
    cur = same ? prev : layout(cur.text, cur.hot);
    paint(tex[0], prev); paint(tex[1], cur);
    resizeWater();
    gl.uniform2f(U.uWTexel, 1 / GW, 1 / GH);
    if (reduceMotion) frame(performance.now());
  }

  function frame(now) {
    if (!reduceMotion) {
      // cursor velocity, then the cursor drags a wake through the water along the path it moved
      mouse.vx = mouse.x - mouse.px; mouse.vy = mouse.y - mouse.py;
      const sp = Math.hypot(mouse.vx, mouse.vy);
      if (mouse.inside && sp > 0.5 && !mouse.grab) {
        const steps = Math.min(8, Math.ceil(sp / 14)), amt = -Math.min(0.25 + sp * 0.02, 1.1) / steps;
        for (let s = 1; s <= steps; s++) disturb(mouse.px + (mouse.vx * s) / steps, mouse.py + (mouse.vy * s) / steps, 38, amt);
      }
      if (cur.awake || mouse.inside) { cur.awake = stepLetters(cur); paint(tex[1], cur); }
      mouse.px = mouse.x; mouse.py = mouse.y;
      stepWater();
    }
    const k = Math.min(1, (now - mixStart) / FADE), e = k * k * (3 - 2 * k);
    tiltNow += (tiltTarget - tiltNow) * 0.06;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[1]);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, waterTex);
    gl.uniform1f(U.uMix, k >= 1 ? 1 : e);
    gl.uniform1f(U.uHotA, prev.hot); gl.uniform1f(U.uHotB, cur.hot);
    gl.uniform1f(U.uTime, reduceMotion ? 12 : now / 1000);
    gl.uniform1f(U.uTilt, tiltNow);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let raf = 0;
  const loop = (now) => { raf = requestAnimationFrame(loop); frame(now); };
  const start = () => { if (!raf && !reduceMotion) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  resize();
  start();

  return {
    /** Cross-fade the engraving to a new word; `hot` turns its letters pink. */
    show(text, hot) {
      if (text === cur.text) return;
      mouse.grab = null;
      prev = cur; cur = layout(text, hot ? 1 : 0);
      [tex[0], tex[1]] = [tex[1], tex[0]];
      paint(tex[1], cur);
      mixStart = reduceMotion ? -1e9 : performance.now();
      if (reduceMotion) frame(performance.now());
    },
    /** Enter: a splash at (x, y) in css px. The wave rolls out and knocks the letters on its way. */
    pulse(x, y) {
      if (reduceMotion) return;
      disturb(x, y, 120, 5);
      for (const l of cur.letters) {
        const dx = l.rx - x / 2, dy = l.ry - y / 2, d = Math.hypot(dx, dy) || 1;
        l.vx += (dx / d) * 6; l.vy += (dy / d) * 6 - 3; l.va += (Math.random() - 0.5) * 0.1;
      }
      cur.awake = true;
    },
    /** A small tap on the water, e.g. under the caret as you type. */
    ripple(x, y, amount = 0.9) { if (!reduceMotion) disturb(x, y, 26, -amount); },
    /** Typing nudges the line angle a little. */
    tilt(v) { tiltTarget = v; },
  };
}
