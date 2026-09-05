/* =========================================================================
   Henry's deck — a portfolio dealt one card at a time.
   Scroll-driven (GSAP ScrollTrigger + Lenis), or tap a card to jump to it.
   Static fallback hand for no-JS / reduced-motion / small screens.
   ========================================================================= */

const DUEL_TARGET = "henry builds robots software and one weird submarine";

const PROJECTS = [
  {
    rank: "A", suit: "♠", color: "black", suitName: "spades",
    kicker: "founder · ai visibility",
    title: "SiteLight",
    tagline: "Are you visible to AI?",
    desc: "The company I founded. SiteLight checks whether AI assistants actually recommend your local business when someone asks — \"best tacos near me,\" \"a POS for restaurants\" — and shows which competitors get named instead. Then it hands you a concrete, honest to-do list to become the answer: Google Business Profile, real reviews, an llms.txt file, FAQ + LocalBusiness schema, and a presence where AI reads, like Reddit and Quora. It's a **one-time $2 fee** — no subscription.",
    tags: ["Founder", "AI Visibility", "GEO", "$2 one-time"],
    live: "https://sitelight.xyz",
    status: "founded & growing",
  },
  {
    rank: "A", suit: "♥", color: "red", suitName: "hearts",
    kicker: "voice ai",
    title: "Lily",
    tagline: "It calls my grandma every morning",
    desc: "My grandma in Arkansas has Alzheimer's, so I built something that phones her every morning and actually has a conversation with her. Afterward it texts the family how she sounded, and we can text back to tell it what to bring up next time. The one rule I gave it: never promise something it can't actually do.",
    tags: ["React", "InsForge", "ElevenLabs", "Twilio"],
    live: "https://lily.insforge.site",
    repo: "https://github.com/henrybrewer00-dotcom/lily",
    video: "../assets/lily-demo.mp4",
    poster: "../assets/lily-demo-poster.jpg",
    award: "Built at the a16z × Cursor hackathon — won 1st place. This is my on-stage demo, in front of 150 people.",
  },
  {
    rank: "K", suit: "♠", color: "black", suitName: "spades",
    kicker: "open source",
    title: "Glasscast",
    tagline: "Cinematic recordings, zero editing",
    desc: "Screen Studio costs money, so I made a free one. Glasscast records your screen and does the editing as you go: 3D zooms that move like a real camera, auto-zoom wherever you click, captions it writes for you, and a webcam bubble. You bring your own AI keys, so there's nothing to pay for.",
    tags: ["Electron", "TypeScript", "Whisper", "AGPLv3"],
    repo: "https://github.com/henrybrewer00-dotcom/Glasscast",
  },
  {
    rank: "Q", suit: "♦", color: "red", suitName: "diamonds",
    kicker: "voice ai",
    title: "Lily's Drive-Thru",
    tagline: "Order out loud, watch the kitchen react",
    desc: "You order out loud like you're at a real drive-thru. The AI window attendant takes it, asks about sizes, tries to upsell you once, takes promo codes, and reads the total back with tax. When you're done it sends a live ticket to a kitchen screen so the cooks can keep up.",
    tags: ["ElevenLabs", "Express", "SSE"],
    repo: "https://github.com/henrybrewer00-dotcom/voice-drive-thru",
  },
  {
    rank: "J", suit: "♣", color: "black", suitName: "clubs",
    kicker: "ai + audio",
    title: "Eleven Mile",
    tagline: "Two AIs, one mic",
    desc: "Pick two people and a topic and watch them rap-battle. Claude writes the bars and ElevenLabs actually raps them out loud. It's a little dumb and I love it.",
    tags: ["Claude", "ElevenLabs"],
    repo: "https://github.com/henrybrewer00-dotcom/eleven-mile",
  },
  {
    rank: "10", suit: "♥", color: "red", suitName: "hearts",
    kicker: "accessibility",
    title: "PawBot",
    tagline: "For people who didn't grow up with computers",
    desc: "A hackathon project that helps older people use a computer without feeling dumb about it. It walks them through things one step at a time, kind of like how you'd help your grandparent figure out their email.",
    tags: ["Accessibility", "Assistive"],
    repo: "https://github.com/henrybrewer00-dotcom/PawBot",
  },
  {
    rank: "9", suit: "♠", color: "black", suitName: "spades",
    kicker: "robotics",
    title: "S.I.E.G.E.",
    tagline: "A self-driving car that chases my dogs",
    desc: "I wanted something to chase my dogs around while I was busy with other stuff, so I built a little self-driving car. Sensors, steering logic, a lot of calibration, and wiring that looks way worse than it actually works.",
    tags: ["Arduino", "Sensors", "C++"],
  },
  {
    rank: "8", suit: "♦", color: "red", suitName: "diamonds",
    kicker: "hardware",
    title: "ROV Submarine",
    tagline: "Trying to build something that survives real water",
    desc: "A little remote-controlled submarine I'm building right now. Most of the work is the unglamorous part: keeping it watertight, getting the buoyancy right, and making sure the battery won't do anything scary underwater.",
    tags: ["CAD", "Marine", "Physics"],
    status: "currently building",
  },
  {
    rank: "7", suit: "♣", color: "black", suitName: "clubs",
    kicker: "open source",
    title: "Open Source",
    tagline: "Fixing the tools I use",
    desc: "Real, merged pull requests to projects I use all the time: OpenClaw, Ollama, Astro, Appwrite, and Grafana. Mostly small fixes, but they're shipped and people actually run them.",
    tags: ["OpenClaw", "Ollama", "Astro", "Appwrite", "Grafana"],
    repo: "https://github.com/henrybrewer00-dotcom?tab=repositories",
  },
  {
    rank: "JOKER", suit: "★", color: "gold", suitName: "joker",
    kicker: "the wild card",
    title: "Hire Henry",
    tagline: "14. straight A's. 99.5 in math. 125 wpm.",
    desc: "I'm Henry. I'm 14, I build software and robots, and I type fast. If you want to work together the email button is right there. You just have to out-type me first.",
    tags: ["Available", "Curious", "Fast"],
    repo: "https://github.com/henrybrewer00-dotcom",
    contact: { email: "henrybrewer00@gmail.com", phone: "925 962 7535" },
    book: "https://book.insforge.site",
    duel: true,
  },
];

