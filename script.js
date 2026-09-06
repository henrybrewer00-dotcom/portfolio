/* =========================================================================
   henry. — scenes. The page is one screen of dots; scrolling moves the dots
   from one shape to the next, exactly as far as you've scrolled.
   ========================================================================= */

const GH = "https://github.com/henrybrewer00-dotcom";
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");
const TOOLS = ["react", "typescript", "python", "electron", "arduino", "twilio", "elevenlabs", "claude", "vercel", "github"];

/* len = how many screens of scrolling this scene takes (the intro beats get more, so they go slower) */
const SCENES = [
  { id: "b1", shape: "sphere", word: "hi", len: 1.2 },
  { id: "b2", shape: "text:henry.", word: "that's me", len: 1.3 },
  { id: "b3", shape: "text:14", word: "years old", len: 1.3 },
  { id: "b4", shape: "text:austin, tx", word: "from", len: 1.3 },
  { id: "b5", shape: "text:proud\nvibecoder", word: "and a", len: 1.4 },
  { id: "hero", shape: "text:I make way\ntoo much\nstuff.", hint: true, label: "hi", len: 1.3 },
  { id: "me", shape: "sphere", label: "me", kicker: "so", title: "I'm Henry.", body: "Fourteen, from Austin. I build voice AI, robots, a submarine, and a company. Founder of SiteLight. Straight A's, 99.5 in math, 125 words a minute." },
  { id: "sitelight", shape: "draw:eye", label: "SiteLight", kicker: "01 · founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], image: { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" } },
  { id: "lily", shape: "wave", label: "Lily", kicker: "02 · voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], transcript: true },
  { id: "wins", shape: "draw:trophy", label: "Wins", kicker: "03 · hackathons", title: "Some hackathon wins", list: ["InsForge", "Frontier Tower", "a16z × Cursor"] },
  { id: "glasscast", shape: "draw:rec", label: "Glasscast", kicker: "04 · open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], action: { type: "link", href: GH + "/Glasscast", label: "Repo ↗" } },
  { id: "drivethru", shape: "draw:burger", label: "Drive-thru", kicker: "05 · voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], action: { type: "link", href: GH + "/voice-drive-thru", label: "Repo ↗" } },
  { id: "elevenmile", shape: "draw:mic", label: "Eleven Mile", kicker: "06 · AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], action: { type: "link", href: GH + "/eleven-mile", label: "Repo ↗" } },
  { id: "pawbot", shape: "draw:paw", label: "PawBot", kicker: "07 · accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], action: { type: "link", href: GH + "/PawBot", label: "Repo ↗" } },
  { id: "siege", shape: "car", label: "S.I.E.G.E.", kicker: "08 · robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", shape: "sub", label: "Submarine", kicker: "09 · hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", shape: "draw:git", label: "Open source", kicker: "10 · merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], action: { type: "link", href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests", label: "See the PRs ↗" } },
  { id: "stack", shape: "keycaps", label: "Stack", kicker: "made with", title: "The stack", body: "It cycles. Hover one to hold it.", tools: TOOLS },
  { id: "receipts", shape: "text:99.5", label: "Receipts", kicker: "also", title: "Receipts", body: "Hackathon wins at InsForge, Frontier Tower and a16z × Cursor. Straight A's, 99.5 in math. Merged PRs in SymPy, Biome and Astro. 125 words a minute." },
  { id: "hire", shape: "text:hire me", label: "Hire me", kicker: "the end", title: "Got an idea?", body: "Let's build it this weekend.", actions: [{ type: "link", href: MAIL, label: "Email me →" }, { type: "link", href: GH, label: "GitHub ↗" }, { type: "link", href: "deck/", label: "Older site: card deck", soft: true }, { type: "link", href: "old/", label: "Older site: terminal", soft: true }] },
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
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const isSmall = () => window.innerWidth <= 800;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const N = SCENES.length;
const STARTS = SCENES.reduce((acc, s, i) => { acc.push(i ? acc[i - 1] + (SCENES[i - 1].len || 1) : 0); return acc; }, []);
const LAST = STARTS[N - 1];

let swarm = null, lenis = null, ready = false, active = -1;

/* ---------- captions + rail ---------- */
function renderCaptions() {
  const host = $("[data-caps]");
  host.innerHTML = SCENES.map((s, i) => {
    if (s.word) return `<div class="cap is-word" data-cap="${i}">${esc(s.word)}</div>`;
    if (!s.title) return `<div class="cap" data-cap="${i}"></div>`;
    const acts = [].concat(s.action || [], s.actions || []);
    const actHtml = acts.length ? `<div class="acts">${acts.map((a) => a.type === "video"
      ? `<button type="button" class="act" data-act="video">${esc(a.label)}</button>`
      : `<a class="act${a.soft ? " is-soft" : ""}" href="${esc(a.href)}"${a.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${esc(a.label)}</a>`).join("")}</div>` : "";
    const tr = s.transcript ? `<div class="tr" data-transcript>${TRANSCRIPT.map(([who, line]) => `<div class="tr-line${who === "Lily" ? " is-lily" : ""}"><span class="tr-who">${esc(who)}</span><span class="tr-text" data-text="${esc(line)}"></span></div>`).join("")}<p class="tr-note">sample call · not a recording</p></div>` : "";
    const img = s.image ? `<figure class="fig"><img src="${esc(s.image.src)}" alt="${esc(s.image.alt)}" loading="lazy" /><figcaption>${esc(s.image.cap)}</figcaption></figure>` : "";
    const list = s.list ? `<ul class="list">${s.list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    const tools = s.tools ? `<div class="tools" data-tools>${s.tools.map((t) => `<button type="button" data-tool="${esc(t)}">${esc((window.LOGOS && window.LOGOS[t] && window.LOGOS[t].label) || t)}</button>`).join("")}</div>` : "";
    return `<div class="cap" data-cap="${i}">
      <p class="kicker">${esc(s.kicker || "")}</p>
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.body || "")}</p>
      ${s.tags ? `<div class="tags">${s.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      ${list}${img}${tr}${tools}${actHtml}
    </div>`;
  }).join("");
  const rail = $("[data-rail]");
  rail.innerHTML = SCENES.map((s, i) => s.label ? `<button type="button" data-go="${i}" aria-label="${esc(s.label)}"><span>${esc(s.label)}</span><i></i></button>` : "").join("");
  rail.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) goTo(+b.dataset.go); });
}

/* ---------- scroll ---------- */
function sceneY(i) { return STARTS[i] * window.innerHeight; }
function goTo(i) { const y = sceneY(i); if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: "smooth" }); }
function layoutFor(s) {
  const hw = swarm.halfH * swarm.aspect, hh = swarm.halfH;
  const hasCap = !!(s && s.title);
  if (isSmall()) {
    if (!hasCap) return { x: 0, y: 0, fill: 0.5, fillX: 0.9 };
    return { x: 0, y: hh * (s.transcript || s.image || s.tools ? 0.5 : 0.36), fill: s.transcript || s.image || s.tools ? 0.3 : 0.42, fillX: 0.9 };
  }
  if (!hasCap) return { x: 0, y: 0, fill: 0.8, fillX: 0.86 };
  return { x: hw * 0.34, y: hh * 0.06, fill: 0.72, fillX: 0.52 };
}
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function update(y) {
  if (!swarm || !ready) return;
  const u = Math.max(0, Math.min(LAST, y / window.innerHeight));
  let i = 0;
  for (let k = 0; k < N - 1; k++) if (u >= STARTS[k]) i = k;
  const len = SCENES[i].len || 1;
  const t = i >= N - 1 ? 0 : Math.max(0, Math.min(1, (u - STARTS[i]) / len));
  const j = Math.min(N - 1, i + 1);
  swarm.setBlend(SCENES[i].shape, SCENES[j].shape, t);
  const A = layoutFor(SCENES[i]), B = layoutFor(SCENES[j]), e = smooth(t);
  swarm.setFit({ fill: lerp(A.fill, B.fill, e), fillX: lerp(A.fillX, B.fillX, e) });
  swarm.setOffset(lerp(A.x, B.x, e), lerp(A.y, B.y, e));
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
    snap: reduceMotion ? false : { snapTo: STARTS.map((s) => s / LAST), duration: { min: 0.2, max: 0.5 }, delay: 0.08, ease: "power1.inOut" },
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
  const hit = $("[data-hit]");
  hit.classList.toggle("is-action", !!s.action);
  hit.setAttribute("title", s.action ? s.action.label : "");
  stopCycle();
  if (swarm && swarm.override) swarm.clearOverride(0.8);
  if (s.tools && swarm) setTimeout(() => { if (active === i) startCycle(); }, 900);
  if (s.transcript && !transcriptRan) { transcriptRan = true; typeTranscript(); }
}
function runAction() {
  const s = SCENES[active];
  if (!s || !s.action) return;
  if (s.action.type === "video") { if (swarm) { swarm.burst(0.5); if (swarm.override) swarm.clearOverride(0.8); } openLightbox(s.action.src, s.action.poster, s.title + " — a16z × Cursor, 1st place"); }
  else window.open(s.action.href, "_blank", "noopener");
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
/* the stack: it cycles through the tools; hovering one holds it */
let cycleTimer = null, hotTool = null;
function showTool(slug) {
  if (!swarm) return;
  const host = $("[data-tools]");
  if (host) $$("[data-tool]", host).forEach((b) => b.classList.toggle("is-hot", b.dataset.tool === slug));
  swarm.setOverride("logo:" + slug, 0.9);
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

/* ---------- the swarm ---------- */
function initSwarm() {
  return new Promise((resolve) => {
    const host = $("[data-swarm]");
    const start = () => {
      try {
        swarm = window.createSwarm(host, { count: isSmall() ? 6500 : 16000, maxDpr: isSmall() ? 1.5 : 2, ink: cssVar("--fg"), accent: cssVar("--accent"), pointSize: isSmall() ? 3.6 : 3.0 });
        document.addEventListener("mousemove", (e) => swarm.setPointer(e.clientX, e.clientY), { passive: true });
        document.addEventListener("mouseleave", () => swarm.clearPointer());
        document.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) swarm.setPointer(t.clientX, t.clientY); }, { passive: true });
        document.addEventListener("touchend", () => swarm.clearPointer());
        document.addEventListener("visibilitychange", () => swarm.setPaused(document.hidden));
      } catch (e) { console.warn(e); }
      resolve(swarm);
    };
    if (window.createSwarm) start();
    else { let done = false; window.addEventListener("swarm-ready", () => { if (!done) { done = true; start(); } }, { once: true }); setTimeout(() => { if (!done) { done = true; start(); } }, 5000); }
  });
}

