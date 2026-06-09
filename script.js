/* =========================================================================
   Henry's deck — a portfolio dealt one card at a time.
   Scroll-driven (GSAP ScrollTrigger + Lenis), with a static fallback hand for
   no-JS / reduced-motion / small screens.  See styles.css for the card look.
   Live projects are dealt first.
   ========================================================================= */

const DUEL_TARGET = "i build things that move, think, dive, and ship";

const PROJECTS = [
  {
    rank: "A", suit: "♥", color: "red", suitName: "hearts",
    kicker: "voice ai · care",
    title: "Lily",
    tagline: "Morning check-ins for your parent",
    desc: "Calls my grandma in Arkansas — who has Alzheimer's — every morning, actually talks with her, then texts the family a short brief. Family can text back to steer tomorrow's call. Built on one rule: it never offers to do something it can't really do.",
    tags: ["React", "InsForge", "ElevenLabs", "Twilio"],
    live: "https://lily.insforge.site",
    repo: "https://github.com/henrybrewer00-dotcom/lily",
  },
  {
    rank: "K", suit: "♠", color: "black", suitName: "spades",
    kicker: "open source · video",
    title: "Glasscast",
    tagline: "Cinematic screen recordings. Zero editing.",
    desc: "A free, open-source Screen Studio that edits while you record: real 3D zoom with spring physics, auto-zoom on clicks, captions that write themselves, webcam bubbles, and cross-device sync. Bring your own AI keys.",
    tags: ["Electron", "TypeScript", "Whisper", "AGPLv3"],
    live: "https://glasscast.insforge.site",
    repo: "https://github.com/henrybrewer00-dotcom/Glasscast",
  },
  {
    rank: "Q", suit: "♦", color: "red", suitName: "diamonds",
    kicker: "voice ai · commerce",
    title: "Lily's Drive-Thru",
    tagline: "Talk to the window. Watch the kitchen react.",
    desc: "Pull up and order out loud. The AI attendant takes it, sizes it, upsells once, applies promo codes, and reads back a tax-aware total — then fires a live ticket to a kitchen display over SSE.",
    tags: ["ElevenLabs", "Express", "SSE"],
    repo: "https://github.com/henrybrewer00-dotcom/voice-drive-thru",
  },
  {
    rank: "J", suit: "♣", color: "black", suitName: "clubs",
    kicker: "ai · audio",
    title: "Eleven Mile",
    tagline: "Two AIs. One mic. Pick the smoke.",
    desc: "An AI rap-battle generator that writes the bars and spits them too. Pick two opponents and a topic — Claude writes the wordplay, ElevenLabs delivers it.",
    tags: ["Claude", "ElevenLabs"],
    repo: "https://github.com/henrybrewer00-dotcom/eleven-mile",
  },
  {
    rank: "10", suit: "♥", color: "red", suitName: "hearts",
    kicker: "accessibility",
    title: "PawBot",
    tagline: "A patient guide for first-time computer users",
    desc: "A hackathon build that helps seniors navigate a computer — gentle, step-by-step help for people who didn't grow up with one.",
    tags: ["Accessibility", "Assistive"],
    repo: "https://github.com/henrybrewer00-dotcom/PawBot",
  },
  {
    rank: "9", suit: "♠", color: "black", suitName: "spades",
    kicker: "robotics",
    title: "S.I.E.G.E.",
    tagline: "An autonomous robot car that chases dogs",
    desc: "I needed something to chase my dogs while I was busy building other things, so I built a compact autonomous car — sensors, steering logic, calibration, and a wiring job that looks worse than it works.",
    tags: ["Arduino", "Sensors", "C++"],
  },
  {
    rank: "8", suit: "♦", color: "red", suitName: "diamonds",
    kicker: "marine engineering",
    title: "ROV Submarine",
    tagline: "Engineering that survives real water",
    desc: "A small remotely-operated sub built like an engineering notebook: buoyancy, watertight seals, thrusters, and battery safety — all tested before the scary part.",
    tags: ["CAD", "Marine", "Physics"],
    status: "currently building",
  },
  {
    rank: "7", suit: "♣", color: "black", suitName: "clubs",
    kicker: "open source",
    title: "Open Source",
    tagline: "Patches to tools I actually use",
    desc: "Real pull requests to projects I rely on every day — OpenClaw, Ollama, Astro, Appwrite, and Grafana.",
    tags: ["OpenClaw", "Ollama", "Astro", "Appwrite", "Grafana"],
    repo: "https://github.com/henrybrewer00-dotcom?tab=repositories",
  },
  {
    rank: "JOKER", suit: "★", color: "gold", suitName: "joker",
    kicker: "the wild card",
    title: "Hire Henry",
    tagline: "13. Straight A's. 99.5 in math. 125 WPM.",
    desc: "I'm Henry — I build software, robots, and the occasional submarine. Want to work together? Beat me at typing first.",
    tags: ["Available", "Curious", "Fast"],
    repo: "https://github.com/henrybrewer00-dotcom",
    contact: { email: "henrybrewer00@gmail.com", phone: "925 962 7535" },
    duel: true,
  },
];