const N = PROJECTS.length;

/* ---------- build a single card element (back + face) ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

// escape first, then turn **bold** markers into <strong> (safe: content already escaped)
function fmt(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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
    if (p.book) links.push(`<a class="pc__btn" href="${esc(p.book)}" target="_blank" rel="noreferrer">Book a call ↗</a>`);
    links.push(`<a class="pc__btn" href="${esc(p.repo)}" target="_blank" rel="noreferrer">GitHub ↗</a>`);
  }

  const status = p.status
    ? `<p class="pc__status"><i aria-hidden="true"></i>${esc(p.status)}</p>`
    : "";

  // optional demo video: a poster thumbnail that opens the lightbox, + an award caption
  const video = p.video
    ? `<button type="button" class="pc__video" data-video="${esc(p.video)}" data-poster="${esc(p.poster || "")}" data-title="${esc(p.title + " — on-stage demo")}" aria-label="Play the ${esc(p.title)} demo video">
         <img class="pc__video-thumb" src="${esc(p.poster || "")}" alt="" loading="lazy" />
         <span class="pc__video-play" aria-hidden="true"></span>
       </button>
       ${p.award ? `<p class="pc__award">${esc(p.award)}</p>` : ""}`
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
          ${video}
          <p class="pc__desc">${fmt(p.desc)}</p>
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
    document.documentElement.style.setProperty("--back-img", 'url("../assets/card-back.webp")');
    document.querySelectorAll(".pc__back").forEach((b) => b.classList.add("has-art"));
  };
  back.src = "../assets/card-back.webp";

  const table = new Image();
  table.onload = () => {
    const s = document.getElementById("stage");
    if (!s) return;
    s.style.backgroundImage =
      'linear-gradient(rgba(5,7,10,0.74), rgba(5,7,10,0.82)), url("../assets/table.jpg")';
    s.style.backgroundSize = "cover";
    s.style.backgroundPosition = "center";
  };
  table.src = "../assets/table.jpg";
}

/* ---------- shared video lightbox ---------- */
function initLightbox() {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML = `
    <div class="lightbox__backdrop" data-close></div>
    <div class="lightbox__panel" role="dialog" aria-modal="true" aria-label="Demo video">
      <button type="button" class="lightbox__close" data-close aria-label="Close video">✕</button>
      <p class="lightbox__title"></p>
      <video class="lightbox__video" controls playsinline preload="none"></video>
    </div>`;
  document.body.appendChild(box);

  const vid = box.querySelector(".lightbox__video");
  const title = box.querySelector(".lightbox__title");

  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    vid.pause();
    vid.removeAttribute("src");
    vid.load();
  }
  function open(src, poster, label) {
    title.textContent = label || "";
    if (poster) vid.poster = poster;
    vid.src = src;
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    const play = vid.play();
    if (play && play.catch) play.catch(() => {});
  }

  box.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });

  // any card's video button opens the lightbox (works in deck + static modes)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".pc__video");
    if (!btn) return;
    e.stopPropagation();
    open(btn.dataset.video, btn.dataset.poster, btn.dataset.title);
  });
}

