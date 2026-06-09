# Henry — portfolio

A portfolio that deals itself like a deck of cards as you scroll. Each project is
a real-looking playing card that flies out of the deck, flips face-up, and then
settles into a fanned hand once you've read it.

- **Deck mode** (desktop): GSAP ScrollTrigger pins the stage and `render(progress)`
  deals one card at a time — Lenis smooths the scroll.
- **Static mode** (mobile, reduced-motion, or no GSAP): the same cards laid out as
  a readable hand, revealed on scroll.

The cards: **Lily** (a morning AI call for an aging parent), **Lily's Drive-Thru**
(voice ordering + live kitchen display), **Glasscast** (free, open-source Screen
Studio), **Eleven Mile**, **PawBot**, **S.I.E.G.E.**, a **submarine**, open-source
work, and the **Joker** — a "hire me" card with a typing duel.

## Run it

```bash
python3 -m http.server 8848   # then open http://localhost:8848
```

No build step. Vanilla HTML/CSS/JS; GSAP + Lenis load from CDN. The ornate
card-back and felt table in `assets/` were generated with Higgsfield.

## Files

| File | Purpose |
|---|---|
| `index.html` | Stage (deck) + fallback hand + footer |
| `styles.css` | Card look, felt table, 3D flip, responsive + fallback |
| `script.js` | Project data, the deal-on-scroll engine, the typing duel |
| `assets/` | `card-back.webp`, `table.jpg` |
