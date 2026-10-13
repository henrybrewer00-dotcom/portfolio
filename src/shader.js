/* =========================================================================
   henry. — the dither field. Light dots on near-black, placed by an 8×8 Bayer
   matrix; the word is drawn to an offscreen mask and the dots crowd where it
   is, with slow clouds of sparse dots drifting behind.

   Kept calm on purpose: letters near the cursor rise a little, lean toward it
   and warm to orange, easing back when it leaves; a new word flips in, and
   Enter drops one soft ripple (a small wave-equation grid on the CPU) that
   the dots ride. Raw WebGL2, no library.
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

float water(vec2 t) { return (texture(uW, t).r - 0.5) * 4.0; }

// ordered dither thresholds, 8×8 Bayer
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  // everything is decided per dither cell (3 css px), so the dots stay crisp squares
  float CELL = 3.0;
  vec2 cell = floor(gl_FragCoord.xy / uDpr / CELL);
  vec2 p = (cell + 0.5) * CELL;                   // css pixels at the cell's centre
  vec2 uv = p * uDpr / uRes;
  vec2 tuv = vec2(uv.x, 1.0 - uv.y);

  // the water: height and slope
  float h = water(tuv);
  vec2 g = vec2(water(tuv + vec2(uWTexel.x, 0.0)) - water(tuv - vec2(uWTexel.x, 0.0)),
                water(tuv + vec2(0.0, uWTexel.y)) - water(tuv - vec2(0.0, uWTexel.y)));

  // the new word dithers in with a ragged left-to-right sweep
  float rag = vnoise(vec2(p.y * 0.02, 3.0)) * 0.18;
  float front = uMix * 1.5 - 0.25;
  float m = uMix >= 1.0 ? 1.0 : 1.0 - smoothstep(front - 0.08, front + 0.08, uv.x + rag);
  vec2 wt = tuv - g * 0.012;                       // the word refracts through the water
  vec3 src = mix(texture(uA, wt).rgb, texture(uB, wt).rgb, m);
  float hot = mix(uHotA, uHotB, m);
  float sharp = src.r, glow = src.g, blush = src.b;

  // slow clouds of dots drift behind the word; the tilt leans them as you type
  float n = fbm((p + vec2(p.y * uTilt * 4.0, 0.0)) * 0.0028 + vec2(uTime * 0.025, -uTime * 0.018));
  float shade = clamp((g.x - g.y) * 1.6, -1.0, 1.0);
  float field = 0.015 + smoothstep(0.42, 0.8, n) * 0.2;
  float vig = smoothstep(1.2, 0.2, length((uv - vec2(0.5, 0.55)) * vec2(uRes.x / uRes.y, 1.0)));
  float tone = field * mix(0.35, 1.0, vig) + glow * 0.16 + sharp * 0.86 + max(shade, 0.0) * 0.35 + abs(h) * 0.12;
  tone *= 1.0 - max(-shade, 0.0) * 0.5;
  float on = step(bayer8(cell) + 0.001, clamp(tone, 0.0, 0.97));

  // the accent is the dot colour, never a fill: the answer's word, letters you hover, a big splash
  float warm = clamp(hot * smoothstep(0.35, 0.8, sharp) + blush * 0.9 + smoothstep(0.6, 1.6, h) * 0.5, 0.0, 1.0);
  vec3 ink = mix(uInk, uPink, warm);
  vec3 paper = mix(uPaperDeep, uPaper, smoothstep(1.4, 0.2, length(uv - 0.5)));
  o = vec4(mix(paper, ink, on * mix(0.55, 1.0, max(sharp, warm))), 1.0);
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
  gl.uniform3fv(U.uPaper, hex("#121210"));
  gl.uniform3fv(U.uPaperDeep, hex("#0a0a09"));
  gl.uniform3fv(U.uInk, hex("#ece8de"));
  gl.uniform3fv(U.uPink, hex("#ff6a2b"));
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
          wb[c] = ((wa[c - 1] + wa[c + 1] + wa[c - GW] + wa[c + GW]) * 0.5 - wb[c]) * 0.975;
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
      return { ch, w, r: Math.max(w, size * 0.32) * 0.5, rx: x0 + before + w / 2, ry: y, flipAt: -1e9, lift: 0 };
    });
    return { text, hot, size, letters };
  }

  function paint(target, word, now = 0) {
    mx.globalCompositeOperation = "source-over"; mx.shadowBlur = 0;
    mx.fillStyle = "#000"; mx.fillRect(0, 0, W, H);
    mx.globalCompositeOperation = "lighter";
    mx.font = font(word.size); mx.textBaseline = "middle"; mx.textAlign = "center";
    const pass = (color, blur) => {
      mx.fillStyle = color === "blue" ? "#000" : color; mx.shadowColor = color === "blue" ? "#000" : color; mx.shadowBlur = blur;
      for (const l of word.letters) {
        // a flip is one full turn around the letter's vertical axis: its width goes 1 → 0 → -1 (the back) → 1
        const t = clamp((now - l.flipAt) / FLIP, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        const sx = Math.cos(e * Math.PI * 2), grow = 1 + Math.sin(e * Math.PI) * 0.06 + l.lift * 0.12;
        mx.save(); mx.translate(l.rx, l.ry - word.size * 0.05 * l.lift); mx.rotate(l.lean || 0);
        mx.scale((Math.abs(sx) < 0.04 ? 0.04 * Math.sign(sx || 1) : sx) * grow, grow);
        if (color === "blue") mx.fillStyle = `rgb(0,0,${Math.round(l.lift * 255)})`;
        mx.fillText(l.ch, 0, 0); mx.restore();
      }
    };
    pass("#00ff00", word.size * 0.3);
    pass("#ff0000", 0);
    pass("blue", 0);                               // B = how lifted each letter is (the hover blush)
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  }

  /* ---------- hover: letters near the cursor rise and lean toward it ---------- */
  const FLIP = 750;
  let cur = null, prev = null, flipping = false;
  // hover intent: a mouse just passing through barely stirs the letters; slowing down over them lets them rise
  const pointer = { x: 0, y: 0, on: false, t: 0, speed: 0, intent: 0 };
  const busy = (el) => el && el.closest && el.closest("a, button, input, .bar, .card, .pin, .chips, .answer, .results-head, .foot");
  addEventListener("pointermove", (e) => {
    const dt = Math.max(e.timeStamp - pointer.t, 8), d = Math.hypot(e.clientX / 2 - pointer.x, e.clientY / 2 - pointer.y) * 2;
    pointer.speed += (d / dt - pointer.speed) * 0.3; pointer.t = e.timeStamp;
    pointer.x = e.clientX / 2; pointer.y = e.clientY / 2;
    pointer.on = e.pointerType !== "touch" && !busy(e.target);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointer.on = false; });

  // eases every letter's lift toward how close the cursor is; true while anything is still moving
  function stepHover(word) {
    let moving = false;
    const R = word.size * 0.55;
    pointer.speed *= 0.9;                          // no pointermove means the mouse is resting
    const want = pointer.on ? clamp(1.4 - pointer.speed, 0.15, 1) : 0;
    pointer.intent += (want - pointer.intent) * (want > pointer.intent ? 0.06 : 0.2);
    for (const l of word.letters) {
      const dx = pointer.x - l.rx, dy = pointer.y - l.ry;
      const target = pointer.on ? Math.exp(-(dx * dx + dy * dy) / (R * R)) * pointer.intent : 0;
      const lean = pointer.on ? clamp(dx / R, -1, 1) * 0.08 * target : 0;
      const nl = l.lift + (target - l.lift) * 0.16, nlean = (l.lean || 0) + (lean - (l.lean || 0)) * 0.16;
      if (Math.abs(want - pointer.intent) > 0.01 || Math.abs(nl - l.lift) > 0.002 || Math.abs(nlean - (l.lean || 0)) > 0.0005) moving = true;
      l.lift = nl; l.lean = nlean;
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
      const hovering = stepHover(cur);
      if (flipping || hovering) { paint(tex[1], cur, now); flipping = cur.letters.some((l) => now - l.flipAt < FLIP); }
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
      prev = cur; cur = layout(text, hot ? 1 : 0);
      if (!reduceMotion) { const t0 = performance.now() + 350; cur.letters.forEach((l, i) => { l.flipAt = t0 + i * 60; }); flipping = true; }
      [tex[0], tex[1]] = [tex[1], tex[0]];
      paint(tex[1], cur);
      mixStart = reduceMotion ? -1e9 : performance.now();
      if (reduceMotion) frame(performance.now());
    },
    /** Enter: one soft ripple from (x, y) in css px. (The new word's letters flip in on show.) */
    pulse(x, y) {
      if (reduceMotion) return;
      disturb(x, y, 110, 1.4);
    },
    /** A small tap on the water, e.g. under the caret as you type. */
    ripple(x, y, amount = 0.9) { if (!reduceMotion) disturb(x, y, 26, -amount); },
    /** Typing nudges the line angle a little. */
    tilt(v) { tiltTarget = v; },
  };
}
