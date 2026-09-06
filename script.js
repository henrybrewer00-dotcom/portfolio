/* =========================================================================
   henry. — preloader, HUD, the swarm, hero, cards, scroll choreography.
   Vanilla JS on top of GSAP + ScrollTrigger, SplitType and Lenis.
   ========================================================================= */

/* ---------- content ---------- */
const GH = "https://github.com/henrybrewer00-dotcom";
const PROJECTS = [
  { title: "SiteLight", shape: "eye", tags: ["Founder", "AI visibility", "$2 one-time"], href: "https://sitelight.xyz", status: "founded & growing" },
  { title: "Lily", shape: "wave", tags: ["Voice AI", "ElevenLabs", "Twilio"], transcript: true },
  { title: "Lily, on stage", shape: "play", tags: ["a16z × Cursor hackathon", "1st place", "150 people"], video: "assets/lily-demo.mp4", poster: "assets/lily-demo-poster.jpg" },
  { title: "Glasscast", shape: "rec", tags: ["Open source", "Electron", "macOS"], href: GH + "/Glasscast" },
  { title: "Lily's Drive-Thru", shape: "burger", tags: ["Voice AI", "Express", "live kitchen screen"], href: GH + "/voice-drive-thru" },
  { title: "Eleven Mile", shape: "mic", tags: ["Claude", "ElevenLabs", "rap battles"], href: GH + "/eleven-mile" },
  { title: "PawBot", shape: "paw", tags: ["Accessibility", "hackathon"], href: GH + "/PawBot" },
  { title: "S.I.E.G.E.", shape: "car", tags: ["Robotics", "Arduino", "chases dogs"] },
  { title: "ROV Submarine", shape: "sub", tags: ["Hardware", "CAD", "watertight, hopefully"], status: "currently building" },
  { title: "Open Source", shape: "git", tags: ["SymPy", "Biome", "Astro"], href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests" },
];

const TOOLS = ["react", "typescript", "python", "electron", "arduino", "twilio", "elevenlabs", "claude", "vercel", "github"];

const AWARDS = [
  { title: "a16z × Cursor hackathon", items: [["1st place", "01"], ["On-stage demo", "150"]] },
  { title: "School", items: [["Straight A's", "A+"], ["Math", "99.5"]] },
  { title: "Merged pull requests", items: [["SymPy", "01"], ["Biome", "02"], ["Astro", "01"]] },
  { title: "Typing", items: [["Words per minute", "125"]] },
];

/* a sample of what a Lily morning call looks like — not a recording */
const TRANSCRIPT = [
  ["Lily", "Good morning! It's Lily. How did you sleep?"],
  ["Grandma", "Oh, not too bad. It rained all night."],
  ["Lily", "It did! Have you had your coffee yet?"],
  ["Grandma", "I'm working on it."],
  ["Lily", "Perfect. Henry says hi, by the way."],
];

const TILE_TEXT = ["Voice AI", "Robotics", "Open source", "Hardware", "Vibecoded", "Founder", "Hackathons", "Austin"];
const TILE_SHAPES = ["eye", "wave", "rec", "burger", "mic", "paw", "car", "sub", "git", "play"];

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const ARROW = `<svg class="hcs-cross is-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;

window.isTabletOrBelow = window.innerWidth <= 991;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---------- render ---------- */
function renderClients() {
  const grid = $("#clientGrid");
  if (!grid || !window.LOGOS) return;
  grid.innerHTML = TOOLS.map((slug) => {
    const l = window.LOGOS[slug];
    return l ? `<div class="home-client__grid-item" data-client-item="${esc(l.label)}"><div class="home-client__grid-img"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${l.d}"/></svg><span>${esc(l.label)}</span></div></div>` : "";
  }).join("");
  const gh = $('path[data-logo="github"]');
  if (gh && window.LOGOS.github) gh.setAttribute("d", window.LOGOS.github.d);
}

