/* The custom cursor: a small dithered square that follows the mouse exactly (no lag, so aiming stays honest),
   opens into corner brackets over anything you can press, becomes a caret in text boxes, and a ←→ grip on the
   chart. Mouse and trackpad only; touch screens keep their own behaviour. */

export function createCursor(el) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const label = el.querySelector("[data-cursor-label]");
  document.documentElement.classList.add("has-cursor");
  let mode = "";
  const set = (m) => {
    if (m === mode) return;
    el.classList.remove("is-press", "is-text", "is-drag");
    if (m) el.classList.add("is-" + m);
    label.textContent = m === "drag" ? "← →" : "";
    mode = m;
  };
  const modeFor = (t) => {
    if (!t || !t.closest) return "";
    if (t.closest("[data-days]")) return "drag";
    if (t.closest("input, textarea")) return "text";
    if (t.closest("a, button, [data-pin], .row, label")) return "press";
    return "";
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    el.classList.add("is-on");
    set(modeFor(e.target));
  }, { passive: true });
  addEventListener("pointerdown", () => el.classList.add("is-down"));
  addEventListener("pointerup", () => el.classList.remove("is-down"));
  document.documentElement.addEventListener("pointerleave", () => el.classList.remove("is-on"));
}
