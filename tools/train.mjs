// Train the decision model from src/content.js and write model/model.json.
//   node tools/train.mjs        (or: npm run model)
// Deterministic: same content in, same weights out.

import { writeFileSync, mkdirSync } from "node:fs";
import { INTENTS } from "../src/content.js";
import { DIM, features, normalize } from "../src/model.js";

const TEMPLATES = ["{s}", "show me {s}", "show {s}", "tell me about {s}", "what about {s}", "henry's {s}", "show me henry's {s}", "what is henry's {s}", "his {s}", "open {s}", "what's his {s}"];

// mulberry32: small seeded RNG so training is reproducible
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(93);

const labels = INTENTS.map((i) => i.id);
const C = labels.length;

// ---------- the dataset: phrases, then every prefix of each phrase ----------
const samples = [];
const seen = new Set();
function push(text, y, w) {
  const key = normalize(text) + "|" + y;
  if (!normalize(text) || seen.has(key)) return;
  seen.add(key);
  const f = features(text);
  samples.push({ idx: f.idx, val: f.val, y, w });
}
INTENTS.forEach((intent, y) => {
  const full = [...intent.suggest, ...intent.questions];
  for (const s of intent.subjects) for (const t of TEMPLATES) full.push(t.replace("{s}", s));
  // a single project's name beats the generic word "project" ("the lily project")
  if (intent.ids.length === 1) for (const s of intent.subjects.slice(0, 3)) full.push(`the ${s} project`, `${s} project`, `${s} app`);
  for (const phrase of full) {
    push(phrase, y, 1);
    // prefixes: half-typed text counts, but less the shorter it is
    for (let n = 3; n < phrase.length; n++) {
      if (phrase[n - 1] === " ") continue;
      const r = n / phrase.length;
      push(phrase.slice(0, n), y, 0.15 + 0.6 * r * r);
    }
  }
});

// ---------- softmax regression, Adagrad ----------
const W = new Float32Array(DIM * C), G = new Float32Array(DIM * C).fill(1e-8);
const B = new Float32Array(C), GB = new Float32Array(C).fill(1e-8);
const LR = 0.4, L2 = 1e-6, EPOCHS = 30;
const sc = new Float64Array(C);
for (let epoch = 0; epoch < EPOCHS; epoch++) {
  for (let i = samples.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [samples[i], samples[j]] = [samples[j], samples[i]]; }
  let loss = 0;
  for (const s of samples) {
    for (let c = 0; c < C; c++) sc[c] = B[c];
    for (let k = 0; k < s.idx.length; k++) { const row = s.idx[k] * C, v = s.val[k]; for (let c = 0; c < C; c++) sc[c] += W[row + c] * v; }
    let max = -Infinity; for (let c = 0; c < C; c++) if (sc[c] > max) max = sc[c];
    let sum = 0; for (let c = 0; c < C; c++) { sc[c] = Math.exp(sc[c] - max); sum += sc[c]; }
    loss -= s.w * Math.log(sc[s.y] / sum + 1e-12);
    for (let c = 0; c < C; c++) {
      const g = s.w * (sc[c] / sum - (c === s.y ? 1 : 0));
      GB[c] += g * g; B[c] -= (LR * g) / Math.sqrt(GB[c]);
      for (let k = 0; k < s.idx.length; k++) {
        const j = s.idx[k] * C + c, gw = g * s.val[k] + L2 * W[j];
        G[j] += gw * gw; W[j] -= (LR * gw) / Math.sqrt(G[j]);
      }
    }
  }
  if (epoch % 10 === 9 || epoch === EPOCHS - 1) console.log(`epoch ${epoch + 1}: loss ${(loss / samples.length).toFixed(4)}`);
}

// ---------- quantize to int8, one scale per class ----------
const scale = new Array(C).fill(0);
for (let j = 0; j < DIM; j++) for (let c = 0; c < C; c++) scale[c] = Math.max(scale[c], Math.abs(W[j * C + c]));
for (let c = 0; c < C; c++) scale[c] = scale[c] / 127 || 1;
const q = new Int8Array(DIM * C);
for (let j = 0; j < DIM; j++) for (let c = 0; c < C; c++) q[j * C + c] = Math.round(W[j * C + c] / scale[c]);

const out = { version: 1, dim: DIM, labels, scale: scale.map((v) => +v.toPrecision(6)), bias: Array.from(B, (v) => +v.toFixed(5)), weights: Buffer.from(q.buffer).toString("base64") };
mkdirSync(new URL("../model/", import.meta.url), { recursive: true });
const json = JSON.stringify(out);
writeFileSync(new URL("../model/model.json", import.meta.url), json);
console.log(`${samples.length} samples, ${C} intents, model.json ${(json.length / 1024).toFixed(0)} KB`);
