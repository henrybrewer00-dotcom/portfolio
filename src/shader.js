/* =========================================================================
   henry. — the engraving ("money shader"). Wavy banknote lines whose
   thickness carries the shading. The source is a word drawn to an offscreen
   canvas ("henry." at home, the card's name after an answer); the lines
   swell where the word is, so it reads as engraved. Raw WebGL2, no library.
   ========================================================================= */

const VERT = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uA, uB;
uniform float uMix, uHotA, uHotB, uTime, uTilt, uDpr;
uniform vec2 uRes;
uniform vec3 uBg, uBgDeep, uInk, uGold;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }

// one family of guilloche lines; returns ink coverage 0..1
float lines(vec2 p, float ang, float spacing, float warp, float width) {
  vec2 dir = vec2(-sin(ang), cos(ang)), along = vec2(cos(ang), sin(ang));
  float v = dot(p, dir) / spacing + sin(dot(p, along) * 0.011 + uTime * 0.12) * 1.4 + warp;
  float d = min(fract(v), 1.0 - fract(v)) * 2.0;   // 0 on a line, 1 between
  float aa = fwidth(v) * 2.4;
  return 1.0 - smoothstep(width - aa, width + aa, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 tuv = vec2(uv.x, 1.0 - uv.y);
  vec2 src = mix(texture(uA, tuv).rg, texture(uB, tuv).rg, uMix);
  float hot = mix(uHotA, uHotB, uMix);
  float sharp = src.r, glow = src.g;
  vec2 p = gl_FragCoord.xy / uDpr;                 // css pixels, so line spacing is the same on every screen

  vec2 q = p * 0.0021;
  float n = fbm(q + vec2(uTime * 0.018, -uTime * 0.013));
  float n2 = fbm(q * 2.2 + vec2(-uTime * 0.025, uTime * 0.01) + n);

  // tone: how much ink this spot wants. The word is darkest, its halo next, the drifting field faintest.
  float tone = clamp(smoothstep(0.38, 0.9, n2) * 0.32 + glow * 0.4 + sharp * 0.7, 0.0, 1.0);
  float width = mix(0.08, 0.66, tone);
  float warp = n2 * 2.6 + sharp * 0.5;           // lines kink where they cross a letter edge, like an emboss
  float ink = lines(p, 0.38 + uTilt, 6.5, warp, width);
  ink = max(ink, lines(p, 1.2 + uTilt, 6.5, warp * 0.5, 0.18) * smoothstep(0.5, 0.9, glow) * (1.0 - sharp));   // light cross-hatch in the halo only

  float word = clamp(sharp + glow * 0.5, 0.0, 1.0);
  vec3 inkCol = mix(uInk, uGold, hot * smoothstep(0.15, 0.55, word));
  float alpha = 0.16 + mix(0.66, 0.34, hot) * word;   // behind the cards the word steps back

  float vig = smoothstep(1.2, 0.3, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
  vec3 bg = mix(uBgDeep, uBg, vig);
  alpha *= mix(0.35, 1.0, max(vig, word));

  vec3 col = mix(bg, inkCol, ink * alpha);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.025;   // film grain
  o = vec4(col, 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ show(text: string, hot: boolean): void, tilt(v: number): void } | null} null when WebGL2 is missing
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
  for (const n of ["uA", "uB", "uMix", "uHotA", "uHotB", "uTime", "uTilt", "uDpr", "uRes", "uBg", "uBgDeep", "uInk", "uGold"]) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform3fv(U.uBg, hex("#0d1024"));
  gl.uniform3fv(U.uBgDeep, hex("#06070f"));
  gl.uniform3fv(U.uInk, hex("#ecebe6"));
  gl.uniform3fv(U.uGold, hex("#f6d55c"));
  gl.uniform1i(U.uA, 0);
  gl.uniform1i(U.uB, 1);

  const tex = [gl.createTexture(), gl.createTexture()];
  for (const t of tex) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // the word, drawn twice: R = crisp letters, G = a soft halo around them
  const sharpC = document.createElement("canvas"), glowC = document.createElement("canvas");
  const ctx2d = (c) => c.getContext("2d", { willReadFrequently: true });
  function paint(target, text, hot) {
    const w = Math.max(64, Math.round(innerWidth / 2)), h = Math.max(64, Math.round(innerHeight / 2));
    for (const c of [sharpC, glowC]) { c.width = w; c.height = h; }
    const small = innerWidth < 700;
    let size = Math.min(h * (small ? 0.3 : 0.42), w * 0.9);
    const draw = (c, blur) => {
      const x = ctx2d(c);
      x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
      x.font = `400 ${size}px "Instrument Serif", Georgia, serif`;
      const m = x.measureText(text).width;
      if (m > w * 0.88) { size *= (w * 0.88) / m; x.font = `400 ${size}px "Instrument Serif", Georgia, serif`; }
      x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff";
      if (blur) { x.shadowColor = "#fff"; x.shadowBlur = size * 0.22; }
      // home: above the bar. Behind results: lower, under the cards
      x.fillText(text, w / 2, h * (hot ? 0.6 : small ? 0.3 : 0.36));
    };
    draw(sharpC, false); draw(glowC, true);
    const a = ctx2d(sharpC).getImageData(0, 0, w, h).data, b = ctx2d(glowC).getImageData(0, 0, w, h).data;
    const px = new Uint8Array(w * h * 4);
    for (let i = 0; i < px.length; i += 4) { px[i] = a[i]; px[i + 1] = b[i]; px[i + 3] = 255; }
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  }

  let cur = { text: "henry.", hot: 0 }, prev = cur, mixStart = -1e9, tiltTarget = 0, tiltNow = 0, dpr = 1;
  const FADE = 900;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    paint(tex[0], prev.text, prev.hot); paint(tex[1], cur.text, cur.hot);
    if (reduceMotion) frame(performance.now());
  }

  function frame(now) {
    const k = Math.min(1, (now - mixStart) / FADE), e = k * k * (3 - 2 * k);
    tiltNow += (tiltTarget - tiltNow) * 0.06;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[1]);
    gl.uniform1f(U.uMix, e);
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
    /** Cross-fade the engraving to a new word; `hot` turns its lines gold. */
    show(text, hot) {
      if (text === cur.text) return;
      prev = cur; cur = { text, hot: hot ? 1 : 0 };
      [tex[0], tex[1]] = [tex[1], tex[0]];
      paint(tex[1], text, hot);
      mixStart = reduceMotion ? -1e9 : performance.now();
      if (reduceMotion) frame(performance.now());
    },
    /** Typing nudges the line angle a little. */
    tilt(v) { tiltTarget = v; },
  };
}
