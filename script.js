/* =========================================================================
   Henry's deck — portfolio dealt one card at a time.
   ========================================================================= */

let PROJECTS = [];
let DUEL_TARGET = "";
let SITE = {};
let INTRO_COPY = {};
let N = 0;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const INTRO = 0.55;
const DEAL = 0.4;
const LEAVE = 0.42;
const ACTIVE_S = 1.1;
const FAN_S = 0.46;
const END_HOLD = 0.5;

let scrollCfg = null;
function buildScrollCfg() {
  const MAX_POS = N - 1 + 1 + LEAVE + END_HOLD;
  const TOTAL_UNITS = MAX_POS + INTRO;
  return {
    MAX_POS,
    TOTAL_UNITS,
    progForCard: (i) => clamp((clamp(i, 0, N - 1) + 0.85 + INTRO) / TOTAL_UNITS, 0, 1),
  };
}

/* ---------- analytics stub (wire to Plausible/Umami via window.HENRY_ANALYTICS) --- */
function track(event, detail = {}) {
  if (typeof window.HENRY_ANALYTICS === "function") window.HENRY_ANALYTICS(event, detail);
  if (new URLSearchParams(location.search).has("debug")) console.info("[track]", event, detail);
}

/* ---------- focus trap for modals ---------- */
function trapFocus(container, onEscape) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';
  let prev = null;

  function focusables() {
    return [...container.querySelectorAll(sel)].filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); onEscape(); return; }
    if (e.key !== "Tab") return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  return {
    activate(returnTo) {
      prev = returnTo || document.activeElement;
      document.addEventListener("keydown", onKey);
      const list = focusables();
      (list[0] || container).focus?.();
    },
    deactivate() {
      document.removeEventListener("keydown", onKey);
      if (prev && prev.focus) prev.focus({ preventScroll: true });
      prev = null;
    },
  };
}

/* ---------- sounds (muted by default) ---------- */
const sounds = (() => {
  let ctx = null;
  let on = localStorage.getItem("henry-sound") === "1";

  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, dur, vol = 0.04) {
    if (!on) return;
    try {
      const c = ensure();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch (_) { /* no audio */ }
  }

  return {
    get enabled() { return on; },
    toggle() {
      on = !on;
      localStorage.setItem("henry-sound", on ? "1" : "0");
      if (on) tone(440, 0.08);
      return on;
    },
    deal() { tone(320, 0.06, 0.03); },
    flip() { tone(520, 0.05, 0.025); },
    fullHouse() { tone(660, 0.12, 0.05); setTimeout(() => tone(880, 0.15, 0.04), 80); },
  };
})();

/* ---------- escape / format ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function fmt(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function slugIndex(slug) {
  if (!slug) return -1;
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i >= 0) return i;
  const m = String(slug).match(/^card-(\d+)$/);
  if (m) return clamp(parseInt(m[1], 10) - 1, 0, N - 1);
  return -1;
}

/* ---------- intro from shared template ---------- */
function fillIntro() {
  const tpl = document.getElementById("intro-template");
  if (!tpl) return;
  const deckIntro = document.getElementById("intro");
  const fallbackHero = document.querySelector(".fallback__hero");
  if (deckIntro) {
    deckIntro.querySelector(".intro__kicker").textContent = INTRO_COPY.kicker;
    deckIntro.querySelector(".intro__title").innerHTML = INTRO_COPY.title;
    deckIntro.querySelector(".intro__sub").textContent = `${INTRO_COPY.sub} Scroll to deal the hand.`;
    deckIntro.querySelector(".intro__hint").innerHTML = `${esc(INTRO_COPY.hintDeck)} <span class="intro__arrow" aria-hidden="true">↓</span>`;
  }
  if (fallbackHero) {
    fallbackHero.querySelector(".fallback__kicker").textContent = INTRO_COPY.kicker;
    fallbackHero.querySelector("h1").innerHTML = INTRO_COPY.title;
    fallbackHero.querySelector(".fallback__sub").textContent = `${INTRO_COPY.sub} ${INTRO_COPY.hintStatic}`;
  }
  const countEls = document.querySelectorAll("[data-card-count]");
  countEls.forEach((el) => { el.textContent = String(N); });
  document.getElementById("hudTotal").textContent = String(N).padStart(2, "0");
}