const N = PROJECTS.length;

/* ---------- build a single card element (back + face) ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function cardEl(p) {
  const el = document.createElement("article");
  el.className = "pc";
  el.dataset.color = p.color;
  el.dataset.suit = p.suitName;

  const index = `<b>${esc(p.rank)}</b><i>${esc(p.suit)}</i>`;

  const links = [];
  if (p.live) links.push(`<a class="pc__btn pc__btn--solid" href="${esc(p.live)}" target="_blank" rel="noreferrer">Live ↗</a>`);
  if (p.repo) links.push(`<a class="pc__btn" href="${esc(p.repo)}" target="_blank" rel="noreferrer">Code ↗</a>`);
  if (p.contact) {
    // the joker: a pre-filled "you're hired" email + github + call, instead of live/code
    links.length = 0;
    const mail =
      `mailto:${p.contact.email}` +
      `?subject=${encodeURIComponent("You're hired")}` +
      `&body=${encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n")}`;
    links.push(`<a class="pc__btn pc__btn--solid" href="${esc(mail)}">You're hired ↗</a>`);
    links.push(`<a class="pc__btn" href="${esc(p.repo)}" target="_blank" rel="noreferrer">GitHub ↗</a>`);
    links.push(`<a class="pc__btn" href="tel:${esc(p.contact.phone.replace(/\s+/g, ""))}">Call ↗</a>`);
  }

  const status = p.status
    ? `<p class="pc__status"><i aria-hidden="true"></i>${esc(p.status)}</p>`
    : "";

  const duel = p.duel
    ? `<div class="duel">
         <p class="duel__target">${esc(DUEL_TARGET)}</p>
         <input class="duel__input" type="text" spellcheck="false" autocomplete="off" placeholder="type it to challenge me" aria-label="typing challenge" />
         <p class="duel__result" aria-live="polite"></p>
       </div>`
    : "";

  el.innerHTML = `
    <div class="pc__inner">
      <div class="pc__face pc__back" aria-hidden="true"></div>
      <div class="pc__face pc__front">
        <span class="pc__index pc__index--tl" aria-hidden="true">${index}</span>
        <span class="pc__index pc__index--br" aria-hidden="true">${index}</span>
        <div class="pc__watermark" aria-hidden="true">${esc(p.suit)}</div>
        <div class="pc__content">
          <p class="pc__kicker">${esc(p.kicker)}</p>
          <h2 class="pc__title">${esc(p.title)}</h2>
          ${status}
          <p class="pc__tagline">${esc(p.tagline)}</p>
          <p class="pc__desc">${esc(p.desc)}</p>
          <div class="pc__tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          ${duel}
          <div class="pc__links">${links.join("")}</div>
        </div>
      </div>
    </div>`;
  return el;
}

/* ---------- joker typing duel ---------- */
function wireDuel(scope) {
  const inp = scope.querySelector(".duel__input");
  const res = scope.querySelector(".duel__result");
  if (!inp || !res) return;
  const target = DUEL_TARGET;
  let start = null;
  inp.addEventListener("keydown", (e) => {
    e.stopPropagation();                       // typing here must never scroll the deck
    if (start === null && e.key.length === 1) start = performance.now();
  });
  inp.addEventListener("input", () => {
    const v = inp.value.trim().toLowerCase();
    if (start === null && v.length > 0) start = performance.now();
    if (v === target) {
      const mins = (performance.now() - start) / 60000;
      const words = target.split(/\s+/).length;
      const wpm = Math.max(1, Math.round(words / mins));
      res.textContent = wpm >= 125 ? `${wpm} WPM — fine, you can hire me.` : `${wpm} WPM. Henry does 125. run it back?`;
    } else if (v.length === 0) {
      res.textContent = "";
    } else if (target.startsWith(v)) {
      res.textContent = `${target.length - v.length} to go…`;
    } else {
      res.textContent = "typo — match it exactly";
    }
  });
}

