# henry. — portfolio

Henry's little planet: a game. A small low-poly world you drive the
S.I.E.G.E. rover around, and every project stands somewhere on it as a
landmark. Find all fourteen stops, grab the $2 coins, and try to catch the
dog. Each stop you reach raises a placard with the real link.

**Controls.** WASD or the arrow keys drive (the world rolls under the rover),
space or shift boosts, esc pauses. On a phone, drag anywhere to drive and
hold the boost button. Progress (stops found, coins, best time) is saved in
the browser.

**The world.** A flat-shaded planet with hills, trees and rocks, a
lighthouse whose beam turns, a phone box with bouncing sound bars, three
trophies, a camera whose reels spin, a drive-thru, a stage, a dog house, the
S.I.E.G.E. garage, a lake with the submarine bobbing in it, a merge tree, a
stack of crates with the tool logos (the hot one lifts as the stack cycles),
the 99.5 scoreboard, and a mailbox with the flag up for "hire me". Signposts
by the house say henry., 14, austin tx, proud vibecoder, and a billboard
says the rest. Coins ring every stop and run along three roads. A compass
arrow on the ground points to the nearest stop you haven't found. The dog
wanders, runs when the rover gets close, and trots behind you once caught.
Clouds drift, a moon orbits, stars twinkle, dust puffs behind the wheels.
Sound is off until asked: a small engine that follows your speed, a coin
blip, a ding at every stop, a yip from the dog.

**The end.** Find everything and the ending hands over the email and GitHub
links with your time and coins.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step. Three.js via an import map. Fonts: Geist, Geist Mono,
Instrument Serif.

## Files

| File | Purpose |
|---|---|
| `index.html` | The chrome (title screen, HUD, placard + stops hosts, pause and ending, touch controls) |
| `styles.css` | Night sky, placards, HUD, title and modals, joystick, mobile |
| `script.js` | `SCENES` (copy, links, which landmark), input (keys + joystick), stops, coins, the dog, sound, saving |
| `game.js` | The world: planet, landmarks (`LM.*`), the rover, physics on the sphere, collisions, coins, the dog, compass, sky |
| `logos.js` | simple-icons paths for the crate faces |
| `assets/` | Stripe receipt, favicon, share image |
| `deck/`, `old/` | The two previous portfolios (card deck, terminal) |

Edit copy and links in `SCENES` in `script.js`; add a stop = add an entry
with a `stop` (one of the `LM` builders in `game.js`, or `sign` / `billboard`
with an `arg`). New landmarks are a builder in `LM` returning a Group
standing on y = 0. Bump the `?v=` on the CSS/JS links in `index.html` when
those files change.