/* ---------- card element ---------- */
function cardEl(p) {
  const el = document.createElement("article");
  el.className = "pc";
  el.id = p.slug;
  el.dataset.color = p.color;
  el.dataset.suit = p.suitName;
  el.dataset.slug = p.slug;

  const index = `<b>${esc(p.rank)}</b><i>${esc(p.suit)}</i>`;
  const links = [];

  if (p.live) links.push(`<a class="pc__btn pc__btn--solid" href="${esc(p.live)}" target="_blank" rel="noreferrer">Live ↗</a>`);
  if (p.repo && !p.contact) links.push(`<a class="pc__btn" href="${esc(p.repo)}" target="_blank" rel="noreferrer">Code ↗</a>`);
  if (p.contact) {
    links.length = 0;
    const mail =
      `mailto:${p.contact.email}` +
      `?subject=${encodeURIComponent("You're hired")}` +
      `&body=${encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n")}`;
    links.push(`<a class="pc__btn pc__btn--solid" href="${esc(mail)}">You're hired ↗</a>`);
    if (p.book) links.push(`<a class="pc__btn" href="${esc(p.book)}" target="_blank" rel="noreferrer">Book a call ↗</a>`);
    if (p.contact.phone) {
      const tel = p.contact.phone.replace(/\D/g, "");
      links.push(`<a class="pc__btn" href="tel:+1${esc(tel)}">Call ↗</a>`);
    }
    links.push(`<a class="pc__btn" href="${esc(p.repo)}" target="_blank" rel="noreferrer">GitHub ↗</a>`);
  }

  const status = p.status ? `<p class="pc__status"><i aria-hidden="true"></i>${esc(p.status)}</p>` : "";

  const video = p.video
    ? `<button type="button" class="pc__video" data-video="${esc(p.video)}" data-poster="${esc(p.poster || "")}" data-title="${esc(p.title + " — on-stage demo")}" aria-label="Play the ${esc(p.title)} demo video">
         <img class="pc__video-thumb" src="${esc(p.poster || "")}" alt="" loading="lazy" decoding="async" />
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

  const longDesc = p.desc.length > 200;
  const descHtml = longDesc
    ? `<div class="pc__desc-wrap">
         <p class="pc__desc pc__desc--clamp">${fmt(p.desc)}</p>
         <button type="button" class="pc__read-more" aria-expanded="false">Read more</button>
       </div>`
    : `<p class="pc__desc">${fmt(p.desc)}</p>`;

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
          ${descHtml}
          <div class="pc__tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          ${duel}
          <div class="pc__links">${links.join("")}</div>
        </div>
      </div>
    </div>`;

  const readMore = el.querySelector(".pc__read-more");
  if (readMore) {
    readMore.addEventListener("click", (e) => {
      e.stopPropagation();
      const desc = el.querySelector(".pc__desc");
      const open = desc.classList.toggle("pc__desc--clamp");
      readMore.setAttribute("aria-expanded", open ? "false" : "true");
      readMore.textContent = open ? "Read more" : "Read less";
    });
  }
  return el;
}

function wireCardLinks(el) {
  el.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => e.stopPropagation()));
}

function wireDuel(scope) {
  const inp = scope.querySelector(".duel__input");
  const res = scope.querySelector(".duel__result");
  if (!inp || !res) return;
  const target = DUEL_TARGET;
  let start = null;
  inp.addEventListener("keydown", (e) => {
    e.stopPropagation();
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
      track("duel_complete", { wpm });
    } else if (v.length === 0) {
      res.textContent = "";
    } else if (target.startsWith(v)) {
      res.textContent = `${target.length - v.length} to go…`;
    } else {
      res.textContent = "typo — match it exactly";
    }
  });
}

