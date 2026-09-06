# henry. — portfolio

A neural network that learned to build things. The whole page is one
forward pass: behind every section sits a layer of a WebGL network (Three.js
points + line segments, ~1,400 nodes, ~4,100 edges), and scrolling dollies
the camera from layer to layer. Nodes light up as they come into focus,
signals run the edges, and touching a node fires it and everything
downstream. Scrolling faster excites the network. Sound is off until asked
(a Web Audio blip per fired neuron).

Layers, in order: input (hero) → the input vector (who) → SiteLight (with
the Stripe first-$2 receipt) → Lily (a sample call types itself out) → some
hackathon wins → Glasscast → Lily's Drive-Thru → Eleven Mile → PawBot →
S.I.E.G.E. → ROV Submarine → open source → the stack (cycles; hover holds)
→ receipts (counters) → the output layer (email / GitHub).

Chrome: wordmark + nav + sound toggle up top, `layer 03 / 15 · sitelight`
and live network stats down below, a signal-colored progress line, a custom
cursor on fine pointers, film grain, a "loading weights" preloader. Type is
Geist, Geist Mono and Instrument Serif italic for the accent word. One
signal color (`--acc`, chartreuse) on ink.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step. GSAP + ScrollTrigger and Lenis from CDN; Three.js via an
import map.

## Files

| File | Purpose |
|---|---|
| `index.html` | The chrome (preloader, header, HUD, progress, cursor, scripts) |
| `styles.css` | Ink / bone / signal, the section grid, type, chips, receipts, mobile |
| `script.js` | `SECTIONS` (copy + links), rendering, scroll → focus, reveals, transcript, counters, stack cycle, sound, cursor, magnet buttons, preloader |
| `net.js` | The network: layered layout, k-nearest edges, signal propagation, shaders, camera dolly, pointer firing |
| `logos.js` | simple-icons paths for the stack chips |
| `404.html` | "This layer doesn't exist." |
| `assets/` | Stripe receipt, favicon, share image |
| `liquid/`, `deck/`, `old/` | The three previous portfolios (liquid metal, card deck, terminal) |

Edit copy and links in `SECTIONS` in `script.js`; add a section = add an
entry (it becomes a layer automatically). Bump the `?v=` on the CSS/JS
links in `index.html` when those files change.
