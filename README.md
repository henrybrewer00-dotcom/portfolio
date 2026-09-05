# Henry — portfolio

A one-page portfolio for Henry (14): voice AI, robots, a submarine, and some
open source. The design is a one-to-one take on the Off+Brand agency site
layout — an iridescent WebGL orb that travels down the page, "difference"
blended type, a preloader that fills the H. mark, a 3D fly-through grid of
work tiles, and a gradient closing section — with Henry's own content.

## Sections

1. **Hero** — "I make way too much stuff." split-character intro, orb behind it.
2. **Statement** — who Henry is, in the big indented headline + two columns.
3. **Built with** — tool logos grid (hover swaps the tag).
4. **Featured work** — 10 project cards (SiteLight, Lily, Lily on stage
   (video), Glasscast, Lily's Drive-Thru, Eleven Mile, PawBot, S.I.E.G.E.,
   ROV Submarine, Open Source). Sticky eyebrow + "All repos".
5. **3D grid** — "Building things in unexpected ways" over a scroll-driven
   perspective grid of tiles (desktop only, like the reference).
6. **Recognitions + Awards** — hackathon win, school, merged PRs, typing.
7. **Closing** — "Where Different Is the Standard. Hire Henry." with the
   rotating H. mark revealing the gradient.
8. **Footer** — "How about we build a thing, To+Gether" + sitemap/connect.

Also: fixed HUD (brand, GitHub / Book a call / Contact, scroll dot, bottom-right
menu with light/dark toggle), custom cursor, Lenis smooth scroll.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step. Vanilla HTML/CSS/JS. GSAP + ScrollTrigger, SplitType and Lenis
load from CDN; Three.js (the orb) via an import map. Font is Geist (Google
Fonts) — the closest open alternative to the reference's custom Ataero.

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup: HUD, sections, orb, preloader, lightbox |
| `styles.css` | The whole look (em-based 12-col grid, light/dark, responsive) |
| `script.js` | Content data + preloader, hero, scroll choreography, menu |
| `orb.js` | Three.js iridescent blob (custom shader), `createOrb()` |
| `logos.js` | simple-icons paths for the "Built with" grid |
| `assets/work/` | Project covers (rendered with the same orb shader) + real shots |
| `assets/mark.svg` | The H. logomark (preloader mask, favicon) |
| `deck/` | The previous scroll-dealt card-deck portfolio |
| `old/` | The original terminal portfolio |

Cache-busting: the `?v=` on the CSS/JS links in `index.html` — bump it when
those files change.
