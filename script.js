/* =========================================================================
   HENRY+BREWER. — preloader, HUD, orb, hero, scroll choreography.
   Vanilla JS on top of GSAP + ScrollTrigger, SplitType and Lenis.
   ========================================================================= */

/* ---------- content ---------- */
const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") +
  "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");

const PROJECTS = [
  { title: "SiteLight", tags: ["● Founder", "△ Nothing → revenue in 10 days", "⁂ The first $2"], img: "assets/sitelight-stripe.jpg", contain: true, alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", light: true, status: "founded & growing" },
  { title: "Lily", tags: ["● Voice AI", "△ ElevenLabs + Twilio", "⁂ InsForge"], img: "assets/work/lily.webp", light: true },
  { title: "Glasscast", tags: ["● Open source", "△ Electron + TypeScript", "⁂ macOS"], cover: ["Open source · macOS", "A free Screen Studio."], href: "https://github.com/henrybrewer00-dotcom/Glasscast" },
  { title: "Lily's Drive-Thru", tags: ["● Voice AI", "△ Express + SSE", "⁂ Live kitchen screen"], cover: ["Voice AI", "Order out loud."], light: true, href: "https://github.com/henrybrewer00-dotcom/voice-drive-thru" },
  { title: "Eleven Mile", tags: ["● AI + audio", "△ Claude + ElevenLabs"], cover: ["AI + audio", "Claude writes the bars. ElevenLabs raps them."], href: "https://github.com/henrybrewer00-dotcom/eleven-mile" },
  { title: "PawBot", tags: ["● Accessibility", "△ Hackathon", "⁂ Assistive"], cover: ["Accessibility", "One step at a time."], light: true, href: "https://github.com/henrybrewer00-dotcom/PawBot" },
  { title: "S.I.E.G.E.", tags: ["● Robotics", "△ Arduino + C++", "⁂ Sensors"], cover: ["Robotics", "It chases my dogs."] },
  { title: "ROV Submarine", tags: ["● Hardware", "△ CAD + marine", "⁂ Physics"], cover: ["Hardware", "Has to survive real water."], light: true, status: "currently building" },
  { title: "Open Source", tags: ["● Merged PRs", "△ SymPy · Biome · Astro"], cover: ["Merged pull requests", "SymPy. Biome. Astro."], href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests" },
];

const TOOLS = ["react", "typescript", "python", "electron", "arduino", "twilio", "elevenlabs", "claude", "vercel", "github"];

const AWARDS = [
  { title: "Hackathon wins", caps: true, items: [["InsForge", "01"], ["Frontier Tower", "02"], ["a16z × Cursor", "03"]] },
  { title: "School", caps: true, items: [["Straight A's", "A+"], ["Math", "99.5"]] },
  { title: "Open Source", caps: false, items: [["SymPy", "PR"], ["Biome", "PR"], ["Astro", "PR"]] },
  { title: "Typing", caps: true, items: [["Words per minute", "125"]] },
];

/* the 3d grid: real images and text tiles (mirrors the reference density) */
const TILE_IMGS = ["assets/work/lily.webp", "assets/work/lily-stage.webp", "assets/sitelight-stripe.jpg"];
const TILE_TEXT = ["Voice AI", "Robotics", "Open Source", "Hardware", "Founder", "Hackathons", "Proud vibecoder", "Austin, TX", "SiteLight", "Lily", "Glasscast", "Drive-Thru", "Eleven Mile", "PawBot", "S.I.E.G.E.", "Submarine"];
const TILE_LAYOUT = (() => {
  const out = [];
  let img = 0, txt = 0;
  for (let i = 0; i < 56; i++) {
    if (i % 3 === 1) out.push({ img: TILE_IMGS[img++ % TILE_IMGS.length] });
    else out.push({ text: TILE_TEXT[txt++ % TILE_TEXT.length] });
  }
  return out;
})();

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const MARK_SVG = (cls) => `<svg class="hsc-cross ${cls}" viewBox="0 0 162 162" aria-hidden="true"><rect x="4" y="3" width="30" height="156" rx="9"/><rect x="92" y="3" width="30" height="156" rx="9"/><rect x="30" y="66" width="66" height="30" rx="9"/><circle cx="146" cy="146" r="12.5"/></svg>`;
const ARROW_SVG = (cls) => `<svg class="hsc-cross ${cls}" viewBox="0 0 162 162" aria-hidden="true"><path d="M69.4 148.3 125 90.7H4.8c-1 0-1.8-.8-1.8-2V73.8c0-1.2.8-2 1.8-2h120.5L69.4 13.7c-1.3-1.5-.5-2.5 1-2.5H90c1 0 1.8.3 2.5 1L158 80.6v1l-65.4 67.9c-.8.7-1.5 1.3-2.5 1.3H70.4c-1.5 0-2.2-1.2-1-2.5z"/></svg>`;
const PLUS_SVG = `<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0v10M0 5h10" stroke="currentColor" stroke-width="1"/></svg>`;

window.isTabletOrBelow = window.innerWidth <= 991;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- render dynamic content ---------- */
function renderClients() {
  const grid = $("#clientGrid");
  if (!grid || !window.LOGOS) return;
  grid.innerHTML = TOOLS.map((slug) => {
    const l = window.LOGOS[slug];
    if (!l) return "";
    return `<div class="home-client__grid-item" data-client-item="${esc(l.label)}">
      <div class="home-client__grid-img"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${l.d}"/></svg><span>${esc(l.label)}</span></div>
      <div class="home-client__corner-w">
        <div class="home-client__corner-img is-1">${PLUS_SVG}</div><div class="home-client__corner-img is-2">${PLUS_SVG}</div>
        <div class="home-client__corner-img is-3">${PLUS_SVG}</div><div class="home-client__corner-img is-4">${PLUS_SVG}</div>
        <div class="home-client__border"></div>
      </div>
    </div>`;
  }).join("");
  // the social github icon in the menu shares the same path
  const gh = $('path[data-logo="github"]');
  if (gh && window.LOGOS.github) gh.setAttribute("d", window.LOGOS.github.d);
}

function renderWork() {
  const grid = $("#workGrid");
  if (!grid) return;
  grid.innerHTML = PROJECTS.map((p) => {
    const media = p.cover
      ? `<div class="hcs-cover${p.light ? " is-light" : ""}"><p class="hcs-cover-eyebrow">${esc(p.cover[0])}</p><p class="hcs-cover-title">${esc(p.cover[1])}</p></div>`
      : `<img class="hcs-img-inner${p.contain ? " is-contain" : ""}" src="${esc(p.img)}" alt="${esc(p.alt || "")}" decoding="async" />`;
    const status = p.status ? `<p class="text-mini hcs-status"><i aria-hidden="true"></i>${esc(p.status)}</p>` : "";
    const tag = p.href ? "a" : "div";
    const attrs = p.href ? `href="${esc(p.href)}" target="_blank" rel="noreferrer"` : "";
    return `<${tag} class="hcs-item-w${p.href ? "" : " is-static"}" ${attrs} aria-label="${esc(p.title)}">
      <div class="hcs-content-w${p.light ? " mbm-diff" : ""}">
        <div class="hcs-titles-w">
          <div class="hcs-titles">
            <div class="hcs-info-w">
              <h3 class="text-small caps">${esc(p.title)}</h3>
              ${status}
              <div class="hcs-title-w">${p.tags.map((t) => `<p class="text-mini">${esc(t)}</p>`).join("")}</div>
            </div>
          </div>
          <div class="hcs-cross-w">${MARK_SVG("is-mark")}${ARROW_SVG("is-arrow")}</div>
        </div>
      </div>
      <div class="hcs-img-w is-component">${media}</div>
    </${tag}>`;
  }).join("");
  const count = $("#workCount");
  if (count) count.textContent = String(PROJECTS.length);
}

function renderAwards() {
  const host = $("#awards-list");
  if (!host) return;
  host.innerHTML = AWARDS.map((a, i) => `
    <div class="haw-grid-row mbm-diff">
      <div class="haw-grid-item mbm-diff">
        <p class="text-mini">${String(i + 1).padStart(2, "0")}</p>
        <p class="h-c${a.caps ? " caps" : ""}">${esc(a.title)}</p>
        <div class="haw-item-sub-wrap">
          ${a.items.map(([t, n]) => `<div class="rel is-h-flex"><p class="text-small caps">${esc(t)}</p><div class="text-mini float-count is-haw">${esc(n)}</div></div>`).join("")}
        </div>
      </div>
    </div>`).join("");
  const count = $("#awardCount");
  if (count) count.textContent = String(AWARDS.reduce((n, a) => n + a.items.length, 0));
}

function renderTiles() {
  const grid = $("#hgGrid");
  if (!grid || window.isTabletOrBelow) return; // the 3d grid is desktop-only
  grid.innerHTML = TILE_LAYOUT.map((t) => {
    if (t.text) return `<div class="hg-grid-item is-text"><div class="text-small caps">${esc(t.text)}</div></div>`;
    const vid = t.vid ? `<div class="hg-vid-w"><video home-vid muted loop playsinline preload="none" poster="${esc(t.img)}"><source src="${esc(t.vid)}" type="video/mp4" /></video></div>` : "";
    return `<div class="hg-grid-item"><div class="hg-grid-inner" style="background-image:url('${esc(t.img)}')"><div class="hg-img-w"></div>${vid}</div></div>`;
  }).join("");
}

/* ---------- text splitting ---------- */
let heroSplit = null;
function splitAll() {
  new SplitType("[split-text]", { types: "lines, words, chars", tagName: "span" });
  heroSplit = new SplitType("[split-hero]", { types: "words, chars", tagName: "span" });
}

/* ---------- smooth scroll ---------- */
let lenis = null;
function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
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
  // in-page anchors go through lenis
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      window.SScroll.to(el);
    });
  });
}

