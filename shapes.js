/* =========================================================================
   Ink drawings the swarm can become. Each draws black shapes on a square
   canvas of size s; sampleDrawing() turns any of them into points.
   window.SHAPES2D, window.sampleDrawing
   ========================================================================= */
(function () {
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
  const stroke = (ctx, w) => { ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); };

  const SHAPES2D = {
    eye(ctx, s) { // SiteLight — is anyone looking?
      ctx.beginPath(); ctx.moveTo(0.06 * s, 0.5 * s);
      ctx.bezierCurveTo(0.3 * s, 0.12 * s, 0.7 * s, 0.12 * s, 0.94 * s, 0.5 * s);
      ctx.bezierCurveTo(0.7 * s, 0.88 * s, 0.3 * s, 0.88 * s, 0.06 * s, 0.5 * s);
      ctx.closePath(); stroke(ctx, 0.055 * s);
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.17 * s, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0.5 * s + Math.cos(a) * 0.25 * s, 0.5 * s + Math.sin(a) * 0.25 * s); ctx.lineTo(0.5 * s + Math.cos(a) * 0.31 * s, 0.5 * s + Math.sin(a) * 0.31 * s); stroke(ctx, 0.035 * s); }
    },
    wave(ctx, s) { // Lily — a voice
      const bars = 26;
      for (let i = 0; i < bars; i++) {
        const t = i / (bars - 1);
        const env = 0.1 + 0.9 * Math.abs(Math.sin(t * 9.4) * Math.sin(t * 2.3 + 0.7)) * (1 - Math.abs(t - 0.5) * 0.7);
        const h = env * 0.74 * s, x = 0.06 * s + t * 0.88 * s;
        rr(ctx, x - 0.014 * s, 0.5 * s - h / 2, 0.028 * s, h, 0.014 * s);
      }
    },
    rec(ctx, s) { // Glasscast — record
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.38 * s, 0, Math.PI * 2); stroke(ctx, 0.05 * s);
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.21 * s, 0, Math.PI * 2); ctx.fill();
    },
    burger(ctx, s) { // Drive-thru
      ctx.beginPath(); ctx.moveTo(0.14 * s, 0.4 * s); ctx.bezierCurveTo(0.14 * s, 0.14 * s, 0.86 * s, 0.14 * s, 0.86 * s, 0.4 * s); ctx.closePath(); ctx.fill();
      rr(ctx, 0.12 * s, 0.45 * s, 0.76 * s, 0.09 * s, 0.04 * s);
      rr(ctx, 0.16 * s, 0.58 * s, 0.68 * s, 0.1 * s, 0.03 * s);
      rr(ctx, 0.14 * s, 0.72 * s, 0.72 * s, 0.14 * s, 0.06 * s);
    },
    mic(ctx, s) { // Eleven Mile
      rr(ctx, 0.38 * s, 0.08 * s, 0.24 * s, 0.46 * s, 0.12 * s);
      ctx.beginPath(); ctx.arc(0.5 * s, 0.46 * s, 0.25 * s, 0, Math.PI); stroke(ctx, 0.05 * s);
      ctx.beginPath(); ctx.moveTo(0.5 * s, 0.71 * s); ctx.lineTo(0.5 * s, 0.86 * s); ctx.moveTo(0.34 * s, 0.87 * s); ctx.lineTo(0.66 * s, 0.87 * s); stroke(ctx, 0.05 * s);
    },
    paw(ctx, s) { // PawBot
      const toe = (x, y) => { ctx.beginPath(); ctx.ellipse(x * s, y * s, 0.085 * s, 0.11 * s, 0, 0, Math.PI * 2); ctx.fill(); };
      toe(0.3, 0.3); toe(0.5, 0.22); toe(0.7, 0.3); toe(0.18, 0.5); toe(0.82, 0.5);
      ctx.beginPath(); ctx.ellipse(0.5 * s, 0.64 * s, 0.24 * s, 0.2 * s, 0, 0, Math.PI * 2); ctx.fill();
    },
    git(ctx, s) { // Open source — a merge
      ctx.beginPath(); ctx.moveTo(0.3 * s, 0.22 * s); ctx.lineTo(0.3 * s, 0.78 * s); stroke(ctx, 0.05 * s);
      ctx.beginPath(); ctx.moveTo(0.7 * s, 0.3 * s); ctx.bezierCurveTo(0.7 * s, 0.52 * s, 0.32 * s, 0.44 * s, 0.3 * s, 0.7 * s); stroke(ctx, 0.05 * s);
      for (const [x, y] of [[0.3, 0.2], [0.3, 0.8], [0.7, 0.28]]) { ctx.beginPath(); ctx.arc(x * s, y * s, 0.075 * s, 0, Math.PI * 2); ctx.fill(); }
    },
    play(ctx, s) { // the on-stage video — an outlined play button
      ctx.beginPath(); ctx.arc(0.5 * s, 0.5 * s, 0.4 * s, 0, Math.PI * 2); stroke(ctx, 0.045 * s);
      ctx.beginPath(); ctx.moveTo(0.42 * s, 0.32 * s); ctx.lineTo(0.66 * s, 0.5 * s); ctx.lineTo(0.42 * s, 0.68 * s); ctx.closePath(); stroke(ctx, 0.045 * s);
    },
    pressme(ctx, s) { // ...and after five seconds, a nudge
      ctx.font = `bold ${0.26 * s}px Geist, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("PRESS", 0.5 * s, 0.22 * s);
      ctx.fillText("ME", 0.5 * s, 0.48 * s);
      ctx.beginPath(); ctx.moveTo(0.5 * s, 0.64 * s); ctx.lineTo(0.5 * s, 0.9 * s); stroke(ctx, 0.055 * s);
      ctx.beginPath(); ctx.moveTo(0.36 * s, 0.77 * s); ctx.lineTo(0.5 * s, 0.9 * s); ctx.lineTo(0.64 * s, 0.77 * s); stroke(ctx, 0.055 * s);
    },
  };

  const off = document.createElement("canvas");
  const octx = off.getContext("2d", { willReadFrequently: true });
  /* returns count points in [-1,1]² (y up), sampled from wherever the drawing put ink */
  function sampleDrawing(drawFn, count, res = 320) {
    off.width = off.height = res;
    octx.clearRect(0, 0, res, res);
    octx.fillStyle = "#000"; octx.strokeStyle = "#000";
    drawFn(octx, res);
    const img = octx.getImageData(0, 0, res, res).data;
    const pts = [];
    for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) if (img[(y * res + x) * 4 + 3] > 100) pts.push(x, y);
    const n = pts.length / 2;
    const out = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const j = n ? Math.floor(Math.random() * n) : 0;
      out[i * 2] = ((pts[j * 2] ?? res / 2) + Math.random() - 0.5) / res * 2 - 1;
      out[i * 2 + 1] = -(((pts[j * 2 + 1] ?? res / 2) + Math.random() - 0.5) / res * 2 - 1);
    }
    return out;
  }

  window.SHAPES2D = SHAPES2D;
  window.sampleDrawing = sampleDrawing;
})();
