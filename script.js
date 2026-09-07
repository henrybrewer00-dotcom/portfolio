/* =========================================================================
   henry. — Henry's little planet, the game. Drive the rover anywhere on a
   small world; every project is a landmark somewhere on it. Find all of
   them. Copy and links live in SCENES.
   ========================================================================= */

const GH = "https://github.com/henrybrewer00-dotcom";
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");
const TOOLS = ["react", "typescript", "python", "electron", "arduino", "twilio", "elevenlabs", "claude", "vercel", "github"];

const SCENES = [
  { id: "b0", stop: "house", label: "home", word: "home" },
  { id: "b1", stop: "sign", arg: "henry." },
  { id: "b2", stop: "sign", arg: "14" },
  { id: "b3", stop: "sign", arg: "austin, tx" },
  { id: "b4", stop: "sign", arg: "proud vibecoder" },
  { id: "hero", stop: "billboard", arg: "I make way|too much|stuff.", label: "the billboard", word: "I make way too much stuff." },
  { id: "me", stop: "bust", label: "the bust", kicker: "stop 01 · the maker", title: "I'm Henry.", body: "Fourteen, from Austin, and a proud vibecoder. I build voice AI, robots, a submarine, and a company. Founder of SiteLight. Straight A's, 99.5 in math, 125 words a minute." },
  { id: "sitelight", stop: "lighthouse", label: "the lighthouse", kicker: "stop 02 · founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], image: { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" } },
  { id: "lily", stop: "phone", label: "the phone box", kicker: "stop 03 · voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], transcript: true },
  { id: "wins", stop: "trophies", label: "the trophies", kicker: "stop 04 · hackathons", title: "Some hackathon wins", list: ["InsForge", "Frontier Tower", "a16z × Cursor"] },
  { id: "glasscast", stop: "camera", label: "the camera", kicker: "stop 05 · open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], action: { href: GH + "/Glasscast", label: "Repo ↗" } },
  { id: "drivethru", stop: "drivethru", label: "the drive-thru", kicker: "stop 06 · voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], action: { href: GH + "/voice-drive-thru", label: "Repo ↗" } },
  { id: "elevenmile", stop: "stage", label: "the stage", kicker: "stop 07 · AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], action: { href: GH + "/eleven-mile", label: "Repo ↗" } },
  { id: "pawbot", stop: "doghouse", label: "the dog house", kicker: "stop 08 · accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], action: { href: GH + "/PawBot", label: "Repo ↗" } },
  { id: "siege", stop: "garage", label: "the garage", kicker: "stop 09 · robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works. You're driving it. The dog is somewhere out there.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", stop: "ocean", label: "the lake", kicker: "stop 10 · hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", stop: "graph", label: "the merge tree", kicker: "stop 11 · merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], action: { href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests", label: "See the PRs ↗" } },
  { id: "stack", stop: "crates", label: "the crates", kicker: "made with", title: "The stack", body: "It cycles. Hover one to hold it.", tools: TOOLS },
  { id: "receipts", stop: "scoreboard", label: "the scoreboard", kicker: "also", title: "Receipts", body: "Hackathon wins at InsForge, Frontier Tower and a16z × Cursor. Straight A's, 99.5 in math. Merged PRs in SymPy, Biome and Astro. 125 words a minute." },
  { id: "hire", stop: "mailbox", label: "the mailbox", kicker: "the end of the road", title: "Got an idea?", body: "Let's build it this weekend.", actions: [{ href: MAIL, label: "Email me →" }, { href: GH, label: "GitHub ↗" }, { href: "deck/", label: "Older site: card deck", soft: true }, { href: "old/", label: "Older site: terminal", soft: true }] },
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
const touch = matchMedia("(pointer: coarse)").matches;
const N = SCENES.length;
const PROJECT = (s) => s.stop !== "sign" && s.stop !== "house" && s.stop !== "billboard";

let game = null, started = false, paused = false, active = -1, finished = false;
const save = { found: [], best: null, coins: 0 };
try { Object.assign(save, JSON.parse(localStorage.getItem("henry-planet") || "{}")); } catch (e) {}
function persist() { try { localStorage.setItem("henry-planet", JSON.stringify(save)); } catch (e) {} }

/* ---------- placards + the list of stops ---------- */
function renderCaptions() {
  const host = $("[data-caps]");
  host.innerHTML = SCENES.map((s, i) => {
    if (!s.title) return s.word ? `<div class="cap is-word" data-cap="${i}">${esc(s.word)}</div>` : "";
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
      <p class="cap-hint">drive away to close</p>
      <button type="button" class="cap-x" data-close aria-label="Close">×</button>
    </div>`;
  }).join("");
  const rail = $("[data-rail]");
  rail.innerHTML = SCENES.map((s, i) => PROJECT(s) ? `<div class="stop${save.found.includes(i) ? " is-found" : ""}" data-stop="${i}"><i></i><span>${esc(s.label)}</span></div>` : "").join("");
}

/* ---------- the game ---------- */
function initGame() {
  return new Promise((resolve) => {
    const host = $("[data-game]");
    const start = () => {
      try {
        const stops = SCENES.map((s) => ({ kind: s.stop, arg: s.arg }));
        game = window.createGame(host, { stops, tools: TOOLS, small: isSmall(), maxDpr: isSmall() ? 2 : 1.5 });
        game.setFound(save.found);
        document.addEventListener("mousemove", (e) => game.setPointer(e.clientX, e.clientY), { passive: true });
        document.addEventListener("mouseleave", () => game.clearPointer());
        document.addEventListener("visibilitychange", () => { if (document.hidden && started) setPaused(true); });
        game.on("enter", onEnter); game.on("leave", onLeave); game.on("coin", onCoin); game.on("dog", onDog); game.on("tick", onTick);
      } catch (e) { console.warn(e); }
      resolve(game);
    };
    if (window.createGame) start();
    else { let done = false; window.addEventListener("game-ready", () => { if (!done) { done = true; start(); } }, { once: true }); setTimeout(() => { if (!done) { done = true; start(); } }, 5000); }
  });
}
let transcriptRan = false;
function onEnter(i, fresh) {
  active = i;
  const s = SCENES[i];
  $$("[data-cap]").forEach((el) => el.classList.toggle("is-on", +el.dataset.cap === i));
  if (PROJECT(s)) {
    if (!save.found.includes(i)) { save.found.push(i); persist(); }
    const st = $(`[data-stop="${i}"]`); if (st) st.classList.add("is-found");
    if (fresh) { Sound.ding(); toast(`found ${s.label}`); }
  }
  document.title = s.title ? "henry. — " + s.title : "henry. — proud vibecoder, 14, Austin";
  stopCycle();
  if (s.tools) startCycle();
  if (s.transcript && !transcriptRan) { transcriptRan = true; typeTranscript(); }
  const total = SCENES.filter(PROJECT).length;
  if (!finished && save.found.length >= total) { finished = true; setTimeout(finish, 1400); }
}
function closeCap() { $$("[data-cap]").forEach((el) => el.classList.remove("is-on")); }
function onLeave(i) { $$("[data-cap]").forEach((el) => el.classList.remove("is-on")); active = -1; stopCycle(); document.title = "henry. — proud vibecoder, 14, Austin"; }
function onCoin(total) { Sound.coin(); save.coins = total; persist(); }
function onDog() { Sound.bark(); toast("you caught the dog"); save.dog = true; persist(); }
let lastHud = "";
function onTick(t) {
  Sound.engine(t.speed, t.boost);
  const m = Math.floor(t.playTime / 60), s = Math.floor(t.playTime % 60);
  const hud = `${t.found}/${t.total} stops · $${t.coins * 2} · ${m}:${String(s).padStart(2, "0")}`;
  if (hud !== lastHud) { lastHud = hud; $("[data-hud]").textContent = hud; }
  const mission = $("[data-mission]");
  const want = t.nearest >= 0 ? `find ${SCENES[t.nearest].label}` : t.dog ? "you found everything" : "find the dog";
  if (mission.textContent !== want) mission.textContent = want;
}
function toast(text) { const el = $("[data-toast]"); el.textContent = text; el.classList.add("is-on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("is-on"), 2200); }
function finish() {
  const t = game.stats();
  const m = Math.floor(t.playTime / 60), s = Math.floor(t.playTime % 60), time = `${m}:${String(s).padStart(2, "0")}`;
  if (!save.best || t.playTime < save.best) { save.best = t.playTime; persist(); }
  $("[data-end-stats]").textContent = `${time} · $${t.coins * 2} in coins · ${save.dog ? "dog caught" : "the dog got away"}`;
  $("[data-end]").classList.add("is-on"); setPaused(true, true);
}

/* ---------- input: keys and a touch joystick ---------- */
const keys = new Set();
function initInput() {
  const map = { ArrowUp: "u", w: "u", W: "u", ArrowDown: "d", s: "d", S: "d", ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r", " ": "b", Shift: "b" };
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "Escape" || e.key === "p" || e.key === "P") { if (started) setPaused(!paused); return; }
    if (!started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); startGame(); return; }
    const k = map[e.key]; if (!k) return; e.preventDefault(); keys.add(k);
  });
  document.addEventListener("keyup", (e) => { const k = map[e.key]; if (k) keys.delete(k); });
  window.addEventListener("blur", () => keys.clear());
  // joystick
  const stick = $("[data-stick]"), knob = $("[data-knob]"); let sid = null, sx = 0, sy = 0; const joy = { x: 0, y: 0 };
  document.addEventListener("pointerdown", (e) => { if (!started || paused || e.pointerType === "mouse" || e.target.closest("a, button, .cap, .stops, .nav, .brand")) return; sid = e.pointerId; sx = e.clientX; sy = e.clientY; stick.style.left = sx + "px"; stick.style.top = sy + "px"; stick.classList.add("is-on"); knob.style.transform = "translate(0,0)"; });
  document.addEventListener("pointermove", (e) => { if (e.pointerId !== sid) return; const dx = e.clientX - sx, dy = e.clientY - sy, len = Math.hypot(dx, dy), r = 56, k = Math.min(1, len / r); const nx = len ? dx / len : 0, ny = len ? dy / len : 0; joy.x = nx * k; joy.y = -ny * k; knob.style.transform = `translate(${nx * k * r}px, ${ny * k * r}px)`; });
  const endJoy = (e) => { if (e.pointerId !== sid) return; sid = null; joy.x = joy.y = 0; stick.classList.remove("is-on"); };
  document.addEventListener("pointerup", endJoy); document.addEventListener("pointercancel", endJoy);
  const boostBtn = $("[data-boost]"); let boosting = false;
  boostBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); boosting = true; boostBtn.classList.add("is-on"); });
  const boostOff = () => { boosting = false; boostBtn.classList.remove("is-on"); };
  boostBtn.addEventListener("pointerup", boostOff); boostBtn.addEventListener("pointercancel", boostOff); boostBtn.addEventListener("pointerleave", boostOff);
  const tick = () => {
    requestAnimationFrame(tick);
    if (!game || !started || paused) { if (game) game.input(0, 0, false); return; }
    let x = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0), z = (keys.has("u") ? 1 : 0) - (keys.has("d") ? 1 : 0);
    if (joy.x || joy.y) { x = joy.x; z = joy.y; }
    game.input(x, z, keys.has("b") || boosting);
  };
  tick();
}
function setPaused(v, keepOverlay) {
  paused = v;
  if (game) game.setPaused(v);
  if (!keepOverlay) $("[data-pause]").classList.toggle("is-on", v);
  if (Sound.ctx) { if (v) Sound.ctx.suspend(); else if (Sound.on) Sound.ctx.resume(); }
}
function startGame() {
  if (started) return;
  started = true; document.body.classList.add("is-playing");
  $("[data-title]").classList.add("is-off");
  if (game) game.start();
}

/* ---------- the stack: the crates take turns; hovering one holds it ---------- */
let cycleTimer = null, hotTool = null;
function showTool(slug) { const host = $("[data-tools]"); if (host) $$("[data-tool]", host).forEach((b) => b.classList.toggle("is-hot", b.dataset.tool === slug)); if (game) game.hotTool(slug); }
function startCycle() { stopCycle(); let k = 0; showTool(TOOLS[0]); cycleTimer = setInterval(() => { if (hotTool) return; k = (k + 1) % TOOLS.length; showTool(TOOLS[k]); }, 2600); }
function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; hotTool = null; showTool(null); }
function initTools() {
  const host = $("[data-tools]"); if (!host) return;
  host.addEventListener("mouseover", (e) => { const b = e.target.closest("[data-tool]"); if (b && b.dataset.tool !== hotTool) { hotTool = b.dataset.tool; showTool(hotTool); } });
  host.addEventListener("mouseleave", () => { hotTool = null; });
  host.addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (!b) return; hotTool = b.dataset.tool; showTool(hotTool); setTimeout(() => { if (hotTool === b.dataset.tool) hotTool = null; }, 2500); });
}
async function typeTranscript() {
  const tr = $("[data-transcript]"); if (!tr) return;
  for (const line of $$(".tr-line", tr)) {
    const t = line.querySelector(".tr-text"), text = t.dataset.text;
    line.classList.add("in");
    const caret = document.createElement("span"); caret.className = "tr-caret"; t.after(caret);
    for (let k = 1; k <= text.length; k++) { t.textContent = text.slice(0, k); await new Promise((r) => setTimeout(r, 20 + Math.random() * 28)); }
    caret.remove();
    await new Promise((r) => setTimeout(r, 380));
  }
}

/* ---------- sound ---------- */
const Sound = {
  on: false, ctx: null, master: null, eng: null, engGain: null, engFilter: null,
  ensure() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (this.ctx || !AC) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(); o1.type = "sawtooth"; o2.type = "triangle"; o1.frequency.value = 52; o2.frequency.value = 104;
    this.engFilter = this.ctx.createBiquadFilter(); this.engFilter.type = "lowpass"; this.engFilter.frequency.value = 220;
    this.engGain = this.ctx.createGain(); this.engGain.gain.value = 0;
    o1.connect(this.engFilter); o2.connect(this.engFilter); this.engFilter.connect(this.engGain).connect(this.master); o1.start(); o2.start(); this.eng = [o1, o2];
  },
  toggle(force) {
    this.on = force === undefined ? !this.on : !!force;
    if (this.on) this.ensure();
    if (this.ctx) { if (this.on && !paused) this.ctx.resume(); else this.ctx.suspend(); }
    $$("[data-sound]").forEach((btn) => { btn.setAttribute("aria-pressed", String(this.on)); btn.textContent = "sound: " + (this.on ? "on" : "off"); });
  },
  engine(speed, boost) {
    if (!this.on || !this.ctx) return;
    const s = Math.min(1, speed / 5), now = this.ctx.currentTime;
    this.engGain.gain.setTargetAtTime(0.012 + 0.05 * s + (boost ? 0.02 : 0), now, 0.08);
    this.eng[0].frequency.setTargetAtTime(48 + 80 * s + (boost ? 30 : 0), now, 0.1); this.eng[1].frequency.setTargetAtTime(96 + 160 * s + (boost ? 60 : 0), now, 0.1);
    this.engFilter.frequency.setTargetAtTime(200 + 600 * s, now, 0.1);
  },
  tone(f, g, dur, type = "sine", t0 = 0) { const now = this.ctx.currentTime + t0, o = this.ctx.createOscillator(), gg = this.ctx.createGain(); o.type = type; o.frequency.value = f; gg.gain.setValueAtTime(0.0001, now); gg.gain.exponentialRampToValueAtTime(g, now + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, now + dur); o.connect(gg).connect(this.master); o.start(now); o.stop(now + dur + 0.05); },
  ding() { if (!this.on || !this.ctx) return; this.tone(880, 0.05, 0.35); this.tone(1320, 0.03, 0.4, "sine", 0.06); },
  coin() { if (!this.on || !this.ctx) return; this.tone(1568, 0.04, 0.09, "square"); this.tone(2093, 0.04, 0.16, "square", 0.07); },
  bark() { if (!this.on || !this.ctx) return; this.tone(520, 0.06, 0.09, "sawtooth"); this.tone(700, 0.05, 0.12, "sawtooth", 0.11); },
};

/* ---------- boot ---------- */
async function boot() {
  renderCaptions(); initTools(); initInput();
  $$("[data-sound]").forEach((b) => b.addEventListener("click", () => Sound.toggle()));
  $("[data-start]").addEventListener("click", startGame);
  document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeCap(); });
  $("[data-resume]").addEventListener("click", () => setPaused(false));
  $("[data-keep]").addEventListener("click", () => { $("[data-end]").classList.remove("is-on"); setPaused(false); });
  $("[data-reset]").addEventListener("click", () => { try { localStorage.removeItem("henry-planet"); } catch (e) {} location.reload(); });
  $("[data-top]").addEventListener("click", (e) => { e.preventDefault(); if (started) setPaused(!paused); });
  document.body.classList.toggle("is-touch", touch);
  await initGame();
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  document.body.classList.add("is-ready");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