/* ---------- scroll reveals ---------- */
function initReveals() {
  $$("[stagger-scroll]").forEach((el) => {
    const words = el.querySelectorAll(".word");
    if (!words.length) return;
    const d = parseFloat(el.getAttribute("stagger-scroll")) || 2;
    gsap.from(words, {
      autoAlpha: 0, yPercent: -101, duration: d, ease: "power4.inOut",
      stagger: { each: 0.05, from: "random" },
      scrollTrigger: { trigger: el, start: "20% bottom", once: true, onRefresh: (s) => { if (!s.isActive) s.animation.pause(); } },
    });
  });
  $$("[btn-reveal]").forEach((el) => {
    const t = el.querySelector("[reveal-target]");
    if (!t) return;
    gsap.from(t, { yPercent: 101, autoAlpha: 0, duration: 1, ease: "power1.out",
      scrollTrigger: { trigger: el, start: "20% bottom", once: true, onRefresh: (s) => { if (!s.isActive) s.animation.pause(); } } });
  });
  $$("[link-reveal]").forEach((el) => {
    const t = el.querySelector("[reveal-target]");
    const track = el.querySelector(".link-track");
    if (t) gsap.from(t, { yPercent: 101, duration: 2, ease: "power1.out",
      scrollTrigger: { trigger: el, start: "20% bottom", once: true, onRefresh: (s) => { if (!s.isActive) s.animation.pause(); } } });
    if (track) gsap.from(track, { scaleX: 0, duration: 1, ease: "power1.out",
      scrollTrigger: { trigger: el, start: "20% bottom", once: true, onRefresh: (s) => { if (!s.isActive) s.animation.pause(); } } });
  });
}

