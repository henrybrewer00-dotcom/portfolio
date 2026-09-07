/* =========================================================================
   henry. — scenes. The page is one screen: a block of marble in a hall.
   Scrolling carves it into the next thing, exactly as far as you've scrolled.
   Copy and links live in SCENES.
   ========================================================================= */

const GH = "https://github.com/henrybrewer00-dotcom";
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");
const TOOLS = ["react", "typescript", "python", "electron", "arduino", "twilio", "elevenlabs", "claude", "vercel", "github"];

/* len = how many screens of scrolling this scene takes */
const SCENES = [
  { id: "b0", shape: "block", word: "a block of marble", len: 1.1 },
  { id: "b1", shape: "text:henry.", word: "that's me", len: 1.2 },
  { id: "b2", shape: "text:14", word: "years old", len: 1.2 },
  { id: "b3", shape: "text:austin, tx", word: "from", len: 1.2 },
  { id: "b4", shape: "text:proud\nvibecoder", word: "and a", len: 1.3 },
  { id: "hero", shape: "text:I make way\ntoo much\nstuff.", hint: true, label: "I", len: 1.3 },
  { id: "me", shape: "bust", label: "II", kicker: "No. 01 · the maker", title: "I'm Henry.", body: "Fourteen, from Austin, and a proud vibecoder. I build voice AI, robots, a submarine, and a company. Founder of SiteLight. Straight A's, 99.5 in math, 125 words a minute." },
  { id: "sitelight", shape: "draw:eye", label: "III", kicker: "No. 02 · founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], image: { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" } },
  { id: "lily", shape: "wave", label: "IV", kicker: "No. 03 · voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], transcript: true },
  { id: "wins", shape: "draw:trophy", label: "V", kicker: "No. 04 · hackathons", title: "Some hackathon wins", list: ["InsForge", "Frontier Tower", "a16z × Cursor"] },
  { id: "glasscast", shape: "draw:rec", label: "VI", kicker: "No. 05 · open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], action: { href: GH + "/Glasscast", label: "Repo ↗" } },
  { id: "drivethru", shape: "draw:burger", label: "VII", kicker: "No. 06 · voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], action: { href: GH + "/voice-drive-thru", label: "Repo ↗" } },
  { id: "elevenmile", shape: "draw:mic", label: "VIII", kicker: "No. 07 · AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], action: { href: GH + "/eleven-mile", label: "Repo ↗" } },
  { id: "pawbot", shape: "draw:paw", label: "IX", kicker: "No. 08 · accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], action: { href: GH + "/PawBot", label: "Repo ↗" } },
  { id: "siege", shape: "car", label: "X", kicker: "No. 09 · robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", shape: "sub", label: "XI", kicker: "No. 10 · hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", shape: "draw:git", label: "XII", kicker: "No. 11 · merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], action: { href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests", label: "See the PRs ↗" } },
  { id: "stack", shape: "keycaps", label: "XIII", kicker: "made with", title: "The stack", body: "It cycles. Hover one to hold it.", tools: TOOLS },
  { id: "receipts", shape: "text:99.5", label: "XIV", kicker: "also", title: "Receipts", body: "Hackathon wins at InsForge, Frontier Tower and a16z × Cursor. Straight A's, 99.5 in math. Merged PRs in SymPy, Biome and Astro. 125 words a minute." },
  { id: "hire", shape: "text:hire me", label: "XV", kicker: "the end", title: "Got an idea?", body: "Let's build it this weekend.", actions: [{ href: MAIL, label: "Email me →" }, { href: GH, label: "GitHub ↗" }, { href: "deck/", label: "Older site: card deck", soft: true }, { href: "old/", label: "Older site: terminal", soft: true }] },
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
const isSmall = () => window.innerWidth <= 800;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const N = SCENES.length;
const STARTS = SCENES.reduce((acc, s, i) => { acc.push(i ? acc[i - 1] + (SCENES[i - 1].len || 1) : 0); return acc; }, []);
const LAST = STARTS[N - 1];

let marble = null, lenis = null, ready = false, active = -1;

/* ---------- placards + rail ---------- */
function renderCaptions() {
  const host = $("[data-caps]");
  host.innerHTML = SCENES.map((s, i) => {
    if (s.word) return `<div class="cap is-word" data-cap="${i}">${esc(s.word)}</div>`;
    if (!s.title) return "";
    const acts = [].concat(s.action || [], s.actions || []);
    const actHtml = acts.length ? `<div class="acts">${acts.map((a) => `<a class="act${a.soft ? " is-soft" : ""}" href="${esc(a.href)}"${a.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${esc(a.label)}</a>`).join("")}</div>` : "";
    const tr = s.transcript ? `<div class="tr" data-transcript>${TRANSCRIPT.map(([who, line]) => `<div class="tr-line${who === "Lily" ? " is-lily" : ""}"><span class="tr-who">${esc(who)}</span><span class="tr-text" data-text="${esc(line)}"></span></div>`).join("")}<p class="tr-note">sample call · not a recording</p></div>` : "";
    const list = s.list ? `<ul class="list">${s.list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    const img = s.image ? `<figure class="fig"><img src="${esc(s.image.src)}" alt="${esc(s.image.alt)}" loading="lazy" /><figcaption>${esc(s.image.cap)}</figcaption></figure>` : "";
    const tools = s.tools ? `<div class="tools" data-tools>${s.tools.map((t) => `<button type="button" data-tool="${esc(t)}">${esc((window.LOGOS && window.LOGOS[t] && window.LOGOS[t].label) || t)}</button>`).join("")}</div>` : "";
    return `<div class="cap" data-cap="${i}">
      <p class="kicker">${esc(s.kicker || "")}</p>
      <h2>${esc(s.title)}</h2>
      ${s.body ? `<p>${esc(s.body)}</p>` : ""}
      ${s.tags ? `<p class="tags">${s.tags.map(esc).join(" · ")}</p>` : ""}
      ${list}${img}${tr}${tools}${actHtml}
    </div>`;
  }).join("");
  const rail = $("[data-rail]");
  rail.innerHTML = SCENES.map((s, i) => s.label ? `<button type="button" data-go="${i}" aria-label="${esc(s.title || s.label)}"><span>${esc(s.label)}</span><i></i></button>` : "").join("");
  rail.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) goTo(+b.dataset.go); });
}

/* ---------- scroll ---------- */
function sceneY(i) { return STARTS[i] * window.innerHeight; }
function goTo(i) { const y = sceneY(i); if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: "smooth" }); }
function layoutFor(s) {
  const hw = marble.halfH * marble.aspect, hh = marble.halfH;
  const hasCap = !!(s && s.title);
  if (isSmall()) {
    if (!hasCap) return s && s.hint ? { x: 0, y: 0.5, fill: 0.36, fillX: 0.86 } : { x: 0, y: 0.1, fill: 0.42, fillX: 0.86 };
    if (s.image) return { x: 0, y: hh * 0.72, fill: 0.22, fillX: 0.55 };
    return { x: 0, y: hh * (s.transcript || s.tools ? 0.62 : 0.5), fill: s.transcript || s.tools ? 0.26 : 0.36, fillX: 0.86 };
  }
  if (!hasCap) return s && s.hint ? { x: 0, y: 0.45, fill: 0.5, fillX: 0.78 } : { x: 0, y: 0.15, fill: 0.62, fillX: 0.8 };
  return { x: hw * 0.3, y: hh * 0.12, fill: 0.6, fillX: 0.5 };
}
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function update(y) {
  if (!marble || !ready) return;
  const u = Math.max(0, Math.min(LAST, y / window.innerHeight));
  let i = 0;
  for (let k = 0; k < N - 1; k++) if (u >= STARTS[k]) i = k;
  const len = SCENES[i].len || 1;
  const t = i >= N - 1 ? 0 : Math.max(0, Math.min(1, (u - STARTS[i]) / len));
  const j = Math.min(N - 1, i + 1);
  marble.setBlend(SCENES[i].shape, SCENES[j].shape, t);
  const A = layoutFor(SCENES[i]), B = layoutFor(SCENES[j]), e = smooth(t);
  marble.setFit({ fill: lerp(A.fill, B.fill, e), fillX: lerp(A.fillX, B.fillX, e) });
  marble.setOffset(lerp(A.x, B.x, e), lerp(A.y, B.y, e));
  activate(t < 0.5 ? i : j);
}

function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  const track = $("[data-track]");
  const setH = () => { track.style.height = (LAST + 1) * window.innerHeight + "px"; };
  setH();
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.create({
    trigger: track, start: "top top", end: "bottom bottom", scrub: true,
    snap: reduceMotion || /nosnap/.test(location.search) ? false : { snapTo: STARTS.map((s) => s / LAST), duration: { min: 0.2, max: 0.5 }, delay: 0.08, ease: "power1.inOut" },
    onUpdate: (self) => update(self.scroll()),
  });
  $("[data-top]").addEventListener("click", (e) => { e.preventDefault(); goTo(0); });
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { setH(); ScrollTrigger.refresh(); update(window.scrollY); }, 200); });
}

/* ---------- scene state ---------- */
let transcriptRan = false;
function activate(i) {
  if (i === active) return;
  active = i;
  const s = SCENES[i];
  $$("[data-cap]").forEach((el) => el.classList.toggle("is-on", +el.dataset.cap === i));
  $$("[data-go]").forEach((el) => el.classList.toggle("is-on", +el.dataset.go === i));
  $("[data-hint]").classList.toggle("is-on", !!s.hint);
  stopCycle();
  if (marble && marble.override) marble.clearOverride(0.9);
  if (s.tools && marble) setTimeout(() => { if (active === i) startCycle(); }, 900);
  if (s.transcript && !transcriptRan) { transcriptRan = true; typeTranscript(); }
}
async function typeTranscript() {
  const tr = $("[data-transcript]");
  if (!tr) return;
  for (const line of $$(".tr-line", tr)) {
    const t = line.querySelector(".tr-text"), text = t.dataset.text;
    line.classList.add("in");
    const caret = document.createElement("span"); caret.className = "tr-caret"; t.after(caret);
    for (let k = 1; k <= text.length; k++) { t.textContent = text.slice(0, k); await new Promise((r) => setTimeout(r, 20 + Math.random() * 28)); }
    caret.remove();
    await new Promise((r) => setTimeout(r, 380));
  }
}
/* the stack: the marble cycles through the tools on its own; hovering one holds it */
let cycleTimer = null, hotTool = null;
function showTool(slug) {
  if (!marble) return;
  const host = $("[data-tools]");
  if (host) $$("[data-tool]", host).forEach((b) => b.classList.toggle("is-hot", b.dataset.tool === slug));
  marble.setOverride("logo:" + slug, 0.9);
}
function startCycle() {
  stopCycle();
  let k = 0;
  showTool(TOOLS[0]);
  cycleTimer = setInterval(() => { if (hotTool) return; k = (k + 1) % TOOLS.length; showTool(TOOLS[k]); }, 3000);
}
function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; hotTool = null; }
function initTools() {
  const host = $("[data-tools]");
  if (!host) return;
  host.addEventListener("mouseover", (e) => { const b = e.target.closest("[data-tool]"); if (b && b.dataset.tool !== hotTool) { hotTool = b.dataset.tool; showTool(hotTool); } });
  host.addEventListener("mouseleave", () => { hotTool = null; });
  host.addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (!b) return; hotTool = b.dataset.tool; showTool(hotTool); setTimeout(() => { if (hotTool === b.dataset.tool) hotTool = null; }, 2500); });
}

/* ---------- sound: chisel taps while it carves, a quiet hall underneath ---------- */
const Sound = {
  on: false, ctx: null, master: null, last: 0, hum: null,
  toggle() {
    this.on = !this.on;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (this.on && !this.ctx && AC) {
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      // the room: filtered noise, very low
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      let b = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = b * 3.5; }
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
      const g = this.ctx.createGain(); g.gain.value = 0.05;
      src.connect(lp).connect(g).connect(this.master); src.start(); this.hum = g;
    }
    if (this.ctx) { if (this.on) this.ctx.resume(); else this.ctx.suspend(); }
    const btn = $("[data-sound]"); btn.setAttribute("aria-pressed", String(this.on)); btn.textContent = "sound: " + (this.on ? "on" : "off");
  },
  tap(energy) {
    if (!this.on || !this.ctx) return;
    const now = this.ctx.currentTime; if (now - this.last < 0.07) return; this.last = now;
    const dur = 0.05 + Math.random() * 0.04;
    const len = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800 + Math.random() * 2600; bp.Q.value = 1.4;
    const g = this.ctx.createGain(); g.gain.value = 0.05 + 0.18 * Math.min(1, energy);
    src.connect(bp).connect(g).connect(this.master); src.start(now); src.stop(now + dur + 0.02);
    const o = this.ctx.createOscillator(), og = this.ctx.createGain();
    o.type = "sine"; o.frequency.value = 2600 + Math.random() * 2200;
    og.gain.setValueAtTime(0.03 * Math.min(1, energy + 0.3), now); og.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    o.connect(og).connect(this.master); o.start(now); o.stop(now + 0.06);
  },
};
function initSound() { $("[data-sound]").addEventListener("click", () => Sound.toggle()); }

/* ---------- the marble ---------- */
function initMarble() {
  return new Promise((resolve) => {
    const host = $("[data-marble]");
    const start = () => {
      try {
        marble = window.createMarble(host, { maxDpr: isSmall() ? 1 : 1.25, quality: isSmall() || /lq/.test(location.search) ? "low" : "high" });
        document.addEventListener("mousemove", (e) => marble.setPointer(e.clientX, e.clientY), { passive: true });
        document.addEventListener("mouseleave", () => marble.clearPointer());
        document.addEventListener("visibilitychange", () => marble.setPaused(document.hidden));
        marble.onCarve((carve) => { if (carve > 0.04) Sound.tap(carve); });
      } catch (e) { console.warn(e); }
      resolve(marble);
    };
    if (window.createMarble) start();
    else { let done = false; window.addEventListener("marble-ready", () => { if (!done) { done = true; start(); } }, { once: true }); setTimeout(() => { if (!done) { done = true; start(); } }, 5000); }
  });
}

/* ---------- boot ---------- */
async function boot() {
  if (!window.gsap || !window.ScrollTrigger) return;
  renderCaptions();
  initTools(); initSound();
  await initMarble();
  initScroll();
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  const u = window.scrollY / window.innerHeight;
  let i0 = 0; for (let k = 0; k < N; k++) if (u >= STARTS[k]) i0 = k;
  if (marble) { const L = layoutFor(SCENES[i0]); marble.setFit({ fill: L.fill, fillX: L.fillX }); marble.setOffset(L.x, L.y); marble.setShape(SCENES[i0].shape, reduceMotion ? 0.4 : 1.6); }
  setTimeout(() => { ready = true; document.body.classList.add("is-ready"); update(window.scrollY); }, reduceMotion ? 450 : 1500);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
