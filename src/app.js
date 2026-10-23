/* =========================================================================
   henry. — the ask bar. Every keystroke runs the decision model (in this
   tab, no server) to pick the ghost text; Enter opens the cards. Nothing on
   screen is generated: every word comes from content.js.
   ========================================================================= */

import { INTENTS, HINTS, PINNED, PRS, personaById, personaFor, itemById, intentById } from "./content.js";
import { fillButtons } from "./fill.js";
import { createTrail } from "./trail.js";
import { boot } from "./boot.js";
import { ditherTiles } from "./tiledither.js";
import * as dither from "./dither.js";
import { createModel } from "./model.js";
import { createSuggester } from "./suggest.js";
import { createPond } from "./pond.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

const OPEN_AT = 0.3;   // below this, Enter offers choices instead of guessing
const GUESS_AT = 0.35; // the best-guess chip shows above this when there's no ghost text

const bar = $(".bar"), input = $("[data-q]"), typedEl = $("[data-typed]"), restEl = $("[data-rest]");
const chips = $("[data-chips]"), say = $("[data-say]"), results = $("[data-results]"), cards = $("[data-cards]");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let model = null, ranked = [], current = null; // current = { text, ghost, intent } the Tab key would accept
const { suggest } = createSuggester(INTENTS);

/* ---------- the koi pond, with the big word drawn into it ---------- */
// clicks on anything you can use stay with it; a click on open water feeds the koi
const pond = createPond($("[data-pond]"), { ignore: "a, button, input, textarea, select, label, form, .card, .pins, .pr-list, .results, .top" });
document.body.classList.add("is-ready");

/* ---------- the model ---------- */
fetch("model/model.json?v=20261020c")
  .then((r) => r.json())
  .then((json) => { model = createModel(json); update(); })
  .catch((e) => console.warn("model failed to load; falling back to suggestions only", e));

const probOf = (id) => { const r = ranked.find((x) => x.id === id); return r ? r.p : 0; };

/* ---------- ghost text, on every keystroke ---------- */
let hintIdx = 0, anim = null, lastText = "", lastTarget = "", guessId = null;
const INTRO_HINTS = ["I run a startup", "I'm hiring engineers", "I write code", "I work in security", "I design things", "I teach", "I'm a student", "just looking around"];
const hints = () => (persona ? HINTS : INTRO_HINTS);
function update() {
  const text = input.value;
  if (anim) return;
  if (!persona) {   // the intro: the box only asks who you are, so no suggestions or chips yet
    current = text ? null : { text: INTRO_HINTS[hintIdx % INTRO_HINTS.length], ghost: INTRO_HINTS[hintIdx % INTRO_HINTS.length], intent: null };
    typedEl.textContent = text; restEl.textContent = current ? current.ghost : ""; restEl.classList.toggle("is-hint", !text);
    chips.innerHTML = ""; guessId = null; syncScroll();
    return;
  }
  ranked = model && text.trim() ? model.predict(text) : [];
  current = text ? suggest(text, probOf) : { text: HINTS[hintIdx % HINTS.length], ghost: HINTS[hintIdx % HINTS.length], intent: null };
  typedEl.textContent = text;
  const ghost = current ? current.ghost : "";
  // a new guess fades in; the same guess getting shorter as you type it does not
  const target = current && current.ghost ? current.text.toLowerCase() : "";
  if (target && target !== lastTarget) { restEl.classList.remove("is-new"); void restEl.offsetWidth; restEl.classList.add("is-new"); }
  lastTarget = target;
  restEl.textContent = ghost;
  restEl.classList.toggle("is-hint", !text);
  syncScroll();

  // no ghost text: offer the model's best guess as a chip instead. The chip is only rebuilt when the
  // guess changes, so it sits still while you type instead of popping in again on every key.
  const top = ranked[0];
  const guess = text.trim().length >= 3 && !current && top && top.p >= GUESS_AT ? top.id : null;
  if (guess !== guessId || !guess) {
    if (guessId || chips.querySelector(".is-guess")) chips.innerHTML = "";
    guessId = guess;
    if (guess) {
      const it = intentById[guess];
      const c = chip(`<span class="k">tab</span> ${esc(it.title)}`, () => accept({ text: it.suggest[0], intent: it.id }));
      c.classList.add("is-guess");
      chips.append(c);
    }
  }
  if (guess) { const it = intentById[guess]; current = { text: it.suggest[0], ghost: "", intent: it.id, chip: true }; }
  announce();
}
let sayT;
function announce() {
  clearTimeout(sayT);
  sayT = setTimeout(() => { say.textContent = input.value && current ? `Suggestion: ${current.text}` : ""; }, 600);
}
function syncScroll() { $(".ghost").scrollLeft = input.scrollLeft; }

