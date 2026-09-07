# henry. — portfolio

One screen: a block of marble in a marble hall. Scrolling carves it into
the next thing, exactly as far as you've scrolled. The whole picture is one
fragment shader: the hall (floor, fluted columns, fog, shafts of light), the
polished floor's reflection, and the block itself are signed distance fields
raymarched together, so moving between two shapes is a smooth blend of two
fields, roughened like chisel work while it changes. Chips fly off and
collect on the floor under the work, dust drifts (and glows) in the shafts of
light, the light itself drifts slowly like an afternoon, and (if you turn
sound on) a chisel taps while it carves. Click or tap the marble and you take
a bite out of it yourself; the cursor turns into a chisel over the stone. The
block arrives rough and settles smooth. Arrow keys, page keys, space, Home and
End walk the gallery.

a block → "henry." → "14" → "austin, tx" → "proud vibecoder" → "I make way
too much stuff." → a bust (bio) → an eye (SiteLight, with the Stripe first-$2
receipt) → a live waveform (Lily, with a sample call typing itself out) → a
trophy (some hackathon wins) → a record button (Glasscast) → a burger
(Lily's Drive-Thru) → a mic (Eleven Mile) → a paw (PawBot) → the S.I.E.G.E.
rover → the ROV submarine → a merge graph (open source) → keycaps (the stack
cycles through tool logos; hover holds one) → "99.5" (receipts) → "hire me".

Every scene has a museum placard bottom-left with the real link, and the
rail on the right is the gallery index (I–XV). Add `?nosnap=1` to turn scene
snapping off, `?lq=1` for the low-quality renderer.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step. GSAP + ScrollTrigger and Lenis from CDN; Three.js via an
import map. Fonts: Geist, Geist Mono, Instrument Serif.

## Files

| File | Purpose |
|---|---|
| `index.html` | The chrome (name, links, sound toggle, placard + rail hosts, scroll track) |
| `styles.css` | Stone / charcoal / oxide red, placards, rail, mobile |
| `script.js` | `SCENES` (copy + links), scroll → blend, placards, transcript, stack cycle, chisel sound |
| `marble.js` | The renderer: raymarched hall + object, 3D shape SDFs (block, bust, car, sub, keycaps, bars), extruded 2D fields for text/drawings/logos, chips, dust |
| `shapes.js` | The drawings (eye, wave, rec, burger, mic, paw, git, trophy…) + logo path drawing |
| `logos.js` | simple-icons paths for the stack |
| `assets/` | Stripe receipt, favicon, share image |
| `deck/`, `old/` | The two previous portfolios (card deck, terminal) |

Edit copy and links in `SCENES` in `script.js`; add a scene = add an entry
(shape: `text:...`, `draw:<SHAPES2D name>`, `logo:<slug>`, or one of the 3D
shapes `block`, `sphere`, `bust`, `car`, `sub`, `keycaps`, `wave`; `len` =
screens of scroll). New 3D shapes are SDF functions in `marble.js`. Bump the
`?v=` on the CSS/JS links in `index.html` when those files change.