function renderWork() {
  const grid = $("#workGrid");
  if (!grid) return;
  grid.innerHTML = PROJECTS.map((p, i) => {
    const cls = ["hcs-item-w", p.href || p.video ? "is-link" : "", p.transcript ? "has-transcript" : "", p.video ? "has-poster" : ""].filter(Boolean).join(" ");
    const tag = p.href || p.video ? "a" : "div";
    const attrs = p.video
      ? `href="#" data-video="${esc(p.video)}" data-poster="${esc(p.poster || "")}" data-title="${esc(p.title)} — a16z × Cursor hackathon, 1st place"`
      : p.href ? `href="${esc(p.href)}" target="_blank" rel="noreferrer"` : "";
    const status = p.status ? `<p class="text-mini hcs-status"><i aria-hidden="true"></i>${esc(p.status)}</p>` : "";
    const poster = p.video ? `<img class="hcs-poster" src="${esc(p.poster)}" alt="" decoding="async" /><div class="hcs-poster-shade"></div>` : "";
    const transcript = p.transcript
      ? `<div class="hcs-transcript" data-transcript aria-label="Sample of a Lily morning call">${TRANSCRIPT.map(([who, line]) => `<div class="tr-line${who === "Lily" ? " is-lily" : ""}"><span class="tr-who">${esc(who)}</span><span class="tr-text" data-text="${esc(line)}"></span></div>`).join("")}<p class="tr-note">sample call · not a recording</p></div>`
      : "";
    return `<${tag} class="${cls}" ${attrs} data-shape="${esc(p.shape)}" data-index="${i}" aria-label="${esc(p.title)}">
      ${poster}
      <canvas class="hcs-canvas${p.video ? " is-overlay" : ""}" aria-hidden="true"></canvas>
      ${transcript}
      <div class="hcs-content-w">
        <div class="hcs-titles-w">
          <div class="hcs-titles"><div class="hcs-info-w"><h3>${esc(p.title)}</h3>${status}<div class="hcs-title-w">${p.tags.map((t) => `<p class="text-mini">${esc(t)}</p>`).join("")}</div></div></div>
          ${p.href || p.video ? `<div class="hcs-cross-w">${ARROW}</div>` : ""}
        </div>
      </div>
    </${tag}>`;
  }).join("");
  const count = $("#workCount");
  if (count) count.textContent = String(PROJECTS.length);
}

function renderAwards() {
  const host = $("#awards-list");
  if (!host) return;
  host.innerHTML = AWARDS.map((a, i) => `
    <div class="haw-grid-row"><div class="haw-grid-item">
      <p class="text-mini">${String(i + 1).padStart(2, "0")}</p>
      <p class="h-c">${esc(a.title)}</p>
      <div class="haw-item-sub-wrap">${a.items.map(([t, n]) => `<div class="rel is-h-flex"><p class="text-small caps">${esc(t)}</p><div class="text-mini float-count is-haw">${esc(n)}</div></div>`).join("")}</div>
    </div></div>`).join("");
  const count = $("#awardCount");
  if (count) count.textContent = String(AWARDS.reduce((n, a) => n + a.items.length, 0));
}

function renderTiles() {
  const grid = $("#hgGrid");
  if (!grid || window.isTabletOrBelow || !window.CardSwarm) return;
  const ink = cssVar("--fg"), bg = cssVar("--bg-alt");
  const snaps = TILE_SHAPES.map((s) => window.CardSwarm.snapshot(window.SHAPES2D[s], 560, 360, ink, bg));
  const textAt = { 1: 0, 9: 1, 18: 2, 24: 3, 29: 4, 37: 5, 44: 6, 52: 7 };
  const vidAt = { 12: 1, 33: 1, 47: 1 };
  let k = 0;
  const html = [];
  for (let i = 0; i < 56; i++) {
    if (textAt[i] !== undefined) html.push(`<div class="hg-grid-item is-text"><div class="text-small">${esc(TILE_TEXT[textAt[i]])}</div></div>`);
    else if (vidAt[i]) html.push(`<div class="hg-grid-item"><div class="hg-grid-inner" style="background-image:url('assets/lily-demo-poster.jpg')"><div class="hg-vid-w"><video home-vid muted loop playsinline preload="none" poster="assets/lily-demo-poster.jpg"><source src="assets/lily-demo.mp4" type="video/mp4" /></video></div></div></div>`);
    else html.push(`<div class="hg-grid-item"><div class="hg-grid-inner" style="background-image:url('${snaps[k++ % snaps.length]}')"></div></div>`);
  }
  grid.innerHTML = html.join("");
}

/* ---------- text splitting ---------- */
function splitAll() {
  new SplitType("[split-text]", { types: "lines, words, chars", tagName: "span" });
  new SplitType("[split-hero]", { types: "words, chars", tagName: "span" });
}

