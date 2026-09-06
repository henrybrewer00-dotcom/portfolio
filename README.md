# henry. — portfolio

One screen of liquid metal. Eleven thousand particles are splatted into a
density field and a screen-space shader carves the mercury surface out of it
(dark rims, a reflected room, sharp highlights). Scrolling doesn't move the
page, it tells the liquid what to become next:

a bubble → "henry." → "14" → "austin, tx" → "proud vibecoder" → "I make way
too much stuff." → a bubble (bio) → an eye (SiteLight, with the Stripe
first-$2 receipt) → a live waveform (Lily, with a sample call typing itself
out) → a trophy (hackathon wins) → a record button (Glasscast) → a burger
(Lily's Drive-Thru) → a mic (Eleven Mile) → a paw (PawBot) → the S.I.E.G.E.
rover → the ROV submarine → a merge graph (open source) → keycaps that cycle
through the stack's logos → "99.5" (receipts) → "hire me".

The blend between two shapes is tied directly to scroll position (snapping at
each scene), with a swirl running through the liquid while it changes. Each
scene has a caption bottom-left with the real link; clicking the liquid opens
it. The cursor nudges the liquid aside. The rail on the right jumps scenes.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step. GSAP + ScrollTrigger and Lenis from CDN; Three.js and its
addons via an import map. Fonts: Geist, Geist Mono, Instrument Serif.

## Files

| File | Purpose |
|---|---|
| `index.html` | The chrome (name, links, theme toggle, caption + rail hosts, scroll track) |
| `styles.css` | Paper / ink / orange, captions, rail, light + dark, mobile |
| `script.js` | The scene list (copy + links), scroll → scene, captions, actions, preloader |
| `swarm.js` | The liquid: particle spring sim, density splat + mercury post pass, shape builders (3D, text, drawings, logos), scroll blend |
| `shapes.js` | The drawings (eye, wave, rec, burger, mic, paw, git, trophy…) + logo path sampling |
| `logos.js` | simple-icons paths for the stack |
| `assets/` | Lily demo video + poster, favicon, share image |
| `deck/`, `old/` | The two previous portfolios |

Bump the `?v=` on the CSS/JS links in `index.html` when those files change.
