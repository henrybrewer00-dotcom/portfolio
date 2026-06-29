# Henry — portfolio

A portfolio that deals itself like a deck of cards as you scroll. Each project is
a real-looking playing card that flies out of the deck, flips face-up, and then
settles into a fanned hand once you've read it.

- **Deck mode** (desktop): GSAP ScrollTrigger pins the stage and `render(progress)`
  deals one card at a time — Lenis smooths the scroll. Arrow keys and suit pips
  jump between cards. URLs like `#lily` deep-link to a card.
- **Static mode** (mobile, reduced-motion, or no GSAP): the same cards laid out as
  a readable hand, revealed on scroll. Tap any card to magnify it.

The cards: **SiteLight** (AI visibility for local businesses), **Lily** (a morning
AI call for an aging parent), **Glasscast** (free, open-source Screen Studio),
**Lily's Drive-Thru** (voice ordering + live kitchen display), **Eleven Mile**,
**PawBot**, **S.I.E.G.E.**, a **submarine**, open-source work, and the **Joker**
— a "hire me" card with a typing duel.

## Run it

```bash
python3 -m http.server 8848   # then open http://localhost:8848
```

No build step. Vanilla HTML/CSS/JS; GSAP + Lenis load from CDN with SRI hashes.
Project data lives in `projects.json`. The ornate card-back and felt table in
`assets/` were generated with Higgsfield.

Debug deck controls: add `?debug` to the URL.

## Files

| File | Purpose |
|---|---|
| `index.html` | Stage (deck) + fallback hand + footer, SEO meta, JSON-LD |
| `styles.css` | Card look, felt table, 3D flip, responsive + print |
| `script.js` | Deal-on-scroll engine, accessibility, deep links, modals |
| `projects.json` | All project card data (edit here to add/change cards) |
| `manifest.json` / `sw.js` | PWA shell + offline cache for static assets |
| `sitemap.xml` | Search + per-card hash URLs |
| `assets/` | `card-back.webp`, `table.jpg`, `favicon.svg`, demo video |

## Features

- Keyboard nav (←/→, number keys 1–9 and 0 for card 10)
- Progress pips (suit buttons) in the HUD
- Per-card Open Graph meta updates as you scroll
- Focus-trapped video lightbox and card preview modals
- Optional deal sounds (muted by default; toggle bottom-left)
- Full-house golden celebration when the last card fans out
- Print stylesheet outputs the static hand
- Analytics hook: set `window.HENRY_ANALYTICS = (event, detail) => { … }`