/* ---------- smooth scroll ---------- */
let lenis = null;
function initScroll() {
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.SScroll = {
    stop() { lenis ? lenis.stop() : (document.documentElement.style.overflow = "hidden"); },
    start() { lenis ? lenis.start() : (document.documentElement.style.overflow = ""); },
    to(target) { lenis ? lenis.scrollTo(target, { duration: 1.2 }) : target.scrollIntoView({ behavior: "smooth" }); },
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2 || a.hasAttribute("data-video")) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      window.SScroll.to(el);
    });
  });
}

/* ---------- scroll reveals ---------- */
const once = (el) => ({ trigger: el, start: "20% bottom", once: true, onRefresh: (s) => { if (!s.isActive) s.animation.pause(); } });
function initReveals() {
  $$("[stagger-scroll]").forEach((el) => {
    const words = el.querySelectorAll(".word");
    if (!words.length) return;
    const d = parseFloat(el.getAttribute("stagger-scroll")) || 2;
    gsap.from(words, { autoAlpha: 0, yPercent: -101, duration: d, ease: "power4.inOut", stagger: { each: 0.05, from: "random" }, scrollTrigger: once(el) });
  });
  $$("[btn-reveal]").forEach((el) => {
    const t = el.querySelector("[reveal-target]");
    if (t) gsap.from(t, { yPercent: 101, autoAlpha: 0, duration: 1, ease: "power1.out", scrollTrigger: once(el) });
  });
  $$("[link-reveal]").forEach((el) => {
    const t = el.querySelector("[reveal-target]"), track = el.querySelector(".link-track");
    if (t) gsap.from(t, { yPercent: 101, duration: 2, ease: "power1.out", scrollTrigger: once(el) });
    if (track) gsap.from(track, { scaleX: 0, duration: 1, ease: "power1.out", scrollTrigger: once(el) });
  });
}

/* ---------- hover: letters hop to reveal their text-shadow twin ---------- */
function initStaggerHover() {
  $$("[stagger-el]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      gsap.to(el.querySelectorAll("[stagger-text] .char"), { yPercent: -100, duration: 0.5, ease: "power4.inOut", stagger: { each: 0.03, from: "random" }, overwrite: true });
      const fill = el.querySelector(".link-track-fill");
      if (fill) fill.style.transform = "scaleX(1)";
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el.querySelectorAll("[stagger-text] .char"), { yPercent: 0, duration: 0.4, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
      const fill = el.querySelector(".link-track-fill");
      if (fill) fill.style.transform = "scaleX(0)";
    });
  });
}

/* ---------- cursor ---------- */
function initCursor() {
  const dot = $("[data-cursor]");
  if (!dot || window.isTabletOrBelow || matchMedia("(hover: none)").matches) return;
  gsap.set(dot, { xPercent: -50, yPercent: -50 });
  document.addEventListener("mouseover", (e) => { if (e.target.closest("a, button, [role=button]")) dot.classList.add("hover"); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest("a, button, [role=button]")) dot.classList.remove("hover"); });
  document.addEventListener("mousemove", (e) => gsap.to(dot, { x: e.clientX, y: e.clientY, scale: dot.classList.contains("hover") ? 1.6 : 1, duration: 0.25, ease: "power2.out" }));
}

/* ---------- HUD ---------- */
function hudIn() {
  gsap.to(".hud-brand-w .hud-brand-link", { y: "0%", opacity: 1, duration: 1, ease: "power1.out" });
  gsap.to(".hud-nav-w .hud-nav-flex", { y: "0%", opacity: 1, duration: 1, ease: "power1.out" });
  gsap.to(".hud-scroll-w", { opacity: 1, duration: 1, ease: "power1.out" });
  gsap.to(".hud-menu-o .hud-menu-w, .hud-menu-o .hud-menu-bg", { y: "0%", opacity: 1, duration: 1, ease: "power1.out" });
}

