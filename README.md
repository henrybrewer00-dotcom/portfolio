# henry. — portfolio

One screen. Sixteen thousand ink dots. Scrolling doesn't move the page, it
tells the dots what to become next:

"I make way too much stuff." → proud vibecoder → an eye (SiteLight) → a
waveform (Lily, with a sample call typing itself out) → a play button (the
a16z × Cursor hackathon demo; wait five seconds and it turns into PRESS ME)
→ a record button (Glasscast) → a burger (Lily's Drive-Thru) → a mic
(Eleven Mile) → a paw (PawBot) → the S.I.E.G.E. rover → the ROV submarine →
a merge graph (open source) → a row of keycaps (the stack) → "1st"
(receipts) → "hire me".

Each scene has a small caption bottom-left with the real link. Clicking the
dots does the scene's thing (opens the repo, plays the video). The cursor
nudges the dots aside. The rail on the right jumps between scenes.

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
| `swarm.js` | The dots: Three.js Points + spring sim, 3D shape builders, text shapes, fit + offset, cursor nudge |
| `shapes.js` | The ink drawings (eye, wave, rec, burger, mic, paw, git, play, pressme) |
| `assets/` | Lily demo video + poster, favicon, share image |
| `deck/`, `old/` | The two previous portfolios |

Bump the `?v=` on the CSS/JS links in `index.html` when those files change.