function accept(s) {
  stopAnim();
  input.value = s.text; lastText = s.text;
  input.setSelectionRange(s.text.length, s.text.length);
  input.classList.remove("is-accepted"); void input.offsetWidth; input.classList.add("is-accepted");
  update();
  input.focus();
}

function chip(html, onClick) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.innerHTML = html;
  b.addEventListener("click", onClick);
  return b;
}

/* ---------- Enter: decide, then open ---------- */
// Enter: the bar stamps down and a ring rolls out through the pond
function stamp() {
  bar.classList.remove("is-stamp"); void bar.offsetWidth; bar.classList.add("is-stamp");
  const b = bar.getBoundingClientRect();
  pond.pulse(b.left + b.width / 2, b.top + b.height / 2);
}

function decide() {
  if (!persona) {   // the intro's answer: who you are picks your three projects
    const said = input.value.trim() || (current && current.text) || "";
    if (!said) return;
    input.value = ""; lastText = "";
    choose(personaFor(said), said);
    return;
  }
  stamp();
  // empty bar: Enter takes the example it's showing
  if (!input.value.trim()) { if (!current) return; accept(current); }
  const text = input.value.trim();
  // the ghost text is what they were looking at, so Enter takes it
  if (current && current.ghost) { open(current.intent, current.text); input.value = current.text; lastText = current.text; update(); return; }
  if (current && current.chip) { open(current.intent, text); return; }
  if (!ranked.length && model) ranked = model.predict(text);
  const top = ranked[0];
  if (top && top.p >= OPEN_AT) { open(top.id, text); return; }
  // not sure: three likeliest, plus everything
  chips.innerHTML = ""; guessId = null;
  chips.append(Object.assign(document.createElement("span"), { className: "chips-label", textContent: "did you mean" }));
  for (const r of ranked.slice(0, 3)) chips.append(chip(esc(intentById[r.id].title), () => open(r.id, text)));
  chips.append(chip("everything", () => open("browse")));
}

/* ---------- the spoken answer: Claude Haiku 5.5 (api/ask.js), with follow-ups ---------- */
const answerEl = $("[data-answer]"), turnsEl = $("[data-turns]"), followForm = $("[data-follow]");
let asking = null, turns = [], askIntent = null;   // turns: [{q, a}] so follow-ups keep the context
async function ask(q, intentId, followUp = false) {
  if (asking) asking.abort();
  if (!followUp) { turns = []; turnsEl.innerHTML = ""; answerEl.hidden = true; askIntent = intentId; }
  if (!q || location.protocol === "file:") return;
  const ctl = (asking = new AbortController());
  const turn = document.createElement("div");
  turn.className = "turn";
  if (followUp) turn.append(Object.assign(document.createElement("p"), { className: "turn-q", textContent: q }));
  const a = Object.assign(document.createElement("p"), { className: "turn-a" });
  turn.append(a);
  try {
    const r = await fetch("api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q, intent: askIntent, history: turns, who: persona }), signal: ctl.signal });
    if (!r.ok || !r.body) { if (followUp) { a.textContent = "Couldn't answer that one right now."; a.classList.add("is-done"); turnsEl.append(turn); } return; }
    // the box only appears once there are words to show, so an empty answer never flashes up and vanishes
    const reader = r.body.getReader(), dec = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      a.textContent += dec.decode(value, { stream: true });
      if (!turn.isConnected && a.textContent.trim()) { turnsEl.append(turn); answerEl.hidden = false; }
    }
    a.classList.add("is-done");
    if (!a.textContent.trim()) { if (followUp) { a.textContent = "Couldn't answer that one right now."; turnsEl.append(turn); } return; }
    turns.push({ q, a: a.textContent.trim() });
    turns = turns.slice(-6);
  } catch (e) { /* aborted or failed: leave the cards */ }
}
followForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = followForm.elements.q, q = f.value.trim();
  if (!q) return;
  f.value = "";
  ask(q, askIntent, true);
});
followForm.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); followForm.elements.q.blur(); } });