let onModeChange = () => {};
function initMenu() {
  gsap.set(".hud-brand-w .hud-brand-link", { y: "-101%", opacity: 0 });
  gsap.set(".hud-nav-w .hud-nav-flex", { y: "-101%", opacity: 0 });
  gsap.set(".hud-scroll-w", { opacity: 0 });
  gsap.set(".hud-menu-o .hud-menu-w, .hud-menu-o .hud-menu-bg", { y: "101%", opacity: 0 });

  const btn = $(".hud-menu-w"), o = $(".hud-menu-o"), content = $(".hud-menu-content"), bg = $(".hud-menu-bg");
  const socials = $$(".hud-social-link"), rows = $$(".o-hidden.menu-l2"), toggle = $(".hud-mode-toggle-w");
  let timer = null;
  const EASE = "power3.inOut";
  function toggleMenu() {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    btn.classList.toggle("is-open"); o.classList.toggle("is-open");
    clearTimeout(timer);
    gsap.killTweensOf([rows, socials, bg, content, toggle]);
    if (!open) {
      gsap.set([rows, socials], { y: "0%" }); gsap.set(toggle, { x: "0%" });
      gsap.to(bg, { width: "100%", height: "100%", duration: 0.4 });
      gsap.to(content, { opacity: 1, duration: 0.8, ease: EASE });
      gsap.from(rows, { delay: 0.2, y: "-101%", duration: 0.3, stagger: 0.05, ease: EASE, onComplete() { content.setAttribute("pointer-auto", ""); o.setAttribute("pointer-auto", ""); } });
      gsap.from(socials, { delay: 0.4, y: "-151%", duration: 0.3, stagger: 0.05, ease: EASE });
      gsap.from(toggle, { delay: 0.4, x: "-130%", duration: 0.3, ease: EASE });
    } else {
      content.removeAttribute("pointer-auto"); o.removeAttribute("pointer-auto");
      const sz = window.innerWidth <= 991 ? "3rem" : "3em";
      gsap.to(bg, { delay: 0.1, width: sz, height: sz, duration: 0.3, ease: EASE });
      gsap.to(content, { opacity: 0, duration: 0.2, ease: EASE, delay: 0.2 });
      gsap.to(rows, { y: "101%", duration: 0.2, ease: EASE });
      gsap.to(socials, { y: "151%", duration: 0.2, ease: EASE });
      gsap.to(toggle, { x: "130%", duration: 0.2, ease: "power4.inOut" });
    }
  }
  btn.addEventListener("click", toggleMenu);
  btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMenu(); } });
  o.addEventListener("mouseleave", () => { timer = setTimeout(() => { if (btn.getAttribute("aria-expanded") === "true") toggleMenu(); }, 2000); });
  o.addEventListener("mouseenter", () => clearTimeout(timer));
  document.addEventListener("click", (e) => { if (!o.contains(e.target) && btn.getAttribute("aria-expanded") === "true") toggleMenu(); });
  [...rows, ...socials].forEach((r) => r.addEventListener("click", () => { if (btn.getAttribute("aria-expanded") === "true") toggleMenu(); }));

  function setMode(m) {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(m);
    toggle.setAttribute("mode-toggle", m);
    toggle.setAttribute("aria-pressed", String(m === "dark"));
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", m === "dark" ? "#0f0f0e" : "#f3efe6");
    onModeChange(m);
  }
  const flip = () => { const next = document.documentElement.classList.contains("dark") ? "light" : "dark"; try { localStorage.setItem("mode", next); } catch (e) {} setMode(next); };
  toggle.addEventListener("click", flip);
  toggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
}

