/* =========================================================================
   henry. — the little planet. One screen: a small world with a ring road,
   and every project is a landmark beside it. You drive the rover along the
   road (scroll, keys, drag) and the planet turns under it. Copy and links
   live in SCENES.
   ========================================================================= */

const GH = "https://github.com/henrybrewer00-dotcom";
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");
const TOOLS = ["react", "typescript", "python", "electron", "arduino", "twilio", "elevenlabs", "claude", "vercel", "github"];

/* len = how many screens of scrolling this stop takes; stop = the landmark */
const SCENES = [
  { id: "b0", stop: "house", word: "hi", len: 1.1 },
  { id: "b1", stop: "sign", arg: "henry.", word: "that's me", len: 1.1 },
  { id: "b2", stop: "sign", arg: "14", word: "years old", len: 1.1 },
  { id: "b3", stop: "sign", arg: "austin, tx", word: "from", len: 1.1 },
  { id: "b4", stop: "sign", arg: "proud vibecoder", word: "and a", len: 1.2 },
  { id: "hero", stop: "billboard", arg: "I make way|too much|stuff.", hint: true, label: "I", len: 1.3 },
  { id: "me", stop: "bust", label: "II", kicker: "stop 01 · the maker", title: "I'm Henry.", body: "Fourteen, from Austin, and a proud vibecoder. I build voice AI, robots, a submarine, and a company. Founder of SiteLight. Straight A's, 99.5 in math, 125 words a minute." },
  { id: "sitelight", stop: "lighthouse", label: "III", kicker: "stop 02 · founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], image: { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" } },
  { id: "lily", stop: "phone", label: "IV", kicker: "stop 03 · voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], transcript: true },
  { id: "wins", stop: "trophies", label: "V", kicker: "stop 04 · hackathons", title: "Some hackathon wins", list: ["InsForge", "Frontier Tower", "a16z × Cursor"] },
  { id: "glasscast", stop: "camera", label: "VI", kicker: "stop 05 · open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], action: { href: GH + "/Glasscast", label: "Repo ↗" } },
  { id: "drivethru", stop: "drivethru", label: "VII", kicker: "stop 06 · voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], action: { href: GH + "/voice-drive-thru", label: "Repo ↗" } },
  { id: "elevenmile", stop: "stage", label: "VIII", kicker: "stop 07 · AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], action: { href: GH + "/eleven-mile", label: "Repo ↗" } },
  { id: "pawbot", stop: "doghouse", label: "IX", kicker: "stop 08 · accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], action: { href: GH + "/PawBot", label: "Repo ↗" } },
  { id: "siege", stop: "garage", label: "X", kicker: "stop 09 · robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works. You're driving it.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", stop: "ocean", label: "XI", kicker: "stop 10 · hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", stop: "graph", label: "XII", kicker: "stop 11 · merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], action: { href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests", label: "See the PRs ↗" } },
  { id: "stack", stop: "crates", label: "XIII", kicker: "made with", title: "The stack", body: "It cycles. Hover one to hold it.", tools: TOOLS },
  { id: "receipts", stop: "scoreboard", label: "XIV", kicker: "also", title: "Receipts", body: "Hackathon wins at InsForge, Frontier Tower and a16z × Cursor. Straight A's, 99.5 in math. Merged PRs in SymPy, Biome and Astro. 125 words a minute." },
  { id: "hire", stop: "mailbox", label: "XV", kicker: "the end of the road", title: "Got an idea?", body: "Let's build it this weekend.", actions: [{ href: MAIL, label: "Email me →" }, { href: GH, label: "GitHub ↗" }, { href: "deck/", label: "Older site: card deck", soft: true }, { href: "old/", label: "Older site: terminal", soft: true }] },
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
const TOTAL = LAST + (SCENES[N - 1].len || 1) + 0.6;   // one lap of the road, with a gap before home

let planet = null, lenis = null, ready = false, active = -1;

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

/* ---------- scroll = driving ---------- */
function sceneY(i) { return STARTS[i] * window.innerHeight; }
function goTo(i) { const y = sceneY(i); if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: "smooth" }); }
function update(y) {
  if (!planet || !ready) return;
  const u = Math.max(0, Math.min(LAST, y / window.innerHeight));
  let i = 0;
  for (let k = 0; k < N - 1; k++) if (u >= STARTS[k]) i = k;
  const len = SCENES[i].len || 1;
  const t = i >= N - 1 ? 0 : Math.max(0, Math.min(1, (u - STARTS[i]) / len));
  planet.setProgress(u / TOTAL);
  activate(t < 0.5 ? i : Math.min(N - 1, i + 1));
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
    snap: reduceMotion || /nosnap/.test(location.search) ? false : { snapTo: STARTS.map((s) => s / LAST), duration: { min: 0.2, max: 0.6 }, delay: 0.12, ease: "power1.inOut" },
    onUpdate: (self) => update(self.scroll()),
  });
  $("[data-top]").addEventListener("click", (e) => { e.preventDefault(); goTo(0); });
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { setH(); ScrollTrigger.refresh(); update(window.scrollY); }, 200); });

  // keys drive: hold to keep rolling
  const held = new Set();
  const FWD = ["ArrowDown", "ArrowRight", "PageDown", " ", "s", "d", "S", "D"], BACK = ["ArrowUp", "ArrowLeft", "PageUp", "w", "a", "W", "A"];
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, button, a")) return;
    if (FWD.includes(e.key) || BACK.includes(e.key)) { e.preventDefault(); held.add(e.key); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(N - 1); }
  });
  document.addEventListener("keyup", (e) => held.delete(e.key));
  window.addEventListener("blur", () => held.clear());
  let kl = performance.now();
  const drive = (now) => {
    requestAnimationFrame(drive);
    const dt = Math.min(0.05, (now - kl) / 1000); kl = now;
    if (!held.size) return;
    let dir = 0; for (const k of held) dir += FWD.includes(k) ? 1 : -1;
    if (!dir) return;
    const cur = lenis ? lenis.targetScroll : window.scrollY;
    const y = Math.max(0, Math.min(LAST * window.innerHeight, cur + Math.sign(dir) * 980 * dt));
    if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
  };
  requestAnimationFrame(drive);

  // drag the world to drive (mouse only; touch scrolls natively)
  let drag = null;
  document.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("a, button, .cap, .rail, .nav")) return; drag = { x: e.clientX, y0: lenis ? lenis.targetScroll : window.scrollY }; document.body.classList.add("is-dragging"); });
  document.addEventListener("pointermove", (e) => { if (!drag) return; const y = Math.max(0, Math.min(LAST * window.innerHeight, drag.y0 - (e.clientX - drag.x) * 2.4)); if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); });
  const endDrag = () => { if (drag) { drag = null; document.body.classList.remove("is-dragging"); } };
  document.addEventListener("pointerup", endDrag); document.addEventListener("pointercancel", endDrag);
}

