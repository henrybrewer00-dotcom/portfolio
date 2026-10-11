/* =========================================================================
   henry. — the engraving ("money shader"). Wavy banknote lines whose
   thickness carries the shading, ink on paper. The source is a word drawn to an offscreen
   canvas ("henry." at home, the card's name after an answer); the lines
   swell where the word is, so it reads as engraved. Raw WebGL2, no library.
   ========================================================================= */

const VERT = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uA, uB;
uniform float uMix, uHotA, uHotB, uTime, uTilt, uDpr, uPulse;
uniform vec2 uRes, uPulseAt, uMouse, uDrift;
uniform float uHover;
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
  float d = abs(fract(v) - 0.5) * 2.0;              // 0 mid-gap, 1 on the line centre
  float aa = fwidth(v) * 1.6;
  return smoothstep(1.0 - width - aa, 1.0 - width + aa, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 tuv = vec2(uv.x, 1.0 - uv.y) - uDrift * vec2(1.0, -1.0);
  vec2 p = gl_FragCoord.xy / uDpr;                 // css pixels, so line spacing is the same on every screen

  // the new word inks in with a ragged left-to-right sweep, like a plate being pulled
  float rag = vnoise(vec2(p.y * 0.02, 3.0)) * 0.18;
  float front = uMix * 1.5 - 0.25;
  float m = uMix >= 1.0 ? 1.0 : 1.0 - smoothstep(front - 0.08, front + 0.08, uv.x + rag);
  vec2 src = mix(texture(uA, tuv).rg, texture(uB, tuv).rg, m);
  float hot = mix(uHotA, uHotB, m);
  float sharp = src.r, glow = src.g;

  // Enter: one ring of displacement rolls out from the bar
  float pr = length(p - uPulseAt);
  float ring = exp(-pow((pr - uPulse * 1400.0) / 70.0, 2.0)) * (1.0 - uPulse);

  // the cursor: lines swell up and bow around it like a lens pressed into the plate
  vec2 dm = p - uMouse;
  float lens = exp(-dot(dm, dm) / (190.0 * 190.0)) * uHover;

  float n = fbm(p * 0.0024 + vec2(uTime * 0.03, -uTime * 0.02));
  // the relief: lines bow over the letters (glow is a soft height map), so the word reads as raised metal
  float relief = glow * 2.2 + sharp * 0.35;
  float wave = sin(p.x * 0.006 + uTime * 0.25) * 1.2 + sin(p.x * 0.0021 - uTime * 0.11) * 2.0;
  float v = (p.y + p.x * (0.08 + uTilt)) / 5.0 + wave + n * 1.6 + relief + ring * 1.4 + lens * 1.6;

  // tone: letters solid, their shoulder mid, the paper field hairline
  float field = 0.06 + 0.04 * n;
  float tone = clamp(field + lens * 0.12 + glow * 0.26 + sharp * mix(0.62, 0.3, hot), 0.0, 0.92);
  float ink = engrave(v, tone);

  // a second, finer hatch only in the letter cores, at an angle: the "money" cross-hatch
  float v2 = (p.x - p.y * 0.55) / 3.4 + relief * 0.6;
  ink = max(ink, engrave(v2, 0.32) * smoothstep(0.55, 0.95, sharp) * (1.0 - hot));

  // fade the field toward the edges so the word sits in a pool of lines
  float vig = smoothstep(1.15, 0.25, length((uv - vec2(0.5, 0.55)) * vec2(uRes.x / uRes.y, 1.0)));
  ink *= mix(0.25, 1.0, max(vig, sharp));

  float word = smoothstep(0.1, 0.6, sharp + glow * 0.3);
  float strength = mix(0.88, 0.55, hot * (1.0 - word));      // behind the cards the field steps back

  vec3 paper = mix(uPaperDeep, uPaper, smoothstep(1.4, 0.2, length(uv - 0.5)));
  paper -= (vnoise(p * 0.9) - 0.5) * 0.02;                   // paper tooth
  // pink is a fill, never a line: the answer's letters sit in soft pink with black engraving over it
  paper = mix(paper, uPink, hot * smoothstep(0.35, 0.8, sharp) + ring * 0.55 + lens * 0.18);
  vec3 col = mix(paper, uInk, ink * strength);
  o = vec4(col, 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ show(text: string, hot: boolean): void, pulse(x: number, y: number): void, tilt(v: number): void } | null} null when WebGL2 is missing
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
  for (const n of ["uA", "uB", "uMix", "uHotA", "uHotB", "uTime", "uTilt", "uDpr", "uRes", "uPaper", "uPaperDeep", "uInk", "uPink", "uPulse", "uPulseAt", "uMouse", "uDrift", "uHover"]) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform3fv(U.uPaper, hex("#efede8"));
  gl.uniform3fv(U.uPaperDeep, hex("#e4e2da"));
  gl.uniform3fv(U.uInk, hex("#141412"));
  gl.uniform3fv(U.uPink, hex("#f2a9b8"));
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

  // The word lives in one 2D canvas: R = crisp letters, G = a soft halo. Each letter is its own little
  // body on a spring, so the cursor can shove letters around and they wobble back into place.
  const mask = document.createElement("canvas");
  const mx = mask.getContext("2d");
  const font = (size) => `400 ${size}px "Instrument Serif", Georgia, serif`;
  let W = 64, H = 64;

  function layout(text, hot) {
    const small = innerWidth < 700;
    let size = Math.min(H * (small ? 0.3 : 0.42), W * 0.9);
    mx.font = font(size);
    let m = mx.measureText(text).width;
    if (m > W * 0.88) { size *= (W * 0.88) / m; mx.font = font(size); m = mx.measureText(text).width; }
    const y = H * (hot ? 0.8 : small ? 0.3 : 0.36), x0 = W / 2 - m / 2;   // home: above the bar; results: under the cards
    const letters = [...text].map((ch, i) => {
      const before = mx.measureText(text.slice(0, i)).width, w = mx.measureText(ch).width;
      return { ch, w, rx: x0 + before + w / 2, ry: y, ox: 0, oy: 0, vx: 0, vy: 0, a: 0, va: 0 };
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
        mx.save(); mx.translate(l.rx + l.ox, l.ry + l.oy); mx.rotate(l.a); mx.fillText(l.ch, 0, 0); mx.restore();
      }
    };
    pass("#00ff00", word.size * 0.3);
    pass("#ff0000", 0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  }

  // one physics step for the live word. Mouse is in mask pixels, mv its velocity per frame.
  function step(word, mxp, myp, mvx, mvy, near) {
    let moving = false;
    const R = word.size * 0.55;
    for (const l of word.letters) {
      const cx = l.rx + l.ox, cy = l.ry + l.oy, dx = cx - mxp, dy = cy - myp, d = Math.hypot(dx, dy) || 1;
      if (near && d < R) {
        const f = 1 - d / R, cap = Math.min(1, 22 / (Math.hypot(mvx, mvy) || 1));
        mvx *= cap; mvy *= cap;
        // a shove: away from the cursor, plus some of the cursor's own momentum
        l.vx += (dx / d) * f * 1.3 + mvx * f * 0.22;
        l.vy += (dy / d) * f * 1.3 + mvy * f * 0.22;
        l.va += ((dx * mvy - dy * mvx) / (R * 110)) * f;   // glancing hits spin it
      }
      // springs back home, a little underdamped so it wobbles
      l.vx = (l.vx - l.ox * 0.085) * 0.85; l.vy = (l.vy - l.oy * 0.085) * 0.85;
      l.va = (l.va - l.a * 0.09) * 0.83;
      const lim = word.size * 0.45;
      l.ox = Math.max(-lim, Math.min(lim, l.ox + l.vx)); l.oy = Math.max(-lim, Math.min(lim, l.oy + l.vy));
      l.a = Math.max(-0.45, Math.min(0.45, l.a + l.va));
      if (Math.abs(l.ox) + Math.abs(l.oy) + Math.abs(l.a) * 50 + Math.abs(l.vx) + Math.abs(l.vy) > 0.03) moving = true;
      else { l.ox = l.oy = l.vx = l.vy = l.a = l.va = 0; }
    }
    return moving;
  }

  let cur = layout("henry.", 0), prev = cur;
  let mixStart = -1e9, tiltTarget = 0, tiltNow = 0, dpr = 1;
  const FADE = 1100, PULSE = 1300;
  let pulseStart = -1e9, pulseAt = [0, 0];
  // the cursor, eased: where it is, how much it's pressing, and a small parallax drift of the word
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2, hover: 0, target: 0, last: 0, inside: false };
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const speed = Math.hypot(e.clientX - mouse.tx, e.clientY - mouse.ty);
    mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.inside = true;
    mouse.target = Math.min(1.6, 0.7 + speed * 0.02); mouse.last = performance.now();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mouse.target = 0; mouse.inside = false; });

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = mask.width = Math.max(64, Math.round(innerWidth / 2)); H = mask.height = Math.max(64, Math.round(innerHeight / 2));
    const same = prev === cur;
    prev = layout(prev.text, prev.hot); cur = same ? prev : layout(cur.text, cur.hot);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    paint(tex[0], prev); paint(tex[1], cur);
    if (reduceMotion) frame(performance.now());
  }

  function frame(now) {
    const k = Math.min(1, (now - mixStart) / FADE), e = k * k * (3 - 2 * k);
    tiltNow += (tiltTarget - tiltNow) * 0.06;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[1]);
    gl.uniform1f(U.uMix, k >= 1 ? 1 : e);
    const pk = (now - pulseStart) / PULSE;
    gl.uniform1f(U.uPulse, pk >= 0 && pk < 1 ? pk : 1);
    gl.uniform2f(U.uPulseAt, pulseAt[0], pulseAt[1]);
    // physics: the cursor shoves the live word's letters (in mask pixels, half of css pixels)
    if (!reduceMotion && (cur.awake || mouse.inside)) {
      const mvx = (mouse.tx - mouse.px) / 2, mvy = (mouse.ty - mouse.py) / 2;
      cur.awake = step(cur, mouse.tx / 2, mouse.ty / 2, mvx, mvy, mouse.inside);
      if (cur.awake) paint(tex[1], cur);
    }
    mouse.px = mouse.tx; mouse.py = mouse.ty;
    if (now - mouse.last > 900) mouse.target = Math.min(mouse.target, 0.6);   // resting cursor: a gentle dent
    mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.hover += (mouse.target - mouse.hover) * 0.08;
    gl.uniform2f(U.uMouse, mouse.x, innerHeight - mouse.y);
    gl.uniform1f(U.uHover, reduceMotion ? 0 : mouse.hover);
    gl.uniform2f(U.uDrift, 0, 0);
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
      [tex[0], tex[1]] = [tex[1], tex[0]];
      paint(tex[1], cur);
      mixStart = reduceMotion ? -1e9 : performance.now();
      if (reduceMotion) frame(performance.now());
    },
    /** Enter: a ring rolls through the lines from (x, y), in css pixels from the top left. */
    pulse(x, y) {
      if (reduceMotion) return;
      pulseAt = [x, innerHeight - y]; pulseStart = performance.now();
      // the blast knocks the letters too: each one jumps away from the bar and tumbles back
      for (const l of cur.letters) {
        const dx = l.rx - x / 2, dy = l.ry - y / 2, d = Math.hypot(dx, dy) || 1;
        l.vx += (dx / d) * 5; l.vy += (dy / d) * 5 - 2.5; l.va += (Math.random() - 0.5) * 0.06;
      }
      cur.awake = true;
    },
    /** Typing nudges the line angle a little. */
    tilt(v) { tiltTarget = v; },
  };
}