/* ---------- the swarm ---------- */
let swarm = null;
function initSwarm() {
  return new Promise((resolve) => {
    const host = $("[data-swarm]");
    const start = () => {
      try {
        if (!window.createSwarm) throw new Error("swarm module missing");
        swarm = window.createSwarm(host, {
          count: window.isTabletOrBelow ? 4500 : 12000,
          maxDpr: window.isTabletOrBelow ? 1.5 : 2,
          ink: cssVar("--fg"), accent: cssVar("--accent"),
          pointSize: window.isTabletOrBelow ? 4.2 : 3.2,
        });
        // the cursor blows through it (and a finger, on touch)
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

/* where the swarm goes and what it becomes, section by section */
function initSwarmJourney() {
  const n = $("[data-swarm]");
  const st = { trigger: ".page-w", start: "top top", end: "bottom bottom", scrub: true, immediateRender: false };
  gsap.timeline({ scrollTrigger: st })
    .to(n, { x: "46vw", scale: 1.6, duration: 0.15, ease: "power2.out" })
    .to(n, { x: "-44vw", y: "-16vh", scale: 1.25, duration: 0.15, ease: "power2.inOut" })
    .to(n, { x: "0vw", y: "40vh", scale: 0.35, duration: 0.05 })
    .to(n, { x: "0vw", scale: 0.35, duration: 0.025 })
    .to(n, { x: "0vw", y: "0vh", scale: 1, duration: 0.125 })
    .to(n, { x: "-24vw", y: "16vh", scale: 1.25, duration: 0.1 })
    .to(n, { x: "-56vw", y: "-70vh", scale: 0.25, ease: "power1.out", duration: 0.05 })
    .to(n, { x: "0vw", y: "-6vh", scale: 1.05, duration: 0.2 })
    .to(n, { x: "24vw", y: "15vh", scale: 0.4, duration: 0.1 });

  const shapes = [
    ["#statement", "keycaps", "sphere"],
    ["#skills", "car", "keycaps"],
    ["#work", "sub", "car"],
    [".s.is-hg", "wave", "sub"],
    ["#awards", "sphere", "wave"],
    ["#close", "text:hire me", "sphere"],
    ["#contact", "sphere", "text:hire me"],
  ];
  shapes.forEach(([sel, enter, back]) => {
    const el = $(sel);
    if (!el || !swarm) return;
    ScrollTrigger.create({ trigger: el, start: "top 65%", onEnter: () => swarm.setShape(enter, 1.8), onLeaveBack: () => swarm.setShape(back, 1.8) });
  });
}

/* ---------- hero ---------- */
function heroIntro() {
  const chars = $$(".c.is-home-hero [split-hero] .char");
  document.body.style.cursor = "progress";
  setTimeout(() => window.SScroll.stop(), 50);
  gsap.to(chars, { y: "0%", autoAlpha: 1, duration: 1, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
  gsap.from('[hh-tb="1"]', { delay: 0.6, x: "10em", duration: 1, ease: "power2.inOut" });
  gsap.from('[hh-tb="2"]', { delay: 0.7, x: "-10em", duration: 1, ease: "power2.inOut" });
  gsap.from('[hh-tb="3"]', { delay: 0.8, x: "10em", duration: 1, ease: "power2.inOut", onComplete() {
    document.body.style.cursor = "auto";
    window.SScroll.start();
    if (!window.isTabletOrBelow) heroScroll();
    initSwarmJourney();
    ScrollTrigger.refresh();
  } });
}
function heroScroll() {
  const st = { trigger: $("[home-hero]"), start: "top top", end: "bottom top", scrub: true };
  gsap.to('[hh-tb="1"]', { x: "-20em", ease: "power2.out", scrollTrigger: st });
  gsap.to('[hh-tb="2"]', { x: "-10em", ease: "power2.out", scrollTrigger: st });
  gsap.to('[hh-tb="3"]', { x: "-5em", ease: "power2.out", scrollTrigger: st });
  gsap.to($$("[split-hero] .char"), { y: "101%", autoAlpha: 0, stagger: { each: 0.03, from: "random" }, scrollTrigger: st });
}

/* ---------- work cards: each one is a little swarm ---------- */
const cardSwarms = [];
function initWork() {
  const items = $$(".hcs-item-w");
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((en) => {
    const api = en.target._swarm;
    if (api) api.setPaused(!en.isIntersecting);
    if (en.isIntersecting) { en.target._seen = true; en.target._onSeen && en.target._onSeen(); }
  }), { rootMargin: "10% 0px" }) : null;

  items.forEach((el, i) => {
    const p = PROJECTS[i];
    const canvas = el.querySelector(".hcs-canvas");
    const draw = window.SHAPES2D[p.shape];
    if (canvas && draw && window.CardSwarm) {
      const api = window.CardSwarm.make(canvas, draw, {
        count: window.isTabletOrBelow ? 900 : 1500,
        fit: p.transcript ? 0.72 : p.video ? 0.56 : 0.62,
        align: p.transcript ? "left" : "center",
        pointerHost: el,
      });
      el._swarm = api;
      cardSwarms.push(api);
      api.setPaused(true);
      // the on-stage card: a play button, then a nudge if nobody presses it
      if (p.video) {
        let nudged = false, clicked = false, timer = null;
        el._onSeen = () => { if (!nudged && !clicked && !timer) timer = setTimeout(() => { if (!clicked) { nudged = true; api.setShape(window.SHAPES2D.pressme, 1.4); } }, 5000); };
        el.addEventListener("click", () => { clicked = true; clearTimeout(timer); api.burst(1.2); setTimeout(() => api.setShape(window.SHAPES2D.play, 1.2), 400); });
      }
    }
    if (io) io.observe(el);

    el.addEventListener("mouseenter", () => {
      const tags = el.querySelectorAll(".hcs-title-w .text-mini");
      gsap.killTweensOf(tags);
      gsap.to(tags, { y: 0, stagger: 0.08, duration: 0.3 });
      if (el._swarm) el._swarm.burst(0.35);
    });
    el.addEventListener("mouseleave", () => {
      const tags = el.querySelectorAll(".hcs-title-w .text-mini");
      gsap.killTweensOf(tags);
      gsap.to(tags, { y: "0.75em", stagger: 0.05, duration: 0.6 });
    });
    if (!window.isTabletOrBelow) {
      const from = (i + 1) % 2 !== 0 ? "10em" : "-10em";
      ScrollTrigger.create({ trigger: "[home-work]", start: "top bottom", end: "bottom top", scrub: true, onUpdate: (s) => gsap.to(el, { y: gsap.utils.interpolate(from, "0em", s.progress), overwrite: "auto" }) });
    }
  });

  // the sample transcript types itself out when the card comes into view
  const tr = $("[data-transcript]");
  if (tr) {
    let started = false;
    const run = async () => {
      if (started) return; started = true;
      const lines = $$(".tr-line", tr);
      for (const line of lines) {
        const t = line.querySelector(".tr-text"), text = t.dataset.text;
        line.classList.add("in");
        const caret = document.createElement("span"); caret.className = "tr-caret"; t.after(caret);
        for (let k = 1; k <= text.length; k++) { t.textContent = text.slice(0, k); await new Promise((r) => setTimeout(r, 22 + Math.random() * 30)); }
        caret.remove();
        await new Promise((r) => setTimeout(r, 420));
      }
    };
    const card = tr.closest(".hcs-item-w");
    if (io) { const io2 = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { run(); io2.disconnect(); } }), { threshold: 0.4 }); io2.observe(card); }
    else run();
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-video]");
    if (!a) return;
    e.preventDefault();
    openLightbox(a.dataset.video, a.dataset.poster, a.dataset.title);
  });
}

function initClients() {
  const section = $("[data-client-section]"), tag = section && section.querySelector("[data-client-tag]");
  const items = section ? $$("[data-client-item]", section) : [];
  if (!section || !tag || !items.length) return;
  const base = tag.textContent;
  items.forEach((it) => it.addEventListener("mouseenter", () => { items.forEach((x) => (x.style.opacity = "0.4")); it.style.opacity = "1"; tag.textContent = it.getAttribute("data-client-item") || base; }));
  section.addEventListener("mouseleave", () => { items.forEach((x) => (x.style.opacity = "1")); tag.textContent = base; });
}

/* ---------- 3d grid ---------- */
function initGrid() {
  const n = $("[grid-anim]");
  if (!n || window.isTabletOrBelow) return;
  const items = $$(".hg-grid-item", n), inners = items.map((a) => a.querySelector(".hg-grid-inner")).filter(Boolean), labels = $$(".text-small", n);
  gsap.set(labels, { fontSize: "3em" });
  gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: n, start: "top bottom+=5%", end: "bottom top-=5%", scrub: true } })
    .set(items, { transformOrigin: "50% 0%", z: () => gsap.utils.random(-6000, -100), rotationX: () => gsap.utils.random(-65, -25), autoAlpha: 0.5 })
    .to(n, { scale: 0.8 }, 0)
    .to(items, { xPercent: () => gsap.utils.random(-150, 150), yPercent: () => gsap.utils.random(-300, 300), rotationX: 0, autoAlpha: 2 }, 0)
    .to(n, { z: 6500 }, 0)
    .fromTo(inners, { scale: 2 }, { scale: 1 }, 0)
    .fromTo(labels, { fontSize: "1.2em" }, { fontSize: "0.7em" }, 0);
  const words = $$(".hg-grid-overlay [split-text] .word");
  if (words.length) {
    const from = { autoAlpha: 0, yPercent: 101, duration: 2, ease: "power4.inOut" };
    gsap.timeline({ scrollTrigger: { trigger: n, start: "top bottom-=40%", end: "center top", scrub: true } })
      .fromTo(words, from, { autoAlpha: 1, yPercent: 0, stagger: { each: 0.05, from: "random" }, duration: 2, ease: "power4.inOut" })
      .to(words, { ...from, stagger: { each: 0.05, from: "start" } });
  }
}