function open(intentId, q = "") {
  const intent = intentById[intentId];
  if (!intent) return;
  ask(q, intentId);
  $("[data-results-title]").innerHTML = [...intent.title].map((c, i) => `<span class="ch" style="--i:${i}">${esc(c)}</span>`).join("");
  cards.innerHTML = intent.ids.map((id, i) => card(itemById[id], i)).join("");
  results.hidden = false;
  results.classList.toggle("is-single", intent.ids.length === 1);
  document.body.classList.add("has-results");
  pond.show(intent.engrave);
  chips.innerHTML = ""; guessId = null;
  history.replaceState(null, "", "#" + intent.id);
  // the bar already rises to the top as the page's top padding collapses, so just go back to the top;
  // scrolling to the results as well raced that collapse and flung the answer off the screen
  scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function close(focus = true) {
  if (asking) { asking.abort(); asking = null; }
  results.hidden = true;
  document.body.classList.remove("has-results");
  pond.show("henry.");
  history.replaceState(null, "", location.pathname);
  if (focus) input.focus();
}

function card(it, i = 0) {
  const links = (it.links || []).map((l) => `<a class="act" href="${esc(l.href)}"${l.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${esc(l.label)}</a>`).join("");
  const tilt = [-2, 1.5, -1, 2][i % 4];
  return `<article class="card" style="--i:${i};--r:${tilt}deg"${it.current ? " data-current" : ""}>
    <p class="kicker">${esc(it.kicker)}</p>
    <h3>${esc(it.title)}</h3>
    ${it.body ? `<p>${esc(it.body)}</p>` : ""}
    ${it.list ? `<ul class="list">${it.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${it.tags ? `<p class="tags">${it.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</p>` : ""}
    ${it.images ? `<div class="gallery">${it.images.map((im) => `<figure class="fig"><a href="${esc(im.src)}" target="_blank" rel="noreferrer"><img src="${esc(im.src)}" alt="${esc(im.alt)}" loading="lazy" /></a><figcaption>${esc(im.cap)}</figcaption></figure>`).join("")}</div>` : ""}
    ${it.image ? `<figure class="fig"><img src="${esc(it.image.src)}" alt="${esc(it.image.alt)}" loading="lazy" /><figcaption>${esc(it.image.cap)}</figcaption></figure>` : ""}
    ${links ? `<div class="acts">${links}</div>` : ""}
  </article>`;
}

/* ---------- pinned: three things up front; once we know who you are, three picked for you ---------- */
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
let persona = personaById[store.get("henry.who")] ? store.get("henry.who") : null;

function renderPins() {
  const p = personaById[persona];
  const items = p ? p.picks.map((id) => itemById[id]) : PINNED;
  $("[data-picked-for]").textContent = p ? `picked for ${p.noun}` : "pinned";
  $("[data-change]").hidden = !p;
  $("[data-pins]").innerHTML = items.map((it, i) => `<button type="button" class="pin" data-pin="${esc(it.id)}" style="--i:${i}">
  <span class="pin-kicker">${esc(it.kicker)}</span><span class="pin-title">${esc(it.title)}</span>
  <span class="pin-sub">${esc(it.tease || firstSentence(it))}</span></button>`).join("");
}
// the pin's teaser: its own one-liner (tease) when it has one, else the first sentence of the card, or the first two when the first is only a few words
const firstSentence = (it) => { const s = (it.body || (it.list || []).join(", ")).split(/(?<=[.!?])\s/); return s[0].length < 40 && s[1] ? s[1] : s[0]; };
$("[data-pins]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pin]");
  if (!b) return;
  // the matching intent has the same id; type its first suggestion in, then open it
  const intent = intentById[b.dataset.pin];
  if (!intent) return;
  stopAnim();
  input.value = intent.suggest[0]; lastText = input.value; update();
  stamp(); open(intent.id, input.value);
});

/* ---------- the intro: "first, who are you?" ---------- */
function intro() {
  persona = null;
  document.body.classList.add("is-intro");
  renderPins();
  if (!results.hidden) close(false);
  pond.show("hello.");
  input.setAttribute("aria-label", "Who are you?");
  stopAnim(); input.value = ""; lastText = ""; hintIdx = 0; typeHint();
  input.focus({ preventScroll: true });
}
function choose(id, said = "") {
  persona = id;
  store.set("henry.who", id);
  document.body.classList.remove("is-intro");
  document.body.classList.add("is-revealing");
  setTimeout(() => document.body.classList.remove("is-revealing"), 1600);
  input.setAttribute("aria-label", "Ask about anything Henry has built");
  renderPins(); hintIdx = 0; typeHint(); input.focus({ preventScroll: true });
  pond.show("henry.");
  stamp();
  // one visit per browser, counted under what they said they do
  if (!store.get("henry.counted")) { store.set("henry.counted", "1"); fetch("api/crowd", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "visit", role: id }) }).catch(() => {}); }
}
$("[data-change]").addEventListener("click", intro);

/* ---------- Henry's GitHub activity (visits are still logged in the background, just not shown) ---------- */
// the same dithered charts and list the visitor section had, filled from GitHub (api/prs.js) instead.
// Until that answers, and if it can't, the merged PRs in content.js stand in.
const DAY = 864e5, dayOf = (d) => new Date(d + "T12:00:00").getTime();
const dayName = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
function staticGh() {
  const prs = PRS.map((p) => ({ repo: p.repo, n: p.n, title: p.what, url: p.url, at: dayOf(p.merged), merged: true, private: false })).sort((a, b) => b.at - a.at);
  const sunday = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() - d.getDay() * DAY; };
  const weeks = [];
  for (let t = sunday(prs.at(-1).at), end = sunday(Date.now()); t <= end; t += 7 * DAY) weeks.push({ t, n: prs.filter((p) => sunday(p.at) === t).length });
  return { source: "static", unit: "pull requests", total: prs.length, prCount: prs.length, weeks, prs };
}
let gh = staticGh(), chart = null, repaint = [], regrow = [], seen = false;
const plural = (n, unit) => `${n} ${n === 1 ? unit.replace(/s$/, "") : unit}`;
function renderGh() {
  const shown = gh.prs.slice(0, 12);
  $("[data-prs]").innerHTML = shown.map((p) => `<li class="post"><span class="post-role">${esc(p.repo)}${p.n ? " #" + p.n : ""}</span>${p.url
    ? `<a class="post-text" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)} ↗</a>` : `<span class="post-text is-private">a pull request</span>`}<span class="post-t">${dayName(p.at)}</span></li>`).join("");
  $("[data-gh-unit]").textContent = gh.unit === "contributions" ? "contributions per week" : "pull requests per week";
  $("[data-days]").setAttribute("aria-label", `${gh.unit === "contributions" ? "Contributions" : "Pull requests"} per week. Drag, or use the arrow keys, to move through time.`);
  const tease = $("[data-tease]");
  // the hand-picked stand-ins are only a few of them, so they never get counted out loud
  tease.textContent = gh.source === "static" ? "My pull requests, newest first ↓" : `${plural(gh.prCount, "pull requests")}${gh.unit === "contributions" ? ` and ${gh.total} contributions this year` : ""}. See them ↓`; tease.hidden = false;
}
function drawGh() {
  // where they went: one dithered row per repo, holding (or hovering) a row lights it and shows its share
  const counts = {}; gh.prs.forEach((p) => { counts[p.repo] = (counts[p.repo] || 0) + 1; });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6), max = rows.length ? rows[0][1] : 1;
  const el = $("[data-roles]");
  el.innerHTML = rows.map(([repo, n]) => `<div class="row" tabindex="0"><span class="row-label">${esc(repo)}</span><canvas class="row-bar"></canvas><span class="row-n" data-plain="${n}" data-pct="${Math.round((n / gh.prs.length) * 100)}%">${n}</span></div>`).join("");
  const bars = [...el.querySelectorAll("canvas")].map((c, i) => dither.bar(c, rows[i][1] / max, false, reduceMotion));
  repaint = bars.map((b) => b.paint); regrow = bars.map((b) => b.grow);

  // per week: drag through time. At rest the readout shows the whole count; pointing at (or arrowing to) a week shows that week
  const days = $("[data-days]"), weeks = gh.weeks;
  const fresh = days.cloneNode(true); days.replaceWith(fresh);   // a redraw (GitHub answering) starts on a clean canvas
  let pointing = false;
  fresh.addEventListener("pointerenter", () => { pointing = true; });
  fresh.addEventListener("pointerleave", () => { pointing = false; });
  fresh.addEventListener("keydown", () => { pointing = true; }, true);
  fresh.addEventListener("blur", () => { pointing = false; });
  if (!weeks.length) return;
  chart = dither.timeline(fresh, weeks.map((w) => w.n), {
    span: Math.min(weeks.length, innerWidth < 700 ? 20 : 34), reduce: reduceMotion,
    onFocus: (i) => {
      $("[data-readout-n]").textContent = pointing ? plural(weeks[i].n, gh.unit) : gh.source === "static" ? "pull requests" : plural(gh.total, gh.unit);
      $("[data-readout-d]").textContent = !pointing ? (gh.unit === "contributions" ? "in the last year" : `since ${dayName(gh.prs.at(-1).at)}`) : i === weeks.length - 1 ? "this week" : `week of ${dayName(weeks[i].t)}`;
    },
    onPan: (a, b) => { $("[data-days-from]").textContent = dayName(weeks[a].t); $("[data-days-to]").textContent = b === weeks.length - 1 ? "this week" : dayName(weeks[b].t); },
  });
}
const lightRow = (row, on) => { const el = $("[data-roles]"), i = [...el.children].indexOf(row), c = row.querySelector("canvas"), nEl = row.querySelector(".row-n");
  c.dataset.lit = on ? "1" : ""; nEl.textContent = on ? nEl.dataset.pct : nEl.dataset.plain; row.classList.toggle("is-lit", on); repaint[i](); };
$("[data-roles]").addEventListener("pointerover", (e) => { const r = e.target.closest(".row"); if (r) lightRow(r, true); });
$("[data-roles]").addEventListener("pointerout", (e) => { const r = e.target.closest(".row"); if (r && !r.contains(e.relatedTarget)) lightRow(r, false); });
$("[data-roles]").addEventListener("focusin", (e) => { if (e.target.closest(".row")) lightRow(e.target, true); });
$("[data-roles]").addEventListener("focusout", (e) => { if (e.target.closest(".row")) lightRow(e.target, false); });
renderGh();
fetch("api/prs").then((r) => (r.ok ? r.json() : null)).then((d) => {
  if (!d || !Array.isArray(d.prs) || !d.prs.length) return;
  gh = d; renderGh(); if (seen) drawGh();
}).catch(() => {});
// the charts grow in every time they scroll into view, not just the first time
new IntersectionObserver((es) => {
  if (!es.some((e) => e.isIntersecting)) return;
  if (!seen) { seen = true; drawGh(); return; }
  if (chart) chart.replay(); regrow.forEach((f) => f());
}, { threshold: 0.25 }).observe($("[data-crowd]"));
addEventListener("resize", () => { if (chart) chart.resize(); repaint.forEach((f) => f()); });

/* ---------- wiring ---------- */
input.addEventListener("input", () => {
  const text = input.value;
  stopAnim();
  if (!text && lastText) {
    // the prompt was removed: take the answer away too, and untype what was there
    if (!results.hidden) close(false);
    if (lastText.length > 1) { const was = lastText; lastText = ""; untype(was); return; }
  }
  lastText = text;
  update();
});
input.addEventListener("scroll", syncScroll);
input.addEventListener("keydown", (e) => {
  const atEnd = input.selectionStart === input.value.length;
  if ((e.key === "Tab" && !e.shiftKey) || (e.key === "ArrowRight" && atEnd)) {
    if (current && (current.ghost || current.chip)) { e.preventDefault(); accept(current); }
  } else if (e.key === "Escape") {
    if (!results.hidden) close(); else if (input.value) { const was = input.value; input.value = ""; lastText = ""; untype(was); }
  }
});
// Esc closes the answer from anywhere on the page, not just the bar
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && e.target !== input && !results.hidden) close(); });
$("[data-ask]").addEventListener("submit", (e) => { e.preventDefault(); decide(); });
$("[data-close]").addEventListener("click", close);
$("[data-browse]").addEventListener("click", () => open("browse"));
$("[data-home]").addEventListener("click", (e) => { e.preventDefault(); const was = input.value; input.value = ""; lastText = ""; close(); untype(was); });

/* ---------- untyping: a cleared prompt deletes itself backwards ---------- */
function stopAnim() { if (anim) { clearTimeout(anim.t); anim = null; } input.classList.remove("is-untyping"); typedEl.classList.remove("is-untyping"); }

// runs `steps` (strings to show, in order) through one span, then calls done
function play(el, steps, every, done) {
  stopAnim();
  anim = { t: 0 };
  let i = 0;
  const tick = () => {
    if (!anim) return;
    if (i >= steps.length) { anim = null; done(); return; }
    el.textContent = steps[i++];
    anim.t = setTimeout(tick, every);
  };
  tick();
}
const backwards = (t) => Array.from({ length: t.length + 1 }, (_, i) => t.slice(0, t.length - i));
const forwards = (t) => Array.from({ length: t.length + 1 }, (_, i) => t.slice(0, i));

function untype(text) {
  if (reduceMotion || text.length < 2) { update(); return; }
  input.classList.add("is-untyping"); typedEl.classList.add("is-untyping");
  restEl.textContent = ""; chips.innerHTML = ""; guessId = null;
  play(typedEl, backwards(text), Math.max(9, Math.min(28, 420 / text.length)), () => {
    input.classList.remove("is-untyping"); typedEl.classList.remove("is-untyping");
    typedEl.textContent = "";
    typeHint();
  });
}

// the example in the empty bar types itself in
function typeHint() {
  if (input.value) { update(); return; }
  const h = hints()[hintIdx % hints().length];
  if (reduceMotion) { update(); return; }
  restEl.classList.add("is-hint"); restEl.classList.remove("is-new");
  play(restEl, forwards(h), 26, update);
}

// rotate the example: untype the old one, type the next
setInterval(() => {
  if (input.value || anim || document.hidden) return;
  const old = hints()[hintIdx % hints().length];
  hintIdx = (hintIdx + 1) % hints().length;
  if (reduceMotion) { update(); return; }
  play(restEl, backwards(old), 14, typeHint);
}, 4200);

// deep links: henry93.vercel.app/#crawft
if (location.hash && intentById[location.hash.slice(1)]) setTimeout(() => open(location.hash.slice(1)), 50);

createTrail($("[data-trail]"));
ditherTiles($("[data-pins]"));
fillButtons(document.querySelectorAll(".key.fill"));
renderPins();
if (!persona && location.hash) { persona = "curious"; renderPins(); }   // deep links skip the intro
if (!persona) intro();
else { update(); typeHint(); input.focus({ preventScroll: true }); }
// the opening plays over all of that, once per browser; when it clears, the prompt is ready to type into
boot({ pond, skip: !!location.hash, word: persona ? "henry." : "hello." }).then(() => input.focus({ preventScroll: true }));
