# henry. — portfolio

Henry's one-page portfolio: fourteen, Austin, proud vibecoder. Voice AI,
robots, a submarine, and a company.

The whole site is built around **the swarm**: twelve thousand ink dots that
gather into a shape and blow away from the cursor. As you scroll it becomes
a bubble, a row of keycaps, the S.I.E.G.E. rover, the ROV submarine, a voice
waveform, and finally spells "hire me". Every project card is a smaller
swarm drawing its own icon (an eye for SiteLight, a waveform plus a sample
transcript for Lily, a record button for Glasscast, a paw for PawBot…). The
on-stage video card draws a play button, and if nobody presses it within
five seconds the dots rearrange into an arrow that says PRESS ME.

## Sections

1. **Hero** — "I make way too much stuff." over the sphere of dots.
2. **Statement** — who Henry is, with the proud-vibecoder line.
3. **Made with** — the stack (React, TypeScript, Python, Electron, Arduino,
   Twilio, ElevenLabs, Claude, Vercel, GitHub).
4. **Stuff I made** — 10 cards, each a dot drawing. Links go to real repos
   or the SiteLight site; cards without a public repo aren't links.
5. **Ideas that got out of hand** — the 3D fly-through grid of dot tiles
   (desktop only).
6. **Receipts** — hackathon win, school, merged PRs (SymPy, Biome, Astro),
   typing speed.
7. **Closing** — the swarm spells "hire me" under "Proud vibecoder.
   Fourteen. Austin, TX."
8. **Footer** — "Got an idea? Let's build it this weekend." + sitemap.

Fixed HUD (brand, GitHub, Contact, bottom-right menu with light/dark toggle),
ring cursor, Lenis smooth scroll, print-grain overlay.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step. GSAP + ScrollTrigger, SplitType and Lenis from CDN; Three.js
(and its addons for surface sampling / rounded boxes) via an import map.
Fonts: Geist, Geist Mono, Instrument Serif (Google Fonts).

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup, copy, HUD, preloader counter, lightbox |
| `styles.css` | Paper / ink / orange look, 12-col em grid, light + dark, responsive |
| `script.js` | Content data, rendering, preloader, hero, scroll choreography, cards |
| `swarm.js` | The big swarm: Three.js Points + CPU spring sim, shape builders, cursor blow |
| `cards.js` | 2D card swarms + the icon drawings + tile snapshots |
| `logos.js` | simple-icons paths for the stack grid |
| `assets/` | Lily demo video + poster, favicon, share image |
| `deck/` | The previous scroll-dealt card-deck portfolio |
| `old/` | The original terminal portfolio |

Cache-busting: bump the `?v=` on the CSS/JS links in `index.html` when those
files change.
