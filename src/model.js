/* =========================================================================
   henry. — the decision model. A softmax classifier over hashed text
   features: typed text in, a ranked list of intents out. No text is ever
   generated. The same featurizer runs in training (tools/train.mjs) and in
   the browser, so the two can't drift apart.
   ========================================================================= */

export const DIM = 4096;

const STOP = new Set(["show", "me", "the", "a", "an", "of", "is", "are", "what", "whats", "his", "he", "henry", "about", "tell", "to", "i", "you", "your", "can", "does", "do", "did", "has", "have", "any", "anything", "with", "for", "my", "in", "on", "it", "that", "this", "where", "how", "who"]);

export function normalize(s) {
  return s.toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/'s\b/g, "")
    .replace(/\./g, "")
    .replace(/[^a-z0-9$+#' -]+/g, " ")
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** Sparse, L2-normalized features: { idx: Uint16Array, val: Float32Array }. */
export function features(text) {
  const t = normalize(text);
  const words = t ? t.split(" ") : [];
  const m = new Map();
  const add = (k, w) => { const i = fnv(k) % DIM; m.set(i, (m.get(i) || 0) + w); };
  let prev = "";
  for (const w of words) {
    if (STOP.has(w)) { add("s:" + w, 0.25); continue; }
    add("w:" + w, 1);
    if (prev) add("b:" + prev + "_" + w, 0.6);
    prev = w;
    // word prefixes let half-typed words ("cur") match whole ones ("current")
    for (let n = 2; n <= Math.min(w.length, 7); n++) add("p:" + w.slice(0, n), 0.35);
    const p = "<" + w + ">";
    for (let n = 3; n <= 4; n++) for (let j = 0; j + n <= p.length; j++) add("c:" + p.slice(j, j + n), 0.3);
  }
  let norm = 0;
  for (const v of m.values()) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  const idx = new Uint16Array(m.size), val = new Float32Array(m.size);
  let k = 0;
  for (const [i, v] of m) { idx[k] = i; val[k] = v / norm; k++; }
  return { idx, val };
}

function b64ToBytes(s) {
  if (typeof atob === "function") { const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  return new Uint8Array(Buffer.from(s, "base64"));
}

/** Turn the JSON from tools/train.mjs into a predictor. */
export function createModel(json) {
  const { labels, scale, bias } = json;
  const C = labels.length;
  const W = new Int8Array(b64ToBytes(json.weights).buffer);
  const scores = new Float64Array(C);
  /** @returns {{ id: string, p: number }[]} best first */
  function predict(text) {
    const { idx, val } = features(text);
    for (let c = 0; c < C; c++) scores[c] = bias[c];
    for (let k = 0; k < idx.length; k++) {
      const row = idx[k] * C, v = val[k];
      for (let c = 0; c < C; c++) scores[c] += W[row + c] * scale[c] * v;
    }
    let max = -Infinity;
    for (let c = 0; c < C; c++) if (scores[c] > max) max = scores[c];
    let sum = 0;
    const out = new Array(C);
    for (let c = 0; c < C; c++) { const e = Math.exp(scores[c] - max); sum += e; out[c] = { id: labels[c], p: e }; }
    for (const o of out) o.p /= sum;
    return out.sort((a, b) => b.p - a.p);
  }
  return { labels, predict };
}