/* ---------- preload art ---------- */
function loadArt() {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = "assets/card-back.webp";
  document.head.appendChild(link);

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
    s.style.backgroundImage = 'linear-gradient(rgba(5,7,10,0.74), rgba(5,7,10,0.82)), url("assets/table.jpg")';
    s.style.backgroundSize = "cover";
    s.style.backgroundPosition = "center";
  };
  table.src = "assets/table.jpg";
}

/* ---------- lazy video preload when card is active ---------- */
const videoPreloaded = new Set();
function preloadVideoForProject(p) {
  if (!p?.video || videoPreloaded.has(p.video)) return;
  videoPreloaded.add(p.video);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "video";
  link.href = p.video;
  document.head.appendChild(link);
}

/* ---------- OG / meta per card ---------- */
function updateCardMeta(index) {
  if (index < 0 || index >= N) return;
  const p = PROJECTS[index];
  const title = `${p.title} — Henry`;
  const desc = p.tagline;
  document.title = title;
  const setMeta = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute("content", val); };
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', desc);
  setMeta('meta[name="description"]', desc);
}

/* ---------- deep linking ---------- */
let goToCardRef = null;
let hashNavigating = false;

function setHashForCard(i) {
  if (hashNavigating || i < 0 || i >= N) return;
  const slug = PROJECTS[i].slug;
  if (location.hash !== `#${slug}`) history.replaceState(null, "", `#${slug}`);
}

function handleHashNavigate() {
  const i = slugIndex(location.hash.slice(1));
  if (i >= 0 && goToCardRef) {
    hashNavigating = true;
    goToCardRef(i);
    updateCardMeta(i);
    track("card_deep_link", { slug: PROJECTS[i].slug });
    setTimeout(() => { hashNavigating = false; }, 900);
  }
}

/* ---------- progress pips ---------- */
function buildPips(container, onPipClick) {
  container.innerHTML = "";
  PROJECTS.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pips__pip";
    btn.dataset.index = String(i);
    btn.setAttribute("aria-label", `Go to ${p.title}`);
    btn.innerHTML = `<span aria-hidden="true">${esc(p.suit)}</span>`;
    btn.addEventListener("click", () => onPipClick(i));
    container.appendChild(btn);
  });
  return (active) => {
    container.querySelectorAll(".pips__pip").forEach((pip, i) => {
      pip.classList.toggle("is-active", i === active);
      pip.setAttribute("aria-current", i === active ? "true" : "false");
    });
  };
}

/* ---------- lightbox ---------- */
let lightboxTrap = null;
let lightboxOpen = false;

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
  const panel = box.querySelector(".lightbox__panel");
  let returnFocus = null;

  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    lightboxOpen = false;
    document.body.classList.remove("modal-open");
    vid.pause();
    vid.removeAttribute("src");
    vid.load();
    lightboxTrap?.deactivate();
    lightboxTrap = null;
  }

  function open(src, poster, label, from) {
    returnFocus = from;
    title.textContent = label || "";
    if (poster) vid.poster = poster;
    vid.src = src;
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    lightboxOpen = true;
    document.body.classList.add("modal-open");
    lightboxTrap = trapFocus(panel, close);
    lightboxTrap.activate(returnFocus);
    const play = vid.play();
    if (play?.catch) play.catch(() => {});
    track("video_open", { src });
  }

  box.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".pc__video");
    if (!btn) return;
    e.stopPropagation();
    open(btn.dataset.video, btn.dataset.poster, btn.dataset.title, btn);
  });

  return { close, get isOpen() { return lightboxOpen; } };
}

/* ---------- preview overlay (deck full-house + static mode) ---------- */
let previewApi = null;

