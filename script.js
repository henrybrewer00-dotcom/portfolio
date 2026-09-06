/* =========================================================================
   henry. — a neural network that learned to build things.
   One forward pass: every section is a layer of the network behind it and
   scrolling carries the signal from the input (who) to the output (hire).
   Copy and links live in SECTIONS.
   ========================================================================= */

const GH = "https://github.com/henrybrewer00-dotcom";
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");
const TOOLS = [["react", "React"], ["typescript", "TypeScript"], ["python", "Python"], ["electron", "Electron"], ["arduino", "Arduino"], ["twilio", "Twilio"], ["elevenlabs", "ElevenLabs"], ["claude", "Claude"], ["vercel", "Vercel"], ["github", "GitHub"]];

const SECTIONS = [
  { id: "hero", kind: "hero", label: "input" },
  { id: "about", kind: "about", label: "who", kicker: "x · the input vector", title: "I'm Henry.", body: "Fourteen, from Austin, and a proud vibecoder. I build voice AI, robots, a submarine, and a company. Founder of SiteLight.", features: [["age", "14"], ["city", "Austin, TX"], ["grades", "straight A's"], ["math", "99.5"], ["typing", "125 wpm"], ["role", "founder, SiteLight"]] },
  { id: "sitelight", kind: "work", n: "01", label: "SiteLight", kicker: "founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], image: { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" } },
  { id: "lily", kind: "work", n: "02", label: "Lily", kicker: "voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], transcript: true },
  { id: "wins", kind: "work", n: "03", label: "Wins", kicker: "hackathons", title: "Some hackathon wins", list: [["InsForge", "2026"], ["Frontier Tower", "2026"], ["a16z × Cursor", "2026"]] },
  { id: "glasscast", kind: "work", n: "04", label: "Glasscast", kicker: "open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], link: { href: GH + "/Glasscast", label: "Repo", arrow: "↗" } },
  { id: "drivethru", kind: "work", n: "05", label: "Drive-thru", kicker: "voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], link: { href: GH + "/voice-drive-thru", label: "Repo", arrow: "↗" } },
  { id: "elevenmile", kind: "work", n: "06", label: "Eleven Mile", kicker: "AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], link: { href: GH + "/eleven-mile", label: "Repo", arrow: "↗" } },
  { id: "pawbot", kind: "work", n: "07", label: "PawBot", kicker: "accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], link: { href: GH + "/PawBot", label: "Repo", arrow: "↗" } },
  { id: "siege", kind: "work", n: "08", label: "S.I.E.G.E.", kicker: "robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", kind: "work", n: "09", label: "Submarine", kicker: "hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", kind: "work", n: "10", label: "Open source", kicker: "merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], link: { href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests", label: "See the PRs", arrow: "↗" } },
  { id: "stack", kind: "stack", label: "stack", kicker: "embedding · made with", title: "The stack", body: "It cycles. Hover one to hold it." },
  { id: "receipts", kind: "receipts", label: "eval", kicker: "eval · receipts", title: "Receipts", stats: [["99.5", "in math"], ["125", "words a minute"], ["3", "hackathon wins"], ["3", "merged PRs"], ["10", "days to first revenue"], ["14", "years old"]] },
  { id: "contact", kind: "contact", label: "output", kicker: "y · the output layer", title: "Got an idea?", body: "Let's build it this weekend.", actions: [{ href: MAIL, label: "Email me", arrow: "→", primary: true }, { href: GH, label: "GitHub", arrow: "↗" }] },
];
const TRANSCRIPT = [
  ["Lily", "Good morning! It's Lily. How did you sleep?"],
  ["Grandma", "Oh, not too bad. It rained all night."],
  ["Lily", "It did! Have you had your coffee yet?"],
  ["Grandma", "I'm working on it."],
  ["Lily", "Perfect. Henry says hi, by the way."],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const fmtN = (n) => n.toLocaleString("en-US");
const isSmall = () => window.innerWidth <= 800;
const finePointer = matchMedia("(pointer: fine)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const N = SECTIONS.length;
const STACK_I = SECTIONS.findIndex((s) => s.kind === "stack");

let net = null, lenis = null, active = -1, tops = [], docH = 1, ready = false, lastY = 0;

/* ---------- render ---------- */
const icon = (slug) => { const L = window.LOGOS && window.LOGOS[slug]; return L ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${L.d}"/></svg>` : ""; };
const kicker = (t) => `<p class="kicker rv"><span class="dot"></span>${esc(t)}</p>`;
const R = {
  hero: () => `
    <div class="sec-in">
      ${kicker("input layer · 14 · austin, tx · proud vibecoder")}
      <h1 class="h-hero"><span class="ln"><span class="rv">I make way</span></span><span class="ln"><span class="rv"><em>too much</em> stuff.</span></span></h1>
      <p class="lede rv">A neural network that learned to build things. <b>Scroll</b> to run the forward pass.</p>
    </div>
    <p class="cue rv" aria-hidden="true">scroll<span class="cue-line"></span></p>`,
  about: (s) => `
    <div class="sec-in">
      ${kicker(s.kicker)}
      <h2 class="h-sec rv">${esc(s.title)}</h2>
      <p class="body rv">${esc(s.body)}</p>
      <dl class="vec">${s.features.map(([k, v], i) => `<div class="vec-row rv"><dt><i>x${i + 1}</i>${esc(k)}</dt><span class="fill"></span><dd>${esc(v)}</dd></div>`).join("")}</dl>
    </div>`,
  work: (s) => `
    <span class="num rv" aria-hidden="true">${s.n}</span>
    <div class="sec-in">
      ${kicker(`layer ${s.n} · ${s.kicker}`)}
      <h2 class="h-sec rv">${esc(s.title)}</h2>
      ${s.body ? `<p class="body rv">${esc(s.body)}</p>` : ""}
      ${s.tags ? `<ul class="tags rv">${s.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${s.image ? `<figure class="fig rv"><img src="${s.image.src}" alt="${esc(s.image.alt)}" loading="lazy" width="1200" height="720" /><figcaption>${esc(s.image.cap)}</figcaption></figure>` : ""}
      ${s.transcript ? `<div class="tr rv" data-tr><div class="tr-log" aria-live="polite"></div><p class="tr-note">sample call · not a recording</p></div>` : ""}
      ${s.list ? `<ol class="wins rv">${s.list.map(([w, y], i) => `<li><i>${pad(i + 1)}</i>${esc(w)}<span>${esc(y)}</span></li>`).join("")}</ol>` : ""}
      ${s.link ? `<a class="lnk rv" href="${s.link.href}" target="_blank" rel="noopener">${esc(s.link.label)} <span>${s.link.arrow}</span></a>` : ""}
    </div>`,
  stack: (s) => `
    <div class="sec-in">
      ${kicker(s.kicker)}
      <h2 class="h-sec rv">${esc(s.title)}</h2>
      <p class="body rv">${esc(s.body)}</p>
      <ul class="tools rv" data-tools>${TOOLS.map(([slug, label]) => `<li><button type="button" class="tool" data-tool="${slug}">${icon(slug)}${esc(label)}</button></li>`).join("")}</ul>
    </div>`,
  receipts: (s) => `
    <div class="sec-in">
      ${kicker(s.kicker)}
      <h2 class="h-sec rv">${esc(s.title)}</h2>
      <div class="stats">${s.stats.map(([v, l]) => `<div class="stat rv"><b data-count="${v}">0</b><span>${esc(l)}</span></div>`).join("")}</div>
    </div>`,
  contact: (s) => `
    <div class="sec-in">
      ${kicker(s.kicker)}
      <h2 class="h-out rv">${esc(s.title)}</h2>
      <p class="body rv">${esc(s.body)}</p>
      <div class="acts rv">${s.actions.map((a) => `<a class="btn${a.primary ? " is-primary" : ""}" href="${a.href}"${a.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""} data-magnet>${esc(a.label)} <span>${a.arrow}</span></a>`).join("")}</div>
      <footer class="foot rv">
        <span data-time>Austin, TX</span>
        <span>older sites: <a href="liquid/">liquid</a> · <a href="deck/">cards</a> · <a href="old/">terminal</a></span>
        <span>© 2026 henry. · three.js + gsap, no framework</span>
      </footer>
    </div>`,
};
function render() {
  $("[data-main]").innerHTML = SECTIONS.map((s, i) => {
    const side = s.kind === "work" && i % 2 ? " is-right" : "";
    return `<section class="sec sec-${s.kind}${side}" id="${s.id}" data-sec="${i}" aria-label="${esc(s.title || s.label)}">${R[s.kind](s, i)}</section>`;
  }).join("");
}

/* ---------- the network ---------- */
function initNet() {
  return new Promise((res) => {
    const go = () => {
      try {
        net = window.createNet($("[data-net]"), { layers: N, perLayer: isSmall() ? 60 : 96, k: isSmall() ? 2 : 3, maxDpr: isSmall() ? 2 : 1.5 });
        window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") net.setPointer(e.clientX, e.clientY); }, { passive: true });
        document.addEventListener("pointerleave", () => net.clearPointer());
        window.addEventListener("pointerdown", (e) => { if (!e.target.closest("a, button")) net.tap(e.clientX, e.clientY); }, { passive: true });
        net.onFire((i, source) => { if (source === "pointer") Sound.blip(SCALE[i % SCALE.length], 0.04); else if (source === "tap") Sound.blip(SCALE[i % SCALE.length] * 0.5, 0.05, 0.22); });
      } catch (e) { console.warn("the network could not start", e); }
      res();
    };
    if (window.createNet) go(); else window.addEventListener("net-ready", go, { once: true });
  });
}

/* ---------- sound (off until asked) ---------- */
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
const Sound = {
  on: false, ctx: null, last: 0,
  toggle() {
    this.on = !this.on;
    if (this.on && !this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
    if (this.on && this.ctx) this.ctx.resume();
    const b = $("[data-sound]"); b.setAttribute("aria-pressed", String(this.on)); b.textContent = "sound: " + (this.on ? "on" : "off");
    if (this.on) this.tick();
  },
  blip(freq, gain = 0.05, dur = 0.16) {
    if (!this.on || !this.ctx) return;
    const now = this.ctx.currentTime; if (now - this.last < 0.05) return; this.last = now;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(freq * 0.86, now + dur);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(gain, now + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(this.ctx.destination); o.start(now); o.stop(now + dur + 0.02);
  },
  tick() { this.blip(1320, 0.022, 0.07); },
};
function initSound() { $("[data-sound]").addEventListener("click", () => Sound.toggle()); }

/* ---------- scroll: the forward pass ---------- */
function measure() {
  const y = window.scrollY;
  tops = $$(".sec").map((s) => s.getBoundingClientRect().top + y);
  docH = document.documentElement.scrollHeight;
}
function onScroll(y) {
  if (!ready) return;
  const vh = window.innerHeight;
  let i = 0; for (let k = 0; k < tops.length; k++) if (y >= tops[k] - vh * 0.5) i = k;
  const next = i + 1 < tops.length ? tops[i + 1] : tops[i] + vh;
  const t = Math.min(1, Math.max(0, (y - tops[i]) / Math.max(1, next - tops[i])));
  const f = i + t;
  if (net) { net.setFocus(f); net.excite(Math.min(1, Math.abs(y - lastY) / vh) * 0.9); }
  lastY = y;
  $("[data-prog]").style.width = (Math.min(1, y / Math.max(1, docH - vh)) * 100).toFixed(2) + "%";
  document.body.classList.toggle("is-scrolled", y > 40);
  const idx = Math.max(0, Math.min(N - 1, Math.round(f)));
  if (idx !== active) activate(idx);
}
function activate(i) {
  active = i;
  const s = SECTIONS[i];
  $("[data-layer]").innerHTML = `layer <b>${pad(i + 1)}</b> / ${pad(N)} · <i>${esc(s.label)}</i>`;
  const group = s.kind === "work" ? "work" : s.kind === "stack" || s.kind === "receipts" ? "stack" : s.kind === "contact" ? "contact" : "";
  $$("[data-nav]").forEach((a) => a.classList.toggle("is-on", a.dataset.nav === group));
  if (net) net.wave(i);
  Sound.tick();
  if (i === STACK_I) startCycle(); else stopCycle();
}
function initScroll() {
  measure();
  window.addEventListener("resize", () => { measure(); onScroll(window.scrollY); });
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", (e) => { onScroll(e.scroll); if (window.ScrollTrigger) ScrollTrigger.update(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  } else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  onScroll(window.scrollY);
}

/* ---------- reveals ---------- */
function initReveals() {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.set($$(".rv"), { y: 28, opacity: 0 });
  $$(".sec").forEach((sec, i) => ScrollTrigger.create({ trigger: sec, start: "top 74%", once: true, onEnter: () => enter(sec, i) }));
}
function enter(sec) {
  const rvs = $$(".rv", sec);
  if (reduceMotion) gsap.set(rvs, { y: 0, opacity: 1 });
  else gsap.to(rvs, { y: 0, opacity: 1, duration: 1.0, ease: "power3.out", stagger: 0.07, overwrite: true });
  const tr = sec.querySelector("[data-tr]"); if (tr) setTimeout(() => typeTranscript(tr), 500);
  $$("[data-count]", sec).forEach((el, k) => setTimeout(() => countUp(el), 150 + k * 90));
}
function typeTranscript(host) {
  const log = host.querySelector(".tr-log"); let li = 0;
  const next = () => {
    if (li >= TRANSCRIPT.length) return;
    const [who, text] = TRANSCRIPT[li++];
    const line = document.createElement("div"); line.className = "tr-line" + (who === "Lily" ? " is-ai" : "");
    line.innerHTML = `<span class="tr-who">${esc(who)}</span><span><span class="tr-txt"></span><span class="tr-caret"></span></span>`;
    log.appendChild(line);
    const txt = line.querySelector(".tr-txt"), caret = line.querySelector(".tr-caret");
    if (reduceMotion) { txt.textContent = text; caret.remove(); next(); return; }
    let c = 0;
    const step = () => { txt.textContent = text.slice(0, ++c); if (c < text.length) setTimeout(step, 20 + Math.random() * 28); else { caret.remove(); setTimeout(next, 420); } };
    step();
  };
  next();
}
function countUp(el) {
  const raw = el.dataset.count, target = parseFloat(raw), dec = (raw.split(".")[1] || "").length;
  if (reduceMotion) { el.textContent = raw; return; }
  const t0 = performance.now(), dur = 1400;
  const f = (now) => { const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3); el.textContent = (target * e).toFixed(dec); if (t < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

/* ---------- the stack cycles ---------- */
let cycle = null, hot = -1, held = false, chips = [];
function setHot(i) {
  hot = i; chips.forEach((c, k) => c.classList.toggle("is-hot", k === i));
  if (net) net.burst(STACK_I, (i + 0.5) / chips.length, 0.5 + 0.28 * Math.sin(i * 1.7));
}
function startCycle() { if (cycle || !chips.length) return; setHot(hot < 0 ? 0 : hot); cycle = setInterval(() => { if (!held) setHot((hot + 1) % chips.length); }, 2200); }
function stopCycle() { clearInterval(cycle); cycle = null; }
function initTools() {
  chips = $$(".tool");
  chips.forEach((c, i) => {
    c.addEventListener("pointerenter", () => { held = true; setHot(i); });
    c.addEventListener("pointerleave", () => { held = false; });
    c.addEventListener("focus", () => setHot(i));
    c.addEventListener("click", () => { setHot(i); held = true; clearTimeout(c._t); c._t = setTimeout(() => { held = false; }, 2600); });
  });
}

/* ---------- chrome ---------- */
function initNav() {
  $$("[data-nav], .brand").forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href"); if (!id || !id.startsWith("#")) return;
    const el = $(id); if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) }); else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }));
}
function initCursor() {
  if (!finePointer) return;
  document.documentElement.classList.add("has-cursor");
  const cur = $("[data-cur]");
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => { cx += (x - cx) * 0.38; cy += (y - cy) * 0.38; cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; requestAnimationFrame(loop); };
  loop();
  document.addEventListener("pointerover", (e) => cur.classList.toggle("is-link", !!(e.target.closest && e.target.closest("a, button"))));
  window.addEventListener("pointerdown", () => cur.classList.add("is-down"));
  window.addEventListener("pointerup", () => cur.classList.remove("is-down"));
}
function initMagnet() {
  if (!finePointer || !window.gsap || reduceMotion) return;
  $$("[data-magnet]").forEach((el) => {
    const move = (e) => { const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); gsap.to(el, { x: dx * 0.22, y: dy * 0.22, duration: 0.5, ease: "power3.out" }); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" }));
  });
}
function initTime() {
  const el = $("[data-time]"); if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" });
  const tick = () => { el.textContent = "Austin, TX · " + fmt.format(new Date()).toLowerCase() + " ct"; };
  tick(); setInterval(tick, 15000);
}
function initStats() {
  const el = $("[data-stats]"); if (!el || !net) return;
  const tick = () => { const s = net.stats(); el.textContent = `${fmtN(s.nodes)} nodes · ${fmtN(s.edges)} edges · ${pad(s.pulses)} signals · ${s.fps} fps`; };
  tick(); setInterval(tick, 500);
}

/* ---------- loading weights ---------- */
function runPreloader() {
  const pre = $("[data-pre]"), n = $("[data-pre-n]"), dots = $$("i", $("[data-pre-dots]"));
  const t0 = performance.now(), dur = reduceMotion ? 200 : 1000;
  return new Promise((res) => {
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 2);
      n.textContent = String(Math.round(e * 100)).padStart(3, "0") + "%";
      dots.forEach((d, i) => d.classList.toggle("is-on", i < Math.round(e * dots.length)));
      if (p < 1) requestAnimationFrame(tick); else res();
    };
    tick();
  });
}

/* ---------- boot ---------- */
async function boot() {
  document.documentElement.classList.add("js");
  render(); initTools(); initCursor(); initNav(); initTime(); initSound();
  if (window.gsap) gsap.set($$(".rv"), { y: 28, opacity: 0 });
  const preDone = runPreloader();
  await initNet();
  await Promise.all([document.fonts ? document.fonts.ready.catch(() => {}) : null, preDone]);
  $("[data-pre]").classList.add("is-done"); document.body.classList.add("is-ready");
  setTimeout(() => { const p = $("[data-pre]"); if (p) p.remove(); }, 1000);
  ready = true;
  initScroll(); initReveals(); initMagnet(); initStats();
}
boot();