/* ---------- magnified card preview (full-house tap) ---------- */
function initPreview() {
  const overlay = document.createElement("div");
  overlay.className = "preview";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="preview__backdrop" data-close></div>
    <button type="button" class="preview__close" data-close aria-label="Close preview">✕</button>
    <div class="preview__stage">
      <div class="preview__card" id="previewCard"></div>
    </div>`;
  document.body.appendChild(overlay);

  const host = overlay.querySelector("#previewCard");
  let open = false;

  function close() {
    if (!open) return;
    open = false;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    host.innerHTML = "";
  }

  function show(project, originRect) {
    const card = cardEl(project);
    card.classList.add("pc--preview");
    host.innerHTML = "";
    host.appendChild(card);
    const inner = card.querySelector(".pc__inner");
    if (inner) inner.style.transform = "rotateY(180deg)";       // show the face
    card.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => e.stopPropagation()));
    if (card.querySelector(".duel")) wireDuel(card);

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    open = true;

    // FLIP: start the big card at the tapped card's place + size, then settle to centre
    const fr = host.getBoundingClientRect();
    if (originRect && fr.width) {
      const dx = (originRect.left + originRect.width / 2) - (fr.left + fr.width / 2);
      const dy = (originRect.top + originRect.height / 2) - (fr.top + fr.height / 2);
      const sx = originRect.width / fr.width;
      host.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx.toFixed(3)})`, opacity: 0.55 },
          { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        ],
        { duration: 560, easing: "cubic-bezier(.2,.85,.25,1)" }
      );
    }
  }

  overlay.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) close(); });

  return { show, close, get isOpen() { return open; } };
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
const END_HOLD = 0.5;        // extra scroll past the last card so the full house can breathe
// the last card fully fans out (1 + LEAVE), then we hold on the finished hand
const MAX_POS = N - 1 + 1 + LEAVE + END_HOLD;
const TOTAL_UNITS = MAX_POS + INTRO;

// progress at which card i sits dead-centre (also the snap target)
const progForCard = (i) => clamp((clamp(i, 0, N - 1) + 0.85 + INTRO) / TOTAL_UNITS, 0, 1);

