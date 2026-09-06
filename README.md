# henry. — portfolio

The whole screen is a sheet of liquid metal, T-1000 style. It's a height
field shaded as chrome: slow waves roll across it, shapes are stamped into it
from crisp masks (text, drawings, logos, rendered 3D silhouettes) with a
bevelled edge, and a dent follows the cursor. Between scenes the stamp melts
back into the sheet while beads of mercury (a particle spring sim) roll to
where the next stamp rises. Scrolling doesn't move the page, it tells the
metal what to become next:

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
| `swarm.js` | The sheet: height-field chrome shader, crisp shape masks (canvas + 3D silhouette RT), bead particle sim, droplet legs, scroll blend |
| `shapes.js` | The drawings (eye, wave, rec, burger, mic, paw, git, trophy…) + logo path sampling |
| `logos.js` | simple-icons paths for the stack |
| `assets/` | Lily demo video + poster, favicon, share image |
| `deck/`, `old/` | The two previous portfolios |

Bump the `?v=` on the CSS/JS links in `index.html` when those files change.