/* ---------- preload generated art (graceful if missing) ---------- */
function loadArt() {
  const back = new Image();
  back.onload = () => {
    document.documentElement.style.setProperty("--back-img", 'url("assets/card-back.webp")');
    document.querySelectorAll(".pc__back").forEach((b) => b.classList.add("has-art"));
  };
  back.src = "assets/card-back.webp";

  const table = new Image();
  table.onload = () => {
    const s = document.getElementById("stage");
    if (!s) return;
    s.style.backgroundImage =
      'linear-gradient(rgba(5,7,10,0.74), rgba(5,7,10,0.82)), url("assets/table.jpg")';
    s.style.backgroundSize = "cover";
    s.style.backgroundPosition = "center";
  };
  table.src = "assets/table.jpg";
}

/* ---------- math helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ========================================================================= */
/*  DECK MODE — the scroll-dealt experience                                  */
/* ========================================================================= */
const INTRO = 0.55;          // units of "hold" before the first card deals
const DEAL = 0.4;            // fraction of a unit spent flying out + flipping
const LEAVE = 0.42;          // fraction spent gliding to the tableau
const ACTIVE_S = 1.1;        // active card scale
const FAN_S = 0.46;          // parked card scale
const MAX_POS = N - 1 + 0.72;
const TOTAL_UNITS = MAX_POS + INTRO;