/* ---------- stop state ---------- */
let transcriptRan = false;
function activate(i) {
  if (i === active) return;
  const first = active < 0;
  active = i;
  const s = SCENES[i];
  $$("[data-cap]").forEach((el) => el.classList.toggle("is-on", +el.dataset.cap === i));
  $$("[data-go]").forEach((el) => el.classList.toggle("is-on", +el.dataset.go === i));
  $("[data-hint]").classList.toggle("is-on", !!s.hint);
  document.title = s.title ? "henry. — " + s.title : "henry. — proud vibecoder, 14, Austin";
  stopCycle();
  if (s.tools && planet) setTimeout(() => { if (active === i) startCycle(); }, 700);
  if (s.transcript && !transcriptRan) { transcriptRan = true; typeTranscript(); }
  if (!first) { Sound.ding(); nudgeSound(); }
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
/* the stack: the crates take turns; hovering one holds it */
let cycleTimer = null, hotTool = null;
function showTool(slug) {
  const host = $("[data-tools]");
  if (host) $$("[data-tool]", host).forEach((b) => b.classList.toggle("is-hot", b.dataset.tool === slug));
  if (planet) planet.hotTool(slug);
}
function startCycle() {
  stopCycle();
  let k = 0;
  showTool(TOOLS[0]);
  cycleTimer = setInterval(() => { if (hotTool) return; k = (k + 1) % TOOLS.length; showTool(TOOLS[k]); }, 2600);
}
function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; hotTool = null; showTool(null); }
function initTools() {
  const host = $("[data-tools]");
  if (!host) return;
  host.addEventListener("mouseover", (e) => { const b = e.target.closest("[data-tool]"); if (b && b.dataset.tool !== hotTool) { hotTool = b.dataset.tool; showTool(hotTool); } });
  host.addEventListener("mouseleave", () => { hotTool = null; });
  host.addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (!b) return; hotTool = b.dataset.tool; showTool(hotTool); setTimeout(() => { if (hotTool === b.dataset.tool) hotTool = null; }, 2500); });
}

