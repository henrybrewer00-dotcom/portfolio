# henry. — portfolio

One screen: a little planet with a ring road around it, and every project is
a landmark beside the road. You drive the S.I.E.G.E. rover along the road
(scroll, drag sideways, or hold the arrow keys) and the planet turns under
it. Each stop raises a placard with the real link.

The stops, in order: home → "henry." → "14" → "austin, tx" → "proud
vibecoder" (signposts) → the billboard ("I make way too much stuff.") → a bust
(bio) → a lighthouse (SiteLight, with the Stripe first-$2 receipt) → a phone
box with a live waveform (Lily, with a sample call typing itself out) → three
trophies (some hackathon wins) → a camera on a tripod (Glasscast) → a
drive-thru (Lily's Drive-Thru) → a stage with two mics (Eleven Mile) → a dog
house (PawBot) → the S.I.E.G.E. garage → a lake with the submarine → a merge
tree (open source) → a stack of crates with tool logos (the stack cycles;
hover holds one, and its crate lifts) → the "99.5" scoreboard → a mailbox
with the flag up ("hire me").

Low-poly world: flat-shaded planet with hills flattened along the road,
trees and rocks, a dirt ring road, clouds that drift around the planet, a
moon in orbit, an atmosphere rim, twinkling stars, soft shadows, dust puffs
behind the rover, spinning wheels, and idle animations at the landmarks (the
lighthouse beam turns, the sound bars bounce, the sub bobs, the camera reels
spin). Sound is off until asked: a little engine that follows your speed and
a ding at each stop. The rail on the right is the list of stops (I–XV);
Home/End jump to the ends; add `?nosnap=1` to turn stop snapping off.

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
| `styles.css` | Night sky, placards, rail, mobile |
| `script.js` | `SCENES` (copy, links, which landmark), scroll/keys/drag → driving, placards, transcript, stack cycle, engine sound |
| `planet.js` | The world: planet mesh, landmarks (`LM.*`), the rover, sky, clouds, puffs, camera |
| `logos.js` | simple-icons paths for the crate faces |
| `assets/` | Stripe receipt, favicon, share image |
| `deck/`, `old/` | The two previous portfolios (card deck, terminal) |

Edit copy and links in `SCENES` in `script.js`; add a stop = add an entry
with a `stop` (one of the `LM` builders in `planet.js`, or `sign` / `billboard`
with an `arg`) and a `len` (screens of scroll). Bump the `?v=` on the CSS/JS
links in `index.html` when those files change.
