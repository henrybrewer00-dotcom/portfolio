# henry. — portfolio

One search bar over an ASCII koi pond. Type what you want to see ("show me
Henry's current job") and ghost text finishes the sentence: **Tab** (or →)
accepts it, **Enter** opens the cards. Behind it, black and white ASCII koi
swim over a black cell grid (`src/pond.js`, after stackedlol/ascii-sharks):
fish scatter from the cursor, the koi come to look when it rests, and tiles
flip over as the cursor crosses them. The koi follow the cursor, and a click on
open water calls them to that spot. The big word
("hello." / "henry." / whatever you opened) is drawn into the same grid as
tiles and decodes cell by cell when it changes. Black and white only.

There is no chatbot and nothing is generated. A small decision model picks
which cards to show; every word on screen comes from `src/content.js`.

## Run it

```bash
python3 -m http.server 8890   # then open http://localhost:8890
```

No build step on deploy: `model/model.json` is committed.

## Change the content

1. Edit `src/content.js`: `ITEMS` are the cards, `INTENTS` are what the
   model can pick (which cards, the engraved word, example phrases, and the
   ghost-text suggestions).
2. `npm run model` retrains and rewrites `model/model.json` (about 3 s, no
   dependencies). It also refreshes the no-JS list in `index.html`.
3. `npm test` checks the model on phrases it never trained on (fails under
   90%) and prints how long a keystroke takes.
4. Bump the `?v=` in `index.html` when files change.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page: ask bar, results, no-JS list |
| `api/ask.js` | On Enter, one or two sentences from Claude Haiku 5.5, grounded in content.js. Needs ANTHROPIC_API_KEY in Vercel |
| `styles.css` | Black and bone palette; bar, ghost text, cards, mobile |
| `src/content.js` | Every card and every intent |
| `src/model.js` | Text features + the classifier (shared by training and the browser) |
| `src/suggest.js` | Ghost-text matching |
| `src/pond.js` | The koi pond and the big word, drawn as ASCII tiles on a canvas |
| `src/boot.js` | The intro: "henry." decodes in the pond, then becomes "hello." |
| `src/app.js` | Wiring: keystrokes, Tab, Enter, cards, deep links (`/#sitelight`) |
| `tools/train.mjs`, `tools/test.mjs` | Train and check the model |
| `deck/`, `old/` | The two previous portfolios (card deck, terminal) |