/* ---------- sound: a little engine, a ding at each stop ---------- */
const Sound = {
  on: false, ctx: null, master: null, eng: null, engGain: null, engFilter: null,
  toggle() {
    this.on = !this.on;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (this.on && !this.ctx && AC) {
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(); o1.type = "sawtooth"; o2.type = "triangle"; o1.frequency.value = 52; o2.frequency.value = 104;
      this.engFilter = this.ctx.createBiquadFilter(); this.engFilter.type = "lowpass"; this.engFilter.frequency.value = 220;
      this.engGain = this.ctx.createGain(); this.engGain.gain.value = 0;
      o1.connect(this.engFilter); o2.connect(this.engFilter); this.engFilter.connect(this.engGain).connect(this.master); o1.start(); o2.start(); this.eng = [o1, o2];
    }
    if (this.ctx) { if (this.on) this.ctx.resume(); else this.ctx.suspend(); }
    const btn = $("[data-sound]"); btn.setAttribute("aria-pressed", String(this.on)); btn.textContent = "sound: " + (this.on ? "on" : "off");
  },
  engine(speed) {
    if (!this.on || !this.ctx) return;
    const s = Math.min(1, speed / 2.2), now = this.ctx.currentTime;
    this.engGain.gain.setTargetAtTime(0.012 + 0.05 * s, now, 0.08);
    this.eng[0].frequency.setTargetAtTime(48 + 70 * s, now, 0.1); this.eng[1].frequency.setTargetAtTime(96 + 140 * s, now, 0.1);
    this.engFilter.frequency.setTargetAtTime(200 + 500 * s, now, 0.1);
  },
  ding() {
    if (!this.on || !this.ctx) return;
    const now = this.ctx.currentTime;
    [880, 1320].forEach((f, i) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.05 - i * 0.02, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35); o.connect(g).connect(this.master); o.start(now); o.stop(now + 0.4); });
  },
};
function initSound() { $("[data-sound]").addEventListener("click", () => Sound.toggle()); }
let nudged = false;
function nudgeSound() {
  if (nudged || Sound.on) return;
  try { if (sessionStorage.getItem("nudged")) { nudged = true; return; } sessionStorage.setItem("nudged", "1"); } catch (e) {}
  nudged = true;
  const n = $("[data-nudge]"); if (!n) return;
  n.classList.add("is-on"); setTimeout(() => n.classList.remove("is-on"), 4200);
}

/* ---------- the planet ---------- */
function initPlanet() {
  return new Promise((resolve) => {
    const host = $("[data-planet]");
    const start = () => {
      try {
        const stops = SCENES.map((s, i) => ({ kind: s.stop, arg: s.arg, u: STARTS[i] / TOTAL }));
        planet = window.createPlanet(host, { stops, tools: TOOLS, small: isSmall(), maxDpr: isSmall() ? 2 : 1.5 });
        document.addEventListener("mousemove", (e) => planet.setPointer(e.clientX, e.clientY), { passive: true });
        document.addEventListener("mouseleave", () => planet.clearPointer());
        document.addEventListener("visibilitychange", () => planet.setPaused(document.hidden));
        planet.onDrive((speed) => Sound.engine(speed));
      } catch (e) { console.warn(e); }
      resolve(planet);
    };
    if (window.createPlanet) start();
    else { let done = false; window.addEventListener("planet-ready", () => { if (!done) { done = true; start(); } }, { once: true }); setTimeout(() => { if (!done) { done = true; start(); } }, 5000); }
  });
}

/* ---------- boot ---------- */
async function boot() {
  if (!window.gsap || !window.ScrollTrigger) return;
  renderCaptions();
  initTools(); initSound();
  await initPlanet();
  initScroll();
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  if (planet) planet.jump(Math.max(0, Math.min(LAST, window.scrollY / window.innerHeight)) / TOTAL);
  setTimeout(() => { ready = true; document.body.classList.add("is-ready"); update(window.scrollY); }, reduceMotion ? 300 : 700);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