/* ---------- hover: letters hop to reveal their text-shadow twin ---------- */
function initStaggerHover() {
  $$("[stagger-el]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const chars = el.querySelectorAll("[stagger-text] .char");
      gsap.to(chars, { yPercent: -100, duration: 0.5, ease: "power4.inOut", stagger: { each: 0.03, from: "random" }, overwrite: true });
      const icon = el.querySelector(".btn-icon-w .btn-txt");
      if (icon) gsap.to(icon, { x: "1em", duration: 1.2, ease: "power4.out", overwrite: true });
      const fill = el.querySelector(".link-track-fill");
      if (fill) fill.style.transform = "scaleX(1)";
    });
    el.addEventListener("mouseleave", () => {
      const chars = el.querySelectorAll("[stagger-text] .char");
      gsap.to(chars, { yPercent: 0, duration: 0.4, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
      const icon = el.querySelector(".btn-icon-w .btn-txt");
      if (icon) gsap.to(icon, { x: 0, duration: 1.2, ease: "power4.out", overwrite: true });
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
  const hover = (on) => dot.classList.toggle("hover", on);
  document.addEventListener("mouseover", (e) => { if (e.target.closest("a, button, [role=button], [hover-anim]")) hover(true); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest("a, button, [role=button], [hover-anim]")) hover(false); });
  document.addEventListener("mousemove", (e) => {
    gsap.to(dot, { x: e.clientX, y: e.clientY, scale: dot.classList.contains("hover") ? 0.55 : 1, duration: 0.3, ease: "power2.out" });
  });
}

/* ---------- HUD ---------- */
function hudIn() {
  gsap.to(".hud-brand-w .hud-brand-link", { y: "0%", opacity: 1, duration: 1, ease: "power1.out" });
  gsap.to(".hud-nav-w .hud-nav-flex", { y: "0%", opacity: 1, duration: 1, ease: "power1.out" });
  gsap.to(".hud-scroll-w", { opacity: 1, duration: 1, ease: "power1.out" });
  gsap.to(".hud-menu-o .hud-menu-w, .hud-menu-o .hud-menu-bg", { y: "0%", opacity: 1, duration: 1, ease: "power1.out" });
}

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
    btn.classList.toggle("is-open");
    o.classList.toggle("is-open");
    clearTimeout(timer);
    gsap.killTweensOf([rows, socials, bg, content, toggle]);
    if (!open) {
      gsap.set([rows, socials], { y: "0%" });
      gsap.set(toggle, { x: "0%" });
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

  // colour mode
  function setMode(m) {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(m);
    toggle.setAttribute("mode-toggle", m);
    toggle.setAttribute("aria-pressed", String(m === "dark"));
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", m === "dark" ? "#1d1d1d" : "#e5e4e0");
  }
  const flip = () => { const cur = document.documentElement.classList.contains("dark") ? "dark" : "light"; const next = cur === "light" ? "dark" : "light"; try { localStorage.setItem("mode", next); } catch (e) {} setMode(next); };
  toggle.addEventListener("click", flip);
  toggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
}

/* ---------- the orb ---------- */
let orbApi = null;
function initOrb() {
  const host = $("[data-orb]");
  if (!host) return;
  const start = () => {
    try {
      const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
      if (!gl || !window.createOrb) throw new Error("no webgl");
      orbApi = window.createOrb(host, { maxDpr: window.isTabletOrBelow ? 1.25 : 1.5, segments: window.isTabletOrBelow ? 140 : 220 });
    } catch (e) {
      host.classList.add("no-webgl");
    }
  };
  if (window.createOrb) start();
  else {
    let done = false;
    window.addEventListener("orb-ready", () => { if (!done) { done = true; start(); } }, { once: true });
    setTimeout(() => { if (!done) { done = true; start(); } }, 4000);
  }
  // pause the render loop when the tab is hidden
  document.addEventListener("visibilitychange", () => orbApi && orbApi.setPaused(document.hidden));
}

let outlineSpin1, outlineSpin2, spinRaf, lastY = 0;
function initOutlines() {
  const a = $('[orb-outline="1"]'), b = $('[orb-outline="2"]');
  outlineSpin1 = gsap.to(a, { rotation: 360, duration: 100, repeat: -1, ease: "none", force3D: true });
  outlineSpin2 = gsap.to(b, { rotation: -360, duration: 100, repeat: -1, ease: "none", force3D: true });
  const tick = () => {
    const dy = window.scrollY - lastY; lastY = window.scrollY;
    const ts = Math.max(1, Math.abs(dy) * 1);
    outlineSpin1.timeScale(ts); outlineSpin2.timeScale(ts);
    spinRaf = requestAnimationFrame(tick);
  };
  spinRaf = requestAnimationFrame(tick);
}

/* the orb's journey down the page — keyframes scrubbed against total scroll */
function initOrbScroll() {
  const n = $("[data-orb]"), e = $('[orb-out-w="1"]'), t = $('[orb-out-w="2"]');
  const st = { trigger: ".page-w", start: "top top", end: "bottom bottom", scrub: true, immediateRender: false };
  gsap.timeline({ scrollTrigger: st })
    .to(n, { x: "50vw", scale: 2, duration: 0.15, ease: "power2.out" })
    .to(n, { x: "-50vw", y: "-20vh", scale: 1.5, duration: 0.15, ease: "power2.inOut" })
    .to(n, { x: "0vw", y: "50vh", scale: 0, duration: 0.05 })
    .to(n, { x: "0vw", scale: 0, duration: 0.025 })
    .to(n, { x: "0vw", y: "0vh", scale: 1, duration: 0.125 })
    .to(n, { x: "-25vw", y: "20vh", scale: 1.5, duration: 0.1 })
    .to(n, { x: "-60vw", y: "-75vh", scale: 0, ease: "power1.out", duration: 0.05 })
    .to(n, { x: "0vw", y: "0vh", scale: 0, duration: 0.3 });
  gsap.timeline({ scrollTrigger: st })
    .to(e, { x: "10vw", y: "0vh", scale: 1.2, duration: 0.15, overwrite: "auto" })
    .to(e, { x: "-30vw", y: "0vh", scale: 1.3, duration: 0.15 })
    .to(e, { x: "0vw", y: "50vh", scale: 1, duration: 0.05 })
    .to(e, { x: "0vw", y: "50vh", scale: 0.8, duration: 0.025 })
    .to(e, { x: "0vw", y: "0vh", scale: 1, duration: 0.125 })
    .to(e, { x: "30vw", y: "-20vh", scale: 0.7, duration: 0.15 })
    .to(e, { x: "0vw", y: "0vh", scale: 1, duration: 0.05 })
    .to(e, { x: "0vw", y: "0vh", scale: 0, duration: 0.25 })
    .to(e, { x: "49vw", y: "0vh", scale: 1, duration: 0.05 });
  gsap.timeline({ scrollTrigger: st })
    .to(t, { x: "25vw", y: "0vh", scale: 1.3, duration: 0.15, overwrite: "auto" })
    .to(t, { x: "-9vw", y: "32vh", scale: 0.6, duration: 0.15 })
    .to(t, { x: "0vw", y: "50vh", scale: 1, duration: 0.05 })
    .to(t, { x: "0vw", y: "50vh", scale: 0.8, duration: 0.025 })
    .to(t, { x: "0vw", y: "0vh", scale: 1, duration: 0.125 })
    .to(t, { x: "0vw", y: "14vh", scale: 1.2, duration: 0.15 })
    .to(t, { x: "0vw", y: "0vh", scale: 0.6, duration: 0.05 })
    .to(t, { x: "0vw", y: "0vh", scale: 0, duration: 0.25 })
    .to(t, { x: "29vw", y: "0vh", scale: 1.5, duration: 0.05 });
}

/* ---------- hero ---------- */
function heroIntro(fromPreloader) {
  const orb = $("[data-orb]"), o1 = $('[orb-outline="1"]'), o2 = $('[orb-outline="2"]');
  const chars = $$(".c.is-home-hero [split-hero] .char");
  document.body.style.cursor = "progress";
  setTimeout(() => window.SScroll.stop(), 50);

  if (window.isTabletOrBelow) {
    gsap.set(chars, { y: "-101%", autoAlpha: 0 });
    gsap.to(chars, { y: "0%", autoAlpha: 1, duration: 1, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
  } else {
    gsap.set(chars, { y: "-101%" });
    gsap.to(chars, { y: "0%", duration: 1, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
  }

  if (!fromPreloader) {
    gsap.set(orb, { autoAlpha: 0, scale: 0 });
    gsap.set([o1, o2], { autoAlpha: 0, scale: 0 });
  }
  gsap.to(orb, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 1.2, ease: "power2.inOut", delay: fromPreloader ? 0.2 : 0.4 });
  gsap.to(o1, { autoAlpha: 1, scale: 1, duration: 2, ease: "power2.inOut" });
  gsap.to(o2, { delay: 1, autoAlpha: 1, scale: 1, duration: 2, ease: "power2.inOut" });
  if (window.isTabletOrBelow) {
    gsap.to(o1, { scale: 0.9, duration: 2, ease: "power2.inOut", delay: 2 });
    gsap.to(o2, { scale: 0.6, duration: 2.5, ease: "power2.inOut", delay: 3 });
  } else {
    gsap.to(o1, { scale: 1.3, duration: 2, ease: "power2.inOut", delay: 2, onComplete() { gsap.to(o1, { scale: 1.2, duration: 2, ease: "power2.inOut" }); } });
    gsap.to(o2, { scale: 0.9, duration: 2.5, ease: "power2.inOut", delay: 3 });
  }

  gsap.from('[hh-tb="1"]', { delay: 1, x: "10em", duration: 1, ease: "power2.inOut" });
  gsap.from('[hh-tb="2"]', { delay: 1.1, x: "-10em", duration: 1, ease: "power2.inOut" });
  gsap.from('[hh-tb="3"]', { delay: 1.2, x: "10em", duration: 1, ease: "power2.inOut", onComplete() {
    document.body.style.cursor = "auto";
    window.SScroll.start();
    if (!window.isTabletOrBelow) { heroScroll(); initOrbScroll(); }
    ScrollTrigger.refresh();
  } });
}

function heroScroll() {
  const hero = $("[home-hero]");
  const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  gsap.to('[hh-tb="1"]', { x: "-20em", ease: "power2.out", scrollTrigger: st });
  gsap.to('[hh-tb="2"]', { x: "-10em", ease: "power2.out", scrollTrigger: st });
  gsap.to('[hh-tb="3"]', { x: "-5em", ease: "power2.out", scrollTrigger: st });
  gsap.to($$("[split-hero] .char"), { y: "101%", autoAlpha: 0, stagger: { each: 0.03, from: "random" }, scrollTrigger: st });
}

/* ---------- work cards ---------- */
function initWork() {
  const items = $$(".hcs-item-w");
  items.forEach((el, i) => {
    el.addEventListener("mouseenter", () => {
      const tags = el.querySelectorAll(".hcs-title-w .text-mini");
      gsap.killTweensOf(tags);
      gsap.to(tags, { y: 0, stagger: 0.1, duration: 0.3 });
    });
    el.addEventListener("mouseleave", () => {
      const tags = el.querySelectorAll(".hcs-title-w .text-mini");
      gsap.killTweensOf(tags);
      gsap.to(tags, { y: "0.75em", stagger: 0.05, duration: 0.6 });
    });
    if (window.isTabletOrBelow) return;
    const from = (i + 1) % 2 !== 0 ? "10em" : "-10em";
    ScrollTrigger.create({ trigger: "[home-work]", start: "top bottom", end: "bottom top", scrub: true,
      onUpdate: (s) => gsap.to(el, { y: gsap.utils.interpolate(from, "0em", s.progress), overwrite: "auto" }) });
  });
  // the on-stage card opens the demo in the lightbox
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
  items.forEach((it) => it.addEventListener("mouseenter", () => {
    items.forEach((x) => (x.style.opacity = "0.4"));
    it.style.opacity = "1";
    tag.textContent = it.getAttribute("data-client-item") || base;
  }));
  section.addEventListener("mouseleave", () => { items.forEach((x) => (x.style.opacity = "1")); tag.textContent = base; });
}

/* ---------- 3d grid ---------- */
function initGrid() {
  const n = $("[grid-anim]");
  if (!n || window.isTabletOrBelow) return;
  const items = $$(".hg-grid-item", n);
  const inners = items.map((a) => a.querySelector(".hg-grid-inner")).filter(Boolean);
  const labels = $$(".text-small", n);
  gsap.set(labels, { fontSize: "3em" });
  gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: n, start: "top bottom+=5%", end: "bottom top-=5%", scrub: true, id: "gridTimelineTrigger" } })
    .set(items, { transformOrigin: "50% 0%", z: () => gsap.utils.random(-6000, -100), rotationX: () => gsap.utils.random(-65, -25), autoAlpha: 0.5 })
    .to(n, { scale: 0.8 }, 0)
    .to(items, { xPercent: () => gsap.utils.random(-150, 150), yPercent: () => gsap.utils.random(-300, 300), rotationX: 0, autoAlpha: 2 }, 0)
    .to(n, { z: 6500 }, 0)
    .fromTo(inners, { scale: 2 }, { scale: 1 }, 0)
    .fromTo(labels, { fontSize: "1.2em" }, { fontSize: "0.7em" }, 0);

  const words = $$(".hg-grid-overlay [split-text] .word");
  if (words.length) {
    const from = { autoAlpha: 0, yPercent: 101, duration: 2, ease: "power4.inOut" };
    const to = { autoAlpha: 1, yPercent: 0, stagger: { each: 0.05, from: "random" }, duration: 2, ease: "power4.inOut" };
    gsap.timeline({ scrollTrigger: { trigger: n, start: "top bottom-=40%", end: "center top", scrub: true, id: "wordsTimelineTrigger" } })
      .fromTo(words, from, to)
      .to(words, { ...from, stagger: { each: 0.05, from: "start" } });
  }
}

/* ---------- closing section ---------- */
function initHsc() {
  const track = "[hsc-track]";
  gsap.to("[hsc-scale]", { scale: 29, scrollTrigger: { trigger: track, scrub: true, start: "top top", end: "bottom top" } });
  gsap.to("[hsc-img]", { width: "20.5em", height: "20.5em", scrollTrigger: { trigger: track, scrub: true, start: "top top", end: "bottom top" } });
  gsap.to("[hsc-rotate]", { rotation: 180, scrollTrigger: { trigger: track, scrub: true, start: "top top", end: "bottom top" } });
  gsap.fromTo("[hsc-text]", { x: "50vw" }, { x: "0vw", scrollTrigger: { trigger: track, scrub: true, start: "top top", end: "bottom-=100 bottom" } });
  ScrollTrigger.create({ trigger: track, scrub: true, start: "bottom center", end: "bottom top",
    onUpdate: (s) => gsap.to(".s.is-hsc", { scale: 1 - 0.1 * s.progress, boxShadow: `0 0 0 ${1.5 * s.progress}px var(--line)` }) });
  gsap.fromTo("[hsc-img]", { scale: 0, rotation: 0 }, { scale: 1, rotation: 45, scrollTrigger: { trigger: track, scrub: true, start: "top center", end: "top top" } });
  $$("[hsc-track] .word").forEach((w, i) => {
    gsap.fromTo(w, { yPercent: 0 }, { yPercent: i % 2 === 0 ? -101 : 101, scrollTrigger: { trigger: track, scrub: true, start: "bottom bottom-=100", end: "bottom center-=100" } });
  });
  gsap.fromTo("[hsc-text]", { y: "0vh" }, { y: "20vh", scrollTrigger: { trigger: track, scrub: true, start: "bottom bottom", end: "bottom+=100 center" } });
}

/* ---------- videos ---------- */
function initVideos() {
  const vids = $$("video[home-vid]");
  if (!vids.length) return;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { if (!v.dataset.loaded) { v.dataset.loaded = "1"; v.load(); } const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    }), { rootMargin: "25% 0px" });
    vids.forEach((v) => io.observe(v));
  } else {
    setTimeout(() => vids.forEach((v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); }), 1500);
  }
}

