/* The opening: a few seconds before "who are you?". The page is only the koi pond: the grid comes up out of
   the dark, "henry." decodes into the water tile by tile, holds, then re-decodes into "hello." in the same
   spot, and the rest of the page fades in around it. Plays on every visit (Henry asked for that); any click,
   tap or key skips it; off for reduced motion and deep links. A returning visitor's page already says
   "henry.", so for them the word just stays put. */

export function boot({ pond, skip = false, word = "hello." } = {}) {
  const root = document.documentElement;
  if (skip || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pond.show(word, true);
    root.classList.remove("is-booting");
    return Promise.resolve();
  }
  // the letters need their real face before they're laid out into cells
  const font = document.fonts ? Promise.race([document.fonts.load('400 120px "Instrument Serif"'), new Promise((r) => setTimeout(r, 900))]) : Promise.resolve();
  return font.then(() => new Promise((resolve) => {
    const timers = [];
    let done = false;
    const end = () => {
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      removeEventListener("pointerdown", end); removeEventListener("keydown", end);
      pond.show(word);
      root.classList.remove("is-booting");
      resolve();
    };
    const at = (s, fn) => timers.push(setTimeout(fn, s * 1000));
    at(0.5, () => pond.gather("henry.", { from: 0.1, over: 2.3 }));
    if (word !== "henry.") at(3.7, () => pond.show(word));
    at(word !== "henry." ? 5.0 : 3.4, end);
    at(0.15, () => { addEventListener("pointerdown", end, { once: true }); addEventListener("keydown", end, { once: true }); });
  }));
}
