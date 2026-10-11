/* =========================================================================
   henry. — the ask bar. Every keystroke runs the decision model (in this
   tab, no server) to pick the ghost text; Enter opens the cards. Nothing on
   screen is generated: every word comes from content.js.
   ========================================================================= */

import { INTENTS, HINTS, PINNED, itemById, intentById } from "./content.js";
import { createModel } from "./model.js";
import { createSuggester } from "./suggest.js";
import { createEngraving } from "./shader.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

const OPEN_AT = 0.3;   // below this, Enter offers choices instead of guessing
const GUESS_AT = 0.35; // the best-guess chip shows above this when there's no ghost text

const bar = $(".bar"), input = $("[data-q]"), typedEl = $("[data-typed]"), restEl = $("[data-rest]"), tabBtn = $("[data-tab]");
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
fetch("model/model.json?v=20261011g")
  .then((r) => r.json())
  .then((json) => { model = createModel(json); update(); })
  .catch((e) => console.warn("model failed to load; falling back to suggestions only", e));

const probOf = (id) => { const r = ranked.find((x) => x.id === id); return r ? r.p : 0; };

/* ---------- ghost text, on every keystroke ---------- */
let hintIdx = 0, anim = null, lastText = "";
function update() {
  const text = input.value;
  if (anim) return;
  ranked = model && text.trim() ? model.predict(text) : [];
  current = text ? suggest(text, probOf) : { text: HINTS[hintIdx], ghost: HINTS[hintIdx], intent: null };
  typedEl.textContent = text;
  const ghost = current ? current.ghost : "";
  if (ghost && ghost !== restEl.textContent && !(restEl.textContent && restEl.textContent.startsWith(ghost))) {
    restEl.classList.remove("is-new"); void restEl.offsetWidth; restEl.classList.add("is-new");   // a new guess fades in
  }
  restEl.textContent = ghost;
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
// Enter: the bar stamps down and a ring rolls out through the engraving
function stamp() {
  bar.classList.remove("is-stamp"); void bar.offsetWidth; bar.classList.add("is-stamp");
  const b = bar.getBoundingClientRect();
  engraving && engraving.pulse(b.left + b.width / 2, b.top + b.height / 2);
}

function decide() {
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
  chips.innerHTML = "";
  chips.append(Object.assign(document.createElement("span"), { className: "chips-label", textContent: "did you mean" }));
  for (const r of ranked.slice(0, 3)) chips.append(chip(esc(intentById[r.id].title), () => open(r.id, text)));
  chips.append(chip("everything", () => open("browse")));
}

/* ---------- the spoken answer: one or two sentences from Claude Haiku 5.5 (api/ask.js) ---------- */
const answerEl = $("[data-answer]");
let asking = null;
async function ask(q, intentId) {
  if (asking) asking.abort();
  answerEl.hidden = true; answerEl.textContent = ""; answerEl.classList.remove("is-done");
  if (!q || location.protocol === "file:") return;
  const ctl = (asking = new AbortController());
  try {
    const r = await fetch("api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q, intent: intentId }), signal: ctl.signal });
    if (!r.ok || !r.body) return;   // no key, rate limited, or offline: the cards stand on their own
    answerEl.hidden = false;
    const reader = r.body.getReader(), dec = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      answerEl.textContent += dec.decode(value, { stream: true });
    }
    answerEl.classList.add("is-done");
    if (!answerEl.textContent.trim()) answerEl.hidden = true;
  } catch (e) { /* aborted or failed: leave the cards */ }
}

function open(intentId, q = "") {
  const intent = intentById[intentId];
  if (!intent) return;
  ask(q, intentId);
  $("[data-results-title]").innerHTML = [...intent.title].map((c, i) => `<span class="ch" style="--i:${i}">${esc(c)}</span>`).join("");
  cards.innerHTML = intent.ids.map((id, i) => card(itemById[id], i)).join("");
  results.hidden = false;
  results.classList.toggle("is-single", intent.ids.length === 1);
  document.body.classList.add("has-results");
  engraving && engraving.show(intent.engrave, true);
  chips.innerHTML = "";
  history.replaceState(null, "", "#" + intent.id);
  requestAnimationFrame(() => results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
}

function close(focus = true) {
  if (asking) { asking.abort(); asking = null; }
  results.hidden = true;
  document.body.classList.remove("has-results");
  engraving && engraving.show("henry.", false);
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
    ${it.image ? `<figure class="fig"><img src="${esc(it.image.src)}" alt="${esc(it.image.alt)}" loading="lazy" /><figcaption>${esc(it.image.cap)}</figcaption></figure>` : ""}
    ${links ? `<div class="acts">${links}</div>` : ""}
  </article>`;
}

/* ---------- pinned: the three things Henry wants seen first ---------- */
$("[data-pins]").innerHTML = PINNED.map((it, i) => `<button type="button" class="pin" data-pin="${esc(it.id)}" style="--i:${i}">
  <span class="pin-kicker">${esc(it.kicker)}</span><span class="pin-title">${esc(it.title)}</span><span class="pin-go" aria-hidden="true">→</span></button>`).join("");
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
  // each keystroke taps the water just under the caret
  if (engraving) { const r = typedEl.getBoundingClientRect(), b = bar.getBoundingClientRect(); engraving.ripple(Math.min(r.right, b.right - 120), b.bottom + 6, 0.7); }
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
tabBtn.addEventListener("click", () => current && accept(current));
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
  restEl.textContent = ""; tabBtn.hidden = true; chips.innerHTML = "";
  play(typedEl, backwards(text), Math.max(9, Math.min(28, 420 / text.length)), () => {
    input.classList.remove("is-untyping"); typedEl.classList.remove("is-untyping");
    typedEl.textContent = "";
    typeHint();
  });
}

// the example in the empty bar types itself in
function typeHint() {
  if (input.value) { update(); return; }
  const h = HINTS[hintIdx];
  if (reduceMotion) { update(); return; }
  restEl.classList.add("is-hint"); restEl.classList.remove("is-new");
  play(restEl, forwards(h), 26, update);
}

// rotate the example: untype the old one, type the next
setInterval(() => {
  if (input.value || anim || document.hidden) return;
  const old = HINTS[hintIdx];
  hintIdx = (hintIdx + 1) % HINTS.length;
  if (reduceMotion) { update(); return; }
  play(restEl, backwards(old), 14, typeHint);
}, 4200);

// deep links: henry93.vercel.app/#crawft
if (location.hash && intentById[location.hash.slice(1)]) setTimeout(() => open(location.hash.slice(1)), 50);

update();
typeHint();
input.focus({ preventScroll: true });