/* ---------- lightbox ---------- */
function openLightbox(src, poster, title) {
  const box = $("#lightbox"), vid = box.querySelector("video"), t = box.querySelector(".lightbox__title");
  t.textContent = title || "";
  if (poster) vid.poster = poster;
  vid.src = src;
  box.classList.add("is-open");
  box.setAttribute("aria-hidden", "false");
  window.SScroll.stop();
  const p = vid.play(); if (p && p.catch) p.catch(() => {});
}
function initLightbox() {
  const box = $("#lightbox"), vid = box.querySelector("video");
  const close = () => { box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true"); vid.pause(); vid.removeAttribute("src"); vid.load(); window.SScroll.start(); };
  box.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
}

/* ---------- preloader ---------- */
function runPreloader(done) {
  let first = true;
  try { first = localStorage.getItem("visited") === null; localStorage.setItem("visited", "true"); } catch (e) {}
  let ran = false;
  try { ran = !!sessionStorage.getItem("preloaderHasRun"); } catch (e) {}
  const pre = $("[preloader]");
  if (ran || reduceMotion || !pre) { if (pre) pre.remove(); done(false); return; }

  const strokes = $$(".st-x rect, .st-c");
  const fill = $(".ob-fill-fill"), pct = $("[pre-percent]"), textChars = $$("[pre-text] .char");
  const orb = $("[data-orb]"), o1 = $('[orb-outline="1"]'), o2 = $('[orb-outline="2"]');
  const dur = first ? 3 : 1;

  gsap.set(pre, { autoAlpha: 1 });
  gsap.set(orb, { autoAlpha: 0, scale: 0, x: "8em", y: "8em" });
  gsap.set([o1, o2], { autoAlpha: 0, scale: 0 });
  gsap.set(textChars, { yPercent: 101 });
  gsap.set(pct, { yPercent: 101 });
  strokes.forEach((p) => {
    const L = p.getTotalLength();
    gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
    gsap.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1, ease: "power1.inOut" });
  });
  gsap.to(textChars, { delay: 0.5, yPercent: 0, duration: 1, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
  gsap.to(pct, { delay: 0.5, yPercent: 0, duration: 1, ease: "power4.inOut" });

  const counter = { v: 0 };
  gsap.to(counter, { v: 100, duration: dur, delay: 1.5, ease: "power2.inOut", onUpdate() { pct.textContent = String(Math.round(counter.v)); } });
  gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: dur, ease: "power2.inOut", delay: 1.5, onComplete() {
    gsap.to(textChars, { delay: 0.5, yPercent: -101, duration: 1, ease: "power4.inOut", stagger: { each: 0.03, from: "random" } });
    gsap.to(pct, { delay: 0.5, yPercent: -101, duration: 1, ease: "power4.inOut" });
    gsap.to(".ob-fill-mask", { delay: 0.5, duration: 0.8, ease: "power2.inOut", clipPath: "inset(0% 0% 100% 0%)" });
    strokes.forEach((p) => { const L = p.getTotalLength(); gsap.fromTo(p, { strokeDashoffset: 0 }, { strokeDashoffset: L, delay: 0.5, duration: 1, ease: "power1.inOut" }); });
    // the dot of the mark becomes the orb
    gsap.to(orb, { autoAlpha: 1, scale: 0.09, duration: 0.6, delay: 0.5, ease: "power2.inOut" });
    gsap.delayedCall(1.3, () => {
      try { sessionStorage.setItem("preloaderHasRun", "1"); } catch (e) {}
      gsap.to(pre, { autoAlpha: 0, duration: 0.3, onComplete: () => pre.remove() });
      done(true);
    });
  } });
}