/* ---------- closing ---------- */
function initClose() {
  const track = "[close-track]";
  const words = $$(".close-line .word");
  gsap.from(words, { autoAlpha: 0, yPercent: 60, stagger: 0.04, duration: 1, ease: "power3.out", scrollTrigger: { trigger: track, start: "top 40%", once: true } });
  gsap.from("[close-cap]", { autoAlpha: 0, duration: 1, delay: 0.6, scrollTrigger: { trigger: track, start: "top 40%", once: true } });
}

/* ---------- videos ---------- */
function initVideos() {
  const vids = $$("video[home-vid]");
  if (!vids.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.dataset.loaded) { v.dataset.loaded = "1"; v.load(); } const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    else v.pause();
  }), { rootMargin: "25% 0px" });
  vids.forEach((v) => io.observe(v));
}

/* ---------- lightbox ---------- */
function openLightbox(src, poster, title) {
  const box = $("#lightbox"), vid = box.querySelector("video"), t = box.querySelector(".lightbox__title");
  t.textContent = title || "";
  if (poster) vid.poster = poster;
  vid.src = src;
  box.classList.add("is-open"); box.setAttribute("aria-hidden", "false");
  window.SScroll.stop();
  const p = vid.play(); if (p && p.catch) p.catch(() => {});
}
function initLightbox() {
  const box = $("#lightbox"), vid = box.querySelector("video");
  const close = () => { box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true"); vid.pause(); vid.removeAttribute("src"); vid.load(); window.SScroll.start(); };
  box.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
}

/* ---------- preloader: the dots gather while the counter runs ---------- */
function runPreloader(done) {
  let first = true;
  try { first = localStorage.getItem("visited") === null; localStorage.setItem("visited", "true"); } catch (e) {}
  let ran = false;
  try { ran = !!sessionStorage.getItem("preloaderHasRun"); } catch (e) {}
  const pre = $("[preloader]");
  const dur = ran || reduceMotion ? 0.9 : first ? 2.4 : 1.4;
  if (swarm) swarm.setShape("sphere", dur + 0.4);
  if (!pre) { done(); return; }
  const pct = $("[pre-percent]"), chars = $$("[pre-text] .char");
  gsap.set(pre, { autoAlpha: 1 });
  gsap.set(chars, { yPercent: 101 });
  gsap.to(chars, { yPercent: 0, duration: 0.8, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
  const counter = { v: 0 };
  gsap.to(counter, { v: 100, duration: dur, ease: "power2.inOut", onUpdate() { pct.textContent = String(Math.round(counter.v)); }, onComplete() {
    try { sessionStorage.setItem("preloaderHasRun", "1"); } catch (e) {}
    gsap.to(pre, { autoAlpha: 0, duration: 0.4, delay: 0.2, onComplete: () => pre.remove() });
    done();
  } });
}

/* ---------- boot ---------- */
async function boot() {
  if (!window.gsap || !window.ScrollTrigger || !window.SplitType) { document.body.removeAttribute("data-start"); return; }
  gsap.registerPlugin(ScrollTrigger);
  $("#year") && ($("#year").textContent = String(new Date().getFullYear()));

  renderClients(); renderWork(); renderAwards(); renderTiles();
  splitAll();
  initScroll(); initMenu(); initCursor(); initLightbox();
  onModeChange = (m) => { if (swarm) swarm.setColors(cssVar("--fg"), cssVar("--accent")); };
  gsap.set(".c.is-home-hero [split-hero] .char", { y: "-101%", autoAlpha: 0 });
  document.body.removeAttribute("data-start");

  await initSwarm();
  if (swarm) swarm.setColors(cssVar("--fg"), cssVar("--accent"));

  runPreloader(() => {
    hudIn(); heroIntro();
    initReveals(); initStaggerHover(); initWork(); initClients(); initGrid(); initClose(); initVideos();
    if (window.isTabletOrBelow) window.SScroll.start();
    ScrollTrigger.refresh();
  });

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if ((window.innerWidth <= 991) !== window.isTabletOrBelow) location.reload(); else ScrollTrigger.refresh(); }, 250); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