function initDeck() {
  document.body.classList.add("deck-mode");

  const stage = document.getElementById("stage");
  const deck = document.getElementById("deck");
  const intro = document.getElementById("intro");
  const hud = document.getElementById("hud");
  const hudNum = document.getElementById("hudNum");
  const hudName = document.getElementById("hudName");
  const hudBar = document.getElementById("hudBar");
  document.getElementById("hudTotal").textContent = String(N).padStart(2, "0");

  const cards = PROJECTS.map((p) => {
    const el = cardEl(p);
    deck.appendChild(el);
    return el;
  });
  cards.forEach((el) => {
    if (el.querySelector(".duel")) wireDuel(el);
    el.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => e.stopPropagation()));
  });
  const inners = cards.map((c) => c.querySelector(".pc__inner"));

  // jaunty resting angle per card (deterministic)
  const jitter = PROJECTS.map((_, i) => ((i * 37) % 7) - 3);

  // geometry, recomputed on refresh/resize
  const G = {};
  function measure() {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    G.deckX = W * 0.24;
    G.deckY = -H * 0.04;
    G.deckRot = -4;
    G.activeX = 0;
    G.activeY = H * 0.05;
    G.tableauY = H * 0.34;
    G.arc = H * 0.06;
    G.gapX = Math.min(W * 0.085, 64);
    G.mid = (N - 1) / 2;
  }
  const fanX = (i) => (i - G.mid) * G.gapX;
  const fanRot = (i) => (i - G.mid) * 4.2;
  const fanY = (i) => G.tableauY + Math.abs(i - G.mid) * 4;

  function render(prog) {
    const pos = -INTRO + prog * TOTAL_UNITS;

    for (let i = 0; i < N; i++) {
      const d = pos - i;
      let x, y, rot, s, flip, z;
      const faceUp = d > DEAL; // dealt + flipped face-up → clickable + focusable

      if (d <= 0) {                              // resting in the deck
        const depth = -d;
        x = G.deckX - depth * 0.6;
        y = G.deckY - depth * 0.8;
        rot = G.deckRot + jitter[i];
        s = 1;
        flip = 0;
        z = Math.round(240 - depth);
      } else if (d <= DEAL) {                    // dealing out + flipping
        const t = d / DEAL;
        const e = easeOutCubic(t);
        x = lerp(G.deckX, G.activeX, e);
        y = lerp(G.deckY, G.activeY, e) - G.arc * Math.sin(Math.PI * e);
        rot = lerp(G.deckRot + jitter[i], 0, e);
        s = lerp(1, ACTIVE_S, e);
        flip = 180 * easeInOut(clamp(t * 1.05));
        z = 340;
      } else if (d <= 1) {                       // sitting centre, readable
        x = G.activeX; y = G.activeY; rot = 0; s = ACTIVE_S; flip = 180; z = 340;
      } else if (d <= 1 + LEAVE) {               // gliding to the tableau
        const t = (d - 1) / LEAVE;
        const e = easeInOut(t);
        x = lerp(G.activeX, fanX(i), e);
        y = lerp(G.activeY, fanY(i), e);
        rot = lerp(0, fanRot(i), e);
        s = lerp(ACTIVE_S, FAN_S, e);
        flip = 180;
        z = 300 - i;
      } else {                                   // parked in the fanned hand
        x = fanX(i); y = fanY(i); rot = fanRot(i); s = FAN_S; flip = 180;
        z = 150 + i;
      }

      const el = cards[i];
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      el.style.zIndex = String(z);
      // keep every dealt card clickable (active + fanned hand); hide face-down/dealing cards from mouse + keyboard + AT
      el.style.pointerEvents = faceUp ? "auto" : "none";
      el.inert = !faceUp;
      inners[i].style.transform = `rotateY(${flip.toFixed(1)}deg)`;  // 0 = back, 180 = face
    }

    // intro fades out exactly as the first card begins to deal (pos -> 0)
    const introT = clamp((pos + INTRO) / INTRO);
    intro.style.opacity = String(1 - introT);
    intro.style.transform = `translateY(${(-introT * 26).toFixed(1)}px)`;

    // HUD names the card currently centred (window pos in (i+DEAL, i+1+DEAL])
    const dealt = pos > 0;
    hud.classList.toggle("is-on", dealt);
    const cur = clamp(Math.floor(pos - DEAL), 0, N - 1);
    hudNum.textContent = dealt ? String(cur + 1).padStart(2, "0") : "00";
    hudName.textContent = dealt ? PROJECTS[cur].title : "the deck";
    hudBar.style.width = `${(clamp(prog) * 100).toFixed(1)}%`;
  }

  // smooth scroll
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  measure();
  render(0);

  ScrollTrigger.create({
    trigger: stage,
    start: "top top",
    end: () => "+=" + window.innerHeight * TOTAL_UNITS * 0.9,
    pin: stage,
    scrub: 0.6,
    invalidateOnRefresh: true,
    // settle each card dead-centre so casual / fast scrollers always land one readable
    snap: {
      snapTo: (value) => {
        const pos = -INTRO + value * TOTAL_UNITS;
        const rawI = Math.round(pos - 0.85);
        if (rawI < 0) return 0;                 // rest on the intro / undealt deck near the top
        const i = clamp(rawI, 0, N - 1);
        return clamp((i + 0.85 + INTRO) / TOTAL_UNITS, 0, 1);
      },
      duration: { min: 0.15, max: 0.4 },
      delay: 0.06,
      ease: "power1.inOut",
    },
    onRefresh: (self) => { measure(); render(self.progress); },
    onUpdate: (self) => render(self.progress),
  });

  // expose for debugging
  window.__deck = { render, measure, lenis };
}

/* ========================================================================= */
/*  STATIC MODE — the whole hand, laid out and readable                      */
/* ========================================================================= */
function initStatic() {
  document.body.classList.add("static-mode");

  const grid = document.getElementById("fallbackGrid");
  const els = PROJECTS.map((p) => {
    const el = cardEl(p);
    grid.appendChild(el);
    return el;
  });
  els.forEach((el) => { if (el.querySelector(".duel")) wireDuel(el); });

  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }
}

/* ========================================================================= */
function boot() {
  loadArt();
  const libs = window.gsap && window.ScrollTrigger && window.Lenis;
  if (libs) gsap.registerPlugin(ScrollTrigger);

  const mqSmall = matchMedia("(max-width: 820px)");
  const mqMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const wantStatic = mqSmall.matches || mqMotion.matches || !libs;

  if (!wantStatic) {
    try { initDeck(); }
    catch (err) { console.error("deck init failed, falling back", err); document.body.classList.remove("deck-mode"); initStatic(); }
  } else {
    initStatic();
  }

  // if the user crosses the breakpoint or toggles reduced-motion after load, re-pick the mode
  const reeval = () => {
    const nowStatic = mqSmall.matches || mqMotion.matches || !libs;
    if (nowStatic !== wantStatic) location.reload();
  };
  mqSmall.addEventListener("change", reeval);
  mqMotion.addEventListener("change", reeval);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