/* ---------- boot ---------- */
function boot() {
  if (!window.gsap || !window.ScrollTrigger || !window.SplitType) {
    document.body.removeAttribute("data-start");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  $("#year") && ($("#year").textContent = String(new Date().getFullYear()));

  renderClients();
  renderWork();
  renderAwards();
  renderTiles();
  splitAll();
  initScroll();
  initMenu();
  initOrb();
  initOutlines();
  initCursor();
  initLightbox();
  gsap.set("[data-orb-wrap]", { autoAlpha: 1 });
  // hide what the intro animates in, then reveal the body (the preloader sits behind the empty page)
  gsap.set(".c.is-home-hero [split-hero] .char", { y: "-101%" });
  gsap.set("[data-orb]", { autoAlpha: 0, scale: 0 });
  gsap.set('[orb-outline="1"], [orb-outline="2"]', { autoAlpha: 0, scale: 0 });
  document.body.removeAttribute("data-start");

  runPreloader((fromPreloader) => {
    hudIn();
    heroIntro(fromPreloader);
    initReveals();
    initStaggerHover();
    initWork();
    initClients();
    initGrid();
    initHsc();
    initVideos();
    if (window.isTabletOrBelow) { window.SScroll.start(); }
    ScrollTrigger.refresh();
  });

  // crossing the tablet breakpoint changes the whole layout — reload to rebuild
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if ((window.innerWidth <= 991) !== window.isTabletOrBelow) location.reload(); else ScrollTrigger.refresh(); }, 250);
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
