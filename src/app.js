/* =========================================================================
   henry. — the ask bar. Every keystroke runs the decision model (in this
   tab, no server) to pick the ghost text; Enter opens the cards. Nothing on
   screen is generated: every word comes from content.js.
   ========================================================================= */

import { INTENTS, HINTS, itemById, intentById } from "./content.js";
import { createModel } from "./model.js";
import { createSuggester } from "./suggest.js";
import { createEngraving } from "./shader.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

const OPEN_AT = 0.3;   // below this, Enter offers choices instead of guessing
const GUESS_AT = 0.35; // the best-guess chip shows above this when there's no ghost text

const input = $("[data-q]"), typedEl = $("[data-typed]"), restEl = $("[data-rest]"), tabBtn = $("[data-tab]");
const chips = $("[data-chips]"), say = $("[data-say]"), results = $("[data-results]"), cards = $("[data-cards]");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let model = null, ranked = [], current = null; // current = { text, ghost, intent } the Tab key would accept
const { suggest } = createSuggester(INTENTS);

/* ---------- the engraving ---------- */
let engraving = null;
(async () => {
  try { await Promise.race([document.fonts.load('400 120px "Instrument Serif"'), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  try { engraving = createEngraving($("[data-engraving]"), { reduceMotion }); } catch (e) { console.warn(e); }
  if (!engraving) document.body.classList.add("no-gl");
  document.body.classList.add("is-ready");
})();

/* ---------- the model ---------- */
fetch("model/model.json?v=20261011a")
  .then((r) => r.json())
  .then((json) => { model = createModel(json); update(); })
  .catch((e) => console.warn("model failed to load; falling back to suggestions only", e));

const probOf = (id) => { const r = ranked.find((x) => x.id === id); return r ? r.p : 0; };

/* ---------- ghost text, on every keystroke ---------- */
let hintIdx = 0;
function update() {
  const text = input.value;
  ranked = model && text.trim() ? model.predict(text) : [];
  current = text ? suggest(text, probOf) : { text: HINTS[hintIdx], ghost: HINTS[hintIdx], intent: null };
  typedEl.textContent = text;
  restEl.textContent = current ? current.ghost : "";
  restEl.classList.toggle("is-hint", !text);
  tabBtn.hidden = !current;
  syncScroll();

  // no ghost text: offer the model's best guess as a chip instead
  chips.innerHTML = "";
  const top = ranked[0];
  if (text.trim().length >= 3 && !current && top && top.p >= GUESS_AT) {
    const it = intentById[top.id];
    chips.append(chip(`<span class="k">tab</span> ${esc(it.title)}`, () => accept({ text: it.suggest[0], intent: it.id })));
    current = { text: it.suggest[0], ghost: "", intent: it.id, chip: true };
    tabBtn.hidden = false;
  }
  engraving && engraving.tilt(Math.min(text.length, 40) * 0.004);
  announce();
}
let sayT;
function announce() {
  clearTimeout(sayT);
  sayT = setTimeout(() => { say.textContent = input.value && current ? `Suggestion: ${current.text}` : ""; }, 600);
}
function syncScroll() { $(".ghost").scrollLeft = input.scrollLeft; }

function accept(s) {
  input.value = s.text;
  input.setSelectionRange(s.text.length, s.text.length);
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
function decide() {
  // empty bar: Enter takes the example it's showing
  if (!input.value.trim()) { if (!current) return; accept(current); }
  const text = input.value.trim();
  // the ghost text is what they were looking at, so Enter takes it
  if (current && current.ghost) { open(current.intent); input.value = current.text; update(); return; }
  if (current && current.chip) { open(current.intent); return; }
  if (!ranked.length && model) ranked = model.predict(text);
  const top = ranked[0];
  if (top && top.p >= OPEN_AT) { open(top.id); return; }
  // not sure: three likeliest, plus everything
  chips.innerHTML = "";
  chips.append(Object.assign(document.createElement("span"), { className: "chips-label", textContent: "did you mean" }));
  for (const r of ranked.slice(0, 3)) chips.append(chip(esc(intentById[r.id].title), () => open(r.id)));
  chips.append(chip("everything", () => open("browse")));
}

function open(intentId) {
  const intent = intentById[intentId];
  if (!intent) return;
  $("[data-results-title]").textContent = intent.title;
  cards.innerHTML = intent.ids.map((id) => card(itemById[id])).join("");
  results.hidden = false;
  results.classList.toggle("is-single", intent.ids.length === 1);
  document.body.classList.add("has-results");
  engraving && engraving.show(intent.engrave, true);
  chips.innerHTML = "";
  history.replaceState(null, "", "#" + intent.id);
  requestAnimationFrame(() => results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
}

function close() {
  results.hidden = true;
  document.body.classList.remove("has-results");
  engraving && engraving.show("henry.", false);
  history.replaceState(null, "", location.pathname);
  input.focus();
}

function card(it) {
  const links = (it.links || []).map((l) => `<a class="act" href="${esc(l.href)}"${l.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${esc(l.label)}</a>`).join("");
  return `<article class="card">
    <p class="kicker">${esc(it.kicker)}</p>
    <h3>${esc(it.title)}</h3>
    ${it.body ? `<p>${esc(it.body)}</p>` : ""}
    ${it.list ? `<ul class="list">${it.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${it.tags ? `<p class="tags">${it.tags.map(esc).join(" · ")}</p>` : ""}
    ${it.image ? `<figure class="fig"><img src="${esc(it.image.src)}" alt="${esc(it.image.alt)}" loading="lazy" /><figcaption>${esc(it.image.cap)}</figcaption></figure>` : ""}
    ${links ? `<div class="acts">${links}</div>` : ""}
  </article>`;
}

/* ---------- wiring ---------- */
input.addEventListener("input", update);
input.addEventListener("scroll", syncScroll);
input.addEventListener("keydown", (e) => {
  const atEnd = input.selectionStart === input.value.length;
  if ((e.key === "Tab" && !e.shiftKey) || (e.key === "ArrowRight" && atEnd)) {
    if (current && (current.ghost || current.chip)) { e.preventDefault(); accept(current); }
  } else if (e.key === "Escape") {
    if (!results.hidden) close(); else { input.value = ""; update(); }
  }
});
tabBtn.addEventListener("click", () => current && accept(current));
$("[data-ask]").addEventListener("submit", (e) => { e.preventDefault(); decide(); });
$("[data-close]").addEventListener("click", close);
$("[data-browse]").addEventListener("click", () => open("browse"));
$("[data-home]").addEventListener("click", (e) => { e.preventDefault(); input.value = ""; update(); close(); });

// rotate the example in the empty bar
setInterval(() => { if (!input.value) { hintIdx = (hintIdx + 1) % HINTS.length; update(); } }, 3600);

// deep links: henry93.vercel.app/#sitelight
if (location.hash && intentById[location.hash.slice(1)]) setTimeout(() => open(location.hash.slice(1)), 50);

update();
input.focus({ preventScroll: true });
