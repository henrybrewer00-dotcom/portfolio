/* =========================================================================
   henry. — the engraving ("money shader"), ink on paper. Wavy banknote lines
   whose thickness carries the shading; the word is drawn to an offscreen mask
   and the lines swell where it is.

   Kept calm on purpose: hovering a letter flips it once, like a coin, and
   Enter drops one soft ripple (a small wave-equation grid on the CPU) that
   the lines ride. Raw WebGL2, no library.
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
      return { ch, w, r: Math.max(w, size * 0.32) * 0.5, rx: x0 + before + w / 2, ry: y, flipAt: -1e9 };
    });
    return { text, hot, size, letters };
  }

  function paint(target, word, now = 0) {
    mx.globalCompositeOperation = "source-over"; mx.shadowBlur = 0;
    mx.fillStyle = "#000"; mx.fillRect(0, 0, W, H);
    mx.globalCompositeOperation = "lighter";
    mx.font = font(word.size); mx.textBaseline = "middle"; mx.textAlign = "center";
    const pass = (color, blur) => {
      mx.fillStyle = color; mx.shadowColor = color; mx.shadowBlur = blur;
      for (const l of word.letters) {
        // a flip is one full turn around the letter's vertical axis: its width goes 1 → 0 → -1 (the back) → 1
        const t = clamp((now - l.flipAt) / FLIP, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        const sx = Math.cos(e * Math.PI * 2), lift = 1 + Math.sin(e * Math.PI) * 0.06;
        mx.save(); mx.translate(l.rx, l.ry); mx.scale((Math.abs(sx) < 0.04 ? 0.04 * Math.sign(sx || 1) : sx) * lift, lift);
        mx.fillText(l.ch, 0, 0); mx.restore();
      }
    };
    pass("#00ff00", word.size * 0.3);
    pass("#ff0000", 0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  }

  /* ---------- hover: a letter flips once when the cursor reaches it ---------- */
  const FLIP = 750;
  let cur = null, prev = null, hovered = null, flipping = false;
  const letterAt = (x, y) => {
    let best = null, bd = Infinity;
    for (const l of cur.letters) {
      const d = Math.hypot(l.rx - x / 2, l.ry - y / 2);
      if (d < l.r && d < bd) { best = l; bd = d; }
    }
    return best;
  };
  addEventListener("pointermove", (e) => {
    if (reduceMotion || !cur) return;
    const l = letterAt(e.clientX, e.clientY);
    if (l && l !== hovered && performance.now() - l.flipAt > FLIP) { l.flipAt = performance.now(); flipping = true; }
    hovered = l;
  }, { passive: true });

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
      if (flipping) { paint(tex[1], cur, now); flipping = cur.letters.some((l) => now - l.flipAt < FLIP); if (!flipping) paint(tex[1], cur, now); }
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
      hovered = null;
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
