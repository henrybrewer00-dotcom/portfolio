/* =========================================================================
   henry. — scenes. Scrolling doesn't move the page, it tells the dots what
   to become next. GSAP ScrollTrigger + Lenis drive the scene index; the
   swarm (swarm.js) does the morphing.
   ========================================================================= */

const GH = "https://github.com/henrybrewer00-dotcom";
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");

const SCENES = [
  { id: "hero", shape: "text:I make way\ntoo much\nstuff.", hint: true, label: "hi" },
  { id: "who", shape: "sphere", label: "me", kicker: "Hi", title: "I'm Henry.", body: "Fourteen, from Austin. I build voice AI, robots, a submarine, and a company. Founder of SiteLight. Straight A's, 99.5 in math, 125 words a minute." },
  { id: "sitelight", shape: "draw:eye", label: "SiteLight", kicker: "01 · founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], action: { type: "link", href: "https://sitelight.xyz", label: "Go · $2 ↗" } },
  { id: "lily", shape: "draw:wave", label: "Lily", kicker: "02 · voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], transcript: true },
  { id: "stage", shape: "draw:play", label: "On stage", kicker: "03 · a16z × Cursor hackathon", title: "Lily, on stage", body: "First place. This is the demo, in front of 150 people. Press the dots.", pressme: true, action: { type: "video", src: "assets/lily-demo.mp4", poster: "assets/lily-demo-poster.jpg", label: "Play the demo ▶" } },
  { id: "glasscast", shape: "draw:rec", label: "Glasscast", kicker: "04 · open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], action: { type: "link", href: GH + "/Glasscast", label: "Repo ↗" } },
  { id: "drivethru", shape: "draw:burger", label: "Drive-thru", kicker: "05 · voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], action: { type: "link", href: GH + "/voice-drive-thru", label: "Repo ↗" } },
  { id: "elevenmile", shape: "draw:mic", label: "Eleven Mile", kicker: "06 · AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], action: { type: "link", href: GH + "/eleven-mile", label: "Repo ↗" } },
  { id: "pawbot", shape: "draw:paw", label: "PawBot", kicker: "07 · accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], action: { type: "link", href: GH + "/PawBot", label: "Repo ↗" } },
  { id: "siege", shape: "car", label: "S.I.E.G.E.", kicker: "08 · robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", shape: "sub", label: "Submarine", kicker: "09 · hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", shape: "draw:git", label: "Open source", kicker: "10 · merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], action: { type: "link", href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests", label: "See the PRs ↗" } },
  { id: "stack", shape: "keycaps", label: "Stack", kicker: "made with", title: "The stack", body: "React, TypeScript, Python, Electron, Arduino, Twilio, ElevenLabs, Claude, Vercel, GitHub. And 125 words a minute." },
  { id: "receipts", shape: "text:1st", label: "Receipts", kicker: "receipts", title: "Proof", body: "First place at the a16z × Cursor hackathon, on stage in front of 150 people. Straight A's, 99.5 in math. Merged PRs in SymPy, Biome and Astro." },
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

let swarm = null, lenis = null, current = -1, ready = false;

/* ---------- render captions + rail ---------- */
function renderCaptions() {
  const host = $("[data-caps]");
  host.innerHTML = SCENES.map((s, i) => {
    if (!s.title) return `<div class="cap" data-cap="${i}"></div>`;
    const acts = [].concat(s.action || [], s.actions || []);
    const actHtml = acts.length ? `<div class="acts">${acts.map((a) => a.type === "video"
      ? `<button type="button" class="act" data-act="video">${esc(a.label)}</button>`
      : `<a class="act${a.soft ? " is-soft" : ""}" href="${esc(a.href)}"${a.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${esc(a.label)}</a>`).join("")}</div>` : "";
    const tr = s.transcript ? `<div class="tr" data-transcript>${TRANSCRIPT.map(([who, line]) => `<div class="tr-line${who === "Lily" ? " is-lily" : ""}"><span class="tr-who">${esc(who)}</span><span class="tr-text" data-text="${esc(line)}"></span></div>`).join("")}<p class="tr-note">sample call · not a recording</p></div>` : "";
    return `<div class="cap" data-cap="${i}">
      <p class="kicker">${esc(s.kicker || "")}</p>
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.body || "")}</p>
      ${s.tags ? `<div class="tags">${s.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      ${tr}${actHtml}
    </div>`;
  }).join("");
  const rail = $("[data-rail]");
  rail.innerHTML = SCENES.map((s, i) => `<button type="button" data-go="${i}" aria-label="${esc(s.label)}"><span>${esc(s.label)}</span><i></i></button>`).join("");
  rail.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) goTo(+b.dataset.go); });
}

/* ---------- scroll ---------- */
function sceneY(i) { return i * window.innerHeight; }
function goTo(i) { const y = sceneY(i); if (lenis) lenis.scrollTo(y, { duration: 1 }); else window.scrollTo({ top: y, behavior: "smooth" }); }
function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  const track = $("[data-track]");
  const setH = () => { track.style.height = N * window.innerHeight + "px"; };
  setH();
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.13, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.create({
    trigger: track, start: "top top", end: "bottom bottom", scrub: true,
    snap: reduceMotion ? false : { snapTo: 1 / (N - 1), duration: { min: 0.15, max: 0.4 }, delay: 0.04, ease: "power1.inOut" },
    onUpdate(self) {
      activate(Math.round(self.progress * (N - 1)));
    },
  });
  $("[data-top]").addEventListener("click", (e) => { e.preventDefault(); goTo(0); });
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { setH(); ScrollTrigger.refresh(); placeShape(); }, 200); });
}

/* ---------- scenes ---------- */
let pressTimer = null, transcriptRan = false;
function layoutFor(s) {
  // where the shape sits and how much of the screen it may fill, given the caption
  if (!swarm) return null;
  const hw = swarm.halfH * swarm.aspect, hh = swarm.halfH;
  const hasCap = !!(s && s.title);
  if (isSmall()) {
    if (!hasCap) return { x: 0, y: 0, fill: 0.5, fillX: 0.9 };
    return { x: 0, y: hh * (s.transcript ? 0.5 : 0.36), fill: s.transcript ? 0.3 : 0.42, fillX: 0.9 };
  }
  if (!hasCap) return { x: 0, y: 0, fill: 0.8, fillX: 0.86 };
  return { x: hw * 0.34, y: hh * 0.06, fill: 0.72, fillX: 0.52 };
}
function placeShape() {
  if (!swarm) return;
  const L = layoutFor(SCENES[current]);
  if (!L) return;
  swarm.setFit({ fill: L.fill, fillX: L.fillX });
  const o = swarm.offset;
  gsap.to({ x: o.x, y: o.y }, { x: L.x, y: L.y, duration: 0.9, ease: "power2.inOut", onUpdate() { const t = this.targets()[0]; swarm.setOffset(t.x, t.y); } });
}
function activate(i) {
  if (i === current) return;
  const prev = SCENES[current];
  current = i;
  const s = SCENES[i];
  if (swarm && ready) { const L = layoutFor(s); swarm.setShape(s.shape, 1.0, L ? { fill: L.fill, fillX: L.fillX } : {}); }
  $$("[data-cap]").forEach((el) => el.classList.toggle("is-on", +el.dataset.cap === i));
  $$("[data-go]").forEach((el) => el.classList.toggle("is-on", +el.dataset.go === i));
  $("[data-hint]").classList.toggle("is-on", !!s.hint && ready);
  const hit = $("[data-hit]");
  hit.classList.toggle("is-action", !!s.action);
  hit.setAttribute("title", s.action ? s.action.label : "");
  placeShape();
  // the on-stage scene: a play button, then a nudge if nobody presses it
  clearTimeout(pressTimer); pressTimer = null;
  if (s.pressme) pressTimer = setTimeout(() => { if (current === i && swarm) swarm.setShape("draw:pressme", 1.3); }, 5000);
  if (s.transcript && !transcriptRan) { transcriptRan = true; typeTranscript(); }
}
function runAction() {
  const s = SCENES[current];
  if (!s || !s.action) return;
  if (s.action.type === "video") { clearTimeout(pressTimer); openLightbox(s.action.src, s.action.poster, s.title + " — a16z × Cursor hackathon, 1st place"); if (swarm) swarm.burst(0.6); }
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
  const close = () => {
    box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true");
    vid.pause(); vid.removeAttribute("src"); vid.load();
    if (lenis) lenis.start();
    if (swarm && SCENES[current] && SCENES[current].pressme) swarm.setShape("draw:play", 1.2);
  };
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
  initLightbox();
  initTheme();
  $("[data-hit]").addEventListener("click", runAction);
  document.addEventListener("click", (e) => { if (e.target.closest('[data-act="video"]')) runAction(); });
  await initSwarm();
  if (swarm) swarm.setColors(cssVar("--fg"), cssVar("--accent"));
  initScroll();
  activate(Math.round(Math.min(1, window.scrollY / Math.max(1, (N - 1) * window.innerHeight)) * (N - 1)));

  runIntro();
}

/* ---------- the intro: plays every time ---------- */
function runIntro() {
  const pre = $("[data-pre]");
  const beats = [
    ["sphere", "hi", 0.9],
    ["text:henry.", "that's me", 1.15],
    ["text:14", "years old", 1.0],
    ["text:austin, tx", "from", 1.15],
    ["text:proud\nvibecoder", "and a", 1.3],
  ];
  if (lenis) lenis.stop();
  document.documentElement.style.overflow = "hidden";
  window.scrollTo(0, 0);
  if (swarm) { swarm.setFit({ fill: 0.72, fillX: 0.86 }); swarm.setOffset(0, 0); }
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const fast = reduceMotion;
  let t = fast ? 0 : 0.35;
  if (!fast) {
    if (swarm) tl.call(() => swarm.burst(0.5), null, 0.05);
    beats.forEach(([shape, word, hold]) => {
      tl.call(() => { if (swarm) swarm.setShape(shape, 0.8, { fill: 0.7, fillX: 0.86 }); pre.textContent = word; }, null, t);
      t += hold;
    });
  }
  tl.call(finish, null, t);
  function finish() {
    if (finish.done) return; finish.done = true;
    tl.kill();
    pre.textContent = "";
    gsap.to(pre, { autoAlpha: 0, duration: 0.3, onComplete: () => pre.remove() });
    ready = true;
    document.documentElement.style.overflow = "";
    if (lenis) lenis.start();
    const i = current < 0 ? 0 : current;
    current = -1;
    activate(i);
    document.body.classList.add("is-ready");
  }
  // a click or a key skips ahead; scrolling waits
  const skip = () => finish();
  document.addEventListener("click", skip, { once: true });
  document.addEventListener("keydown", skip, { once: true });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