function initDeck() {
  document.body.classList.add("deck-mode");

  const stage = document.getElementById("stage");
  const deck = document.getElementById("deck");
  const intro = document.getElementById("intro");
  const hud = document.getElementById("hud");
  const hudNum = document.getElementById("hudNum");
  const hudName = document.getElementById("hudName");
  const hudBar = document.getElementById("hudBar");
  const deckEnd = document.getElementById("deckEnd");
  document.getElementById("hudTotal").textContent = String(N).padStart(2, "0");

  let st = null;
  let lenis = null;
  let activeIndex = 0;
  let atEnd = false;
  const preview = initPreview();

  // tap a card to bring it to centre (tap the active one to advance)
  function goToCard(i) {
    if (!st) return;
    i = clamp(i, 0, N - 1);
    const y = st.start + progForCard(i) * (st.end - st.start);
    if (lenis && lenis.scrollTo) lenis.scrollTo(y, { duration: 0.8 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }

  const cards = PROJECTS.map((p) => {
    const el = cardEl(p);
    deck.appendChild(el);
    return el;
  });
  const inners = cards.map((c) => c.querySelector(".pc__inner"));
  const focusables = cards.map((c) => Array.from(c.querySelectorAll("a, input")));

  cards.forEach((el, i) => {
    if (el.querySelector(".duel")) wireDuel(el);
    // links open normally; don't let their click bubble to the card-nav handler
    el.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => e.stopPropagation()));
    // tap the card body → jump to it (or advance if it's already centred).
    // once the whole hand is dealt (full house), a tap magnifies that one card instead.
    el.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input")) return;
      if (atEnd) { preview.show(PROJECTS[i], el.getBoundingClientRect()); return; }
      goToCard(i === activeIndex ? i + 1 : i);
    });
  });

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
      const faceUp = d > DEAL; // dealt + flipped face-up → readable + keyboard-focusable

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
      el.style.pointerEvents = "auto"; // every card is tappable (scroll still drives the deal)
      inners[i].style.transform = `rotateY(${flip.toFixed(1)}deg)`; // 0 = back, 180 = face
      // keep face-down / dealing cards' links out of the keyboard tab order
      focusables[i].forEach((f) => { f.tabIndex = faceUp ? 0 : -1; });
    }

    // intro fades out exactly as the first card begins to deal (pos -> 0)
    const introT = clamp((pos + INTRO) / INTRO);
    intro.style.opacity = String(1 - introT);
    intro.style.transform = `translateY(${(-introT * 26).toFixed(1)}px)`;

    // HUD names the card currently centred
    const dealt = pos > 0;
    const centered = clamp(Math.floor(pos - DEAL), 0, N - 1);
    // a card only counts as "active" (tap = advance) once it's actually centred —
    // otherwise the first tap on the resting deck would skip card 1 and deal card 2
    activeIndex = pos > DEAL ? centered : -1;
    hud.classList.toggle("is-on", dealt);
    hudNum.textContent = dealt ? String(centered + 1).padStart(2, "0") : "00";
    hudName.textContent = dealt ? PROJECTS[centered].title : "the deck";
    hudBar.style.width = `${(clamp(prog) * 100).toFixed(1)}%`;

    // "full house" — grows in as the last card fans out, big on the finished hand
    if (deckEnd) {
      const endT = easeInOut(clamp((pos - N) / (MAX_POS - N)));
      deckEnd.style.opacity = String(endT);
      deckEnd.style.transform = `translate(-50%, ${lerp(26, 0, endT).toFixed(1)}px) scale(${lerp(0.9, 1, endT).toFixed(3)})`;
      deckEnd.style.pointerEvents = endT > 0.5 ? "auto" : "none";
      // once the hand is laid out, tapping a card opens it as a magnified preview
      atEnd = endT > 0.5;
      deckEnd.classList.toggle("is-on", atEnd);
    }
  }

  // smooth scroll
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  measure();
  render(0);

  st = ScrollTrigger.create({
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
        if (rawI >= N) return 1;                // rest on the full-house finish
        return progForCard(rawI);
      },
      duration: { min: 0.15, max: 0.4 },
      delay: 0.06,
      ease: "power1.inOut",
    },
    onRefresh: (self) => { measure(); render(self.progress); },
    onUpdate: (self) => render(self.progress),
  });

  // expose for debugging
  window.__deck = { render, measure, goToCard, get lenis() { return lenis; }, get st() { return st; } };
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
  initLightbox();
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