/* ---------- lightbox ---------- */
function openLightbox(src, poster, title) {
  const box = $("#lightbox"), vid = box.querySelector("video");
  box.querySelector(".lightbox__title").textContent = title || "";
  if (poster) vid.poster = poster;
  vid.src = src; box.classList.add("is-open"); box.setAttribute("aria-hidden", "false");
  if (lenis) lenis.stop();
  const p = vid.play(); if (p && p.catch) p.catch(() => {});
}
function initLightbox() {
  const box = $("#lightbox"), vid = box.querySelector("video");
  const close = () => { box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true"); vid.pause(); vid.removeAttribute("src"); vid.load(); if (lenis) lenis.start(); };
  box.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
}

/* ---------- theme ---------- */
function initTheme() {
  const btn = $("[data-theme]");
  const apply = (m) => {
    document.documentElement.classList.remove("dark", "light"); document.documentElement.classList.add(m);
    $('meta[name="theme-color"]').setAttribute("content", m === "dark" ? "#0f0f0e" : "#f3efe6");
    if (swarm) swarm.setColors(cssVar("--fg"), cssVar("--accent"));
  };
  btn.addEventListener("click", () => { const next = document.documentElement.classList.contains("dark") ? "light" : "dark"; try { localStorage.setItem("mode", next); } catch (e) {} apply(next); });
  apply(document.documentElement.classList.contains("dark") ? "dark" : "light");
}

/* ---------- boot ---------- */
async function boot() {
  if (!window.gsap || !window.ScrollTrigger) return;
  renderCaptions();
  initLightbox(); initTheme(); initTools();
  $("[data-hit]").addEventListener("click", runAction);
  document.addEventListener("click", (e) => { if (e.target.closest('[data-act="video"]')) runAction(); });
  await initSwarm();
  if (swarm) swarm.setColors(cssVar("--fg"), cssVar("--accent"));
  initScroll();
  // load-in: the field gathers into whatever scene you're on, then scrolling takes over
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  const u = window.scrollY / window.innerHeight;
  let i0 = 0; for (let k = 0; k < N; k++) if (u >= STARTS[k]) i0 = k;
  if (swarm) { const L = layoutFor(SCENES[i0]); swarm.setFit({ fill: L.fill, fillX: L.fillX }); swarm.setOffset(L.x, L.y); swarm.setShape(SCENES[i0].shape, reduceMotion ? 0.4 : 1.7); }
  setTimeout(() => { ready = true; document.body.classList.add("is-ready"); update(window.scrollY); }, reduceMotion ? 450 : 1750);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