function initPreview() {
  const overlay = document.createElement("div");
  overlay.className = "preview";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="preview__backdrop" data-close></div>
    <button type="button" class="preview__close" data-close aria-label="Close preview">✕</button>
    <div class="preview__stage">
      <div class="preview__card" id="previewCard" tabindex="-1"></div>
    </div>`;
  document.body.appendChild(overlay);

  const host = overlay.querySelector("#previewCard");
  const closeBtn = overlay.querySelector(".preview__close");
  let open = false;
  let trap = null;
  let returnFocus = null;

  function close() {
    if (!open) return;
    open = false;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    host.innerHTML = "";
    trap?.deactivate();
    trap = null;
  }

  function show(project, originRect, from) {
    returnFocus = from || null;
    const card = cardEl(project);
    card.classList.add("pc--preview");
    host.innerHTML = "";
    host.appendChild(card);
    const inner = card.querySelector(".pc__inner");
    if (inner) inner.style.transform = "rotateY(180deg)";
    wireCardLinks(card);
    if (card.querySelector(".duel")) wireDuel(card);

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    open = true;
    trap = trapFocus(overlay, close);
    trap.activate(returnFocus || closeBtn);

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
    track("card_preview", { slug: project.slug });
  }

  overlay.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });

  return { show, close, get isOpen() { return open; } };
}

/* ---------- sound toggle UI ---------- */
function initSoundToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sound-toggle";
  btn.setAttribute("aria-label", "Toggle deal sounds");
  btn.setAttribute("aria-pressed", sounds.enabled ? "true" : "false");
  btn.textContent = sounds.enabled ? "🔊" : "🔇";
  btn.addEventListener("click", () => {
    const on = sounds.toggle();
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "🔊" : "🔇";
  });
  document.body.appendChild(btn);
}

/* ---------- deck mode ---------- */
function initDeck(preview) {
  document.body.classList.add("deck-mode");
  scrollCfg = buildScrollCfg();
  const { MAX_POS, TOTAL_UNITS, progForCard } = scrollCfg;

  const stage = document.getElementById("stage");
  const deck = document.getElementById("deck");
  const intro = document.getElementById("intro");
  const hud = document.getElementById("hud");
  const hudLive = document.getElementById("hudLive");
  const hudNum = document.getElementById("hudNum");
  const hudName = document.getElementById("hudName");
  const hudBar = document.getElementById("hudBar");
  const deckEnd = document.getElementById("deckEnd");
  const pipsEl = document.getElementById("pips");

  let st = null;
  let lenis = null;
  let tickerFn = null;
  let activeIndex = -1;
  let atEnd = false;
  let celebrated = false;
  let lastCentered = -1;
  let lastDealtSound = -1;

  function goToCard(i) {
    if (!st) return;
    i = clamp(i, 0, N - 1);
    const y = st.start + progForCard(i) * (st.end - st.start);
    if (lenis?.scrollTo) lenis.scrollTo(y, { duration: 0.8 });
    else window.scrollTo({ top: y, behavior: "smooth" });
    setHashForCard(i);
    updateCardMeta(i);
  }
  goToCardRef = goToCard;

  const setPipsActive = buildPips(pipsEl, goToCard);

  const cards = PROJECTS.map((p) => {
    const el = cardEl(p);
    deck.appendChild(el);
    return el;
  });
  const inners = cards.map((c) => c.querySelector(".pc__inner"));
  const focusables = cards.map((c) => Array.from(c.querySelectorAll("a, input, button.pc__read-more")));

  cards.forEach((el, i) => {
    if (el.querySelector(".duel")) wireDuel(el);
    wireCardLinks(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input")) return;
      if (atEnd) { preview.show(PROJECTS[i], el.getBoundingClientRect(), el); return; }
      goToCard(i === activeIndex ? Math.min(i + 1, N - 1) : i);
    });
  });

  const jitter = PROJECTS.map((_, i) => ((i * 37) % 7) - 3);
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
    if (H > 820) document.documentElement.style.setProperty("--cw", "clamp(280px, 26vw, 380px)");
    else document.documentElement.style.removeProperty("--cw");
  }

  const fanX = (i) => (i - G.mid) * G.gapX;
  const fanRot = (i) => (i - G.mid) * 4.2;
  const fanY = (i) => G.tableauY + Math.abs(i - G.mid) * 4;

  function render(prog) {
    const pos = -INTRO + prog * TOTAL_UNITS;

    for (let i = 0; i < N; i++) {
      const d = pos - i;
      let x, y, rot, s, flip, z;
      const faceUp = d > DEAL;

      if (d <= 0) {
        const depth = -d;
        x = G.deckX - depth * 0.6;
        y = G.deckY - depth * 0.8;
        rot = G.deckRot + jitter[i];
        s = 1; flip = 0;
        z = Math.round(240 - depth);
      } else if (d <= DEAL) {
        const t = d / DEAL;
        const e = easeOutCubic(t);
        x = lerp(G.deckX, G.activeX, e);
        y = lerp(G.deckY, G.activeY, e) - G.arc * Math.sin(Math.PI * e);
        rot = lerp(G.deckRot + jitter[i], 0, e);
        s = lerp(1, ACTIVE_S, e);
        flip = 180 * easeInOut(clamp(t * 1.05));
        z = 340;
        if (Math.floor(d * 10) === Math.floor(DEAL * 5) && lastDealtSound !== i) {
          lastDealtSound = i;
          sounds.deal();
        }
      } else if (d <= 1) {
        x = G.activeX; y = G.activeY; rot = 0; s = ACTIVE_S; flip = 180; z = 340;
      } else if (d <= 1 + LEAVE) {
        const t = (d - 1) / LEAVE;
        const e = easeInOut(t);
        x = lerp(G.activeX, fanX(i), e);
        y = lerp(G.activeY, fanY(i), e);
        rot = lerp(0, fanRot(i), e);
        s = lerp(ACTIVE_S, FAN_S, e);
        flip = 180;
        z = 300 - i;
      } else {
        x = fanX(i); y = fanY(i); rot = fanRot(i); s = FAN_S; flip = 180;
        z = 150 + i;
      }

      const el = cards[i];
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      el.style.zIndex = String(z);
      el.style.pointerEvents = "auto";
      inners[i].style.transform = `rotateY(${flip.toFixed(1)}deg)`;
      focusables[i].forEach((f) => { f.tabIndex = faceUp ? 0 : -1; });
    }

    const introT = clamp((pos + INTRO) / INTRO);
    intro.style.opacity = String(1 - introT);
    intro.style.transform = `translateY(${(-introT * 26).toFixed(1)}px)`;

    const dealt = pos > 0;
    const centered = clamp(Math.floor(pos - DEAL), 0, N - 1);
    activeIndex = pos > DEAL ? centered : -1;

    hud.classList.toggle("is-on", dealt);
    hudNum.textContent = dealt ? String(centered + 1).padStart(2, "0") : "00";
    hudName.textContent = dealt ? PROJECTS[centered].title : "the deck";
    hudBar.style.width = `${(clamp(prog) * 100).toFixed(1)}%`;
    if (hudLive) {
      hudLive.textContent = dealt
        ? `Card ${centered + 1} of ${N}: ${PROJECTS[centered].title}`
        : "Scroll to deal the portfolio cards";
    }
    setPipsActive(dealt ? centered : -1);

    if (centered !== lastCentered && centered >= 0) {
      lastCentered = centered;
      preloadVideoForProject(PROJECTS[centered]);
      if (!hashNavigating) {
        setHashForCard(centered);
        updateCardMeta(centered);
      }
      track("card_view", { slug: PROJECTS[centered].slug, index: centered });
    }

    if (deckEnd) {
      const endT = easeInOut(clamp((pos - N) / (MAX_POS - N)));
      deckEnd.style.opacity = String(endT);
      deckEnd.style.transform = `translate(-50%, ${lerp(26, 0, endT).toFixed(1)}px) scale(${lerp(0.9, 1, endT).toFixed(3)})`;
      deckEnd.style.pointerEvents = endT > 0.5 ? "auto" : "none";
      deckEnd.setAttribute("aria-hidden", endT > 0.3 ? "false" : "true");
      atEnd = endT > 0.5;
      deckEnd.classList.toggle("is-on", atEnd);
      if (atEnd && !celebrated) {
        celebrated = true;
        sounds.fullHouse();
        cards.forEach((c) => c.classList.add("pc--celebrate"));
        setTimeout(() => cards.forEach((c) => c.classList.remove("pc--celebrate")), 2200);
        track("full_house");
      }
    }
  }

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  tickerFn = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tickerFn);
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
    snap: {
      snapTo: (value) => {
        const pos = -INTRO + value * TOTAL_UNITS;
        const rawI = Math.round(pos - 0.85);
        if (rawI < 0) return 0;
        if (rawI >= N) return 1;
        return progForCard(rawI);
      },
      duration: { min: 0.15, max: 0.4 },
      delay: 0.06,
      ease: "power1.inOut",
    },
    onRefresh: (self) => { measure(); render(self.progress); },
    onUpdate: (self) => render(self.progress),
  });

  function onKey(e) {
    if (preview.isOpen || lightboxOpen) return;
    if (e.target.closest("input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToCard(clamp((activeIndex < 0 ? 0 : activeIndex) + 1, 0, N - 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToCard(clamp((activeIndex < 0 ? 0 : activeIndex) - 1, 0, N - 1));
    } else if (e.key >= "1" && e.key <= "9") {
      goToCard(parseInt(e.key, 10) - 1);
    } else if (e.key === "0") {
      goToCard(9);
    }
  }
  document.addEventListener("keydown", onKey);

  if (new URLSearchParams(location.search).has("debug")) {
    window.__deck = { render, measure, goToCard, get lenis() { return lenis; }, get st() { return st; } };
  }

  return () => {
    document.removeEventListener("keydown", onKey);
    goToCardRef = null;
    st?.kill();
    if (tickerFn) gsap.ticker.remove(tickerFn);
    lenis?.destroy();
    deck.innerHTML = "";
    document.body.classList.remove("deck-mode");
  };
}

/* ---------- static mode ---------- */
function initStatic(preview) {
  document.body.classList.add("static-mode");

  const grid = document.getElementById("fallbackGrid");
  const els = PROJECTS.map((p) => {
    const el = cardEl(p);
    grid.appendChild(el);
    return el;
  });

  els.forEach((el, i) => {
    if (el.querySelector(".duel")) wireDuel(el);
    wireCardLinks(el);
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input")) return;
      preview.show(PROJECTS[i], el.getBoundingClientRect(), el);
    });
  });

  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          const idx = els.indexOf(en.target);
          if (idx >= 0) track("card_view", { slug: PROJECTS[idx].slug, mode: "static" });
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  handleHashNavigate();
  const i = slugIndex(location.hash.slice(1));
  if (i >= 0) {
    setTimeout(() => els[i]?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    updateCardMeta(i);
  }

  return () => {
    grid.innerHTML = "";
    document.body.classList.remove("static-mode");
  };
}

/* ---------- mode switching without reload ---------- */
let teardown = null;
let currentStatic = null;

function wantsStatic() {
  const libs = window.gsap && window.ScrollTrigger && window.Lenis;
  return matchMedia("(max-width: 820px)").matches
    || matchMedia("(prefers-reduced-motion: reduce)").matches
    || !libs;
}

function applyMode() {
  const static = wantsStatic();
  if (static === currentStatic && teardown) return;
  teardown?.();
  currentStatic = static;
  if (static) teardown = initStatic(previewApi);
  else {
    try { teardown = initDeck(previewApi); }
    catch (err) {
      console.error("deck init failed, falling back", err);
      document.body.classList.remove("deck-mode");
      currentStatic = true;
      teardown = initStatic(previewApi);
    }
  }
  if (!static) handleHashNavigate();
}

/* ---------- service worker ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

/* ---------- boot ---------- */
async function boot() {
  try {
    const res = await fetch("projects.json");
    const data = await res.json();
    PROJECTS = data.projects;
    DUEL_TARGET = data.duelTarget;
    SITE = data.site || {};
    INTRO_COPY = data.intro || {};
    N = PROJECTS.length;
    scrollCfg = buildScrollCfg();
  } catch (err) {
    console.error("Failed to load projects.json", err);
    return;
  }

  fillIntro();
  loadArt();
  initLightbox();
  previewApi = initPreview();
  initSoundToggle();
  registerSW();

  const libs = window.gsap && window.ScrollTrigger && window.Lenis;
  if (libs) gsap.registerPlugin(ScrollTrigger);

  applyMode();
  window.addEventListener("hashchange", handleHashNavigate);

  matchMedia("(max-width: 820px)").addEventListener("change", applyMode);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applyMode);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
