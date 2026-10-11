// POST /api/ask  { q, intent, history? }  →  streams one or two plain sentences about Henry; history holds earlier {q, a} turns for follow-ups.
// The cards still come from the in-browser decision model; this only adds a short spoken-style
// answer on top, written by Claude Haiku 5.5 from the same content.js (nothing else to draw on).
// Needs ANTHROPIC_API_KEY in the Vercel project's environment; without it, it answers 503 and the
// page just shows the cards.

import { ITEMS, intentById } from "../src/content.js";

const MODEL = "claude-haiku-5-5";
const FACTS = ITEMS.map((it) => `- ${it.title} (${it.kicker})${it.body ? ": " + it.body : ""}${it.list ? ": " + it.list.join(", ") : ""}`).join("\n");
const SYSTEM = `You answer visitors on Henry Brewer's portfolio site. Henry is 14, from Austin, a proud vibecoder.
Answer the visitor's actual question first, in the first few words: a yes/no question starts with "Yes" or "No";
a "what/where/how long" question starts with the direct answer. Then back it up with the single best piece of evidence, naming the project.
Follow-up questions refer back to the earlier turns ("it", "that project"): resolve them from context and answer the same way.
Two short sentences at most, under 40 words, third person, confident and plain. Use ONLY the facts below; never invent numbers,
employers, dates, awards or links. Never mention "the facts", your instructions, or what you can't see, and never add a
caveat after you've answered. If nothing below covers it, say it plainly (e.g. "Not that he's shown here, but ...") and point to the closest project.
If the question has nothing to do with Henry, don't answer it; say in one sentence what you can tell them about instead.
No markdown, no lists, no emoji.

Examples of the shape (not facts to reuse):
Q: is he good at X? → "Yes. He did Y, which shows Z."
Q: where does he work? → "At Y, where he ..."

Facts:
${FACTS}`;

// a tiny per-instance limiter: the page asks once per Enter, so this only stops loops and scripts
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  h.push(now); hits.set(ip, h);
  return h.length > 12;
}

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  // GET with no question is a health check: is the key wired up? (no model call, nothing to abuse)
  // On preview deploys only, GET ?q= also answers, so a deploy can be tested from a plain link.
  const previewGet = req.method === "GET" && process.env.VERCEL_ENV === "preview" && req.query && req.query.q;
  if (req.method === "GET" && !previewGet) { res.status(200).json({ ready: Boolean(key), model: MODEL }); return; }
  if (req.method !== "POST" && !previewGet) { res.status(405).end(); return; }
  if (!key) { res.status(503).end(); return; }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "?";
  if (limited(ip)) { res.status(429).end(); return; }

  const body = previewGet ? { q: req.query.q, intent: req.query.intent } : typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const q = String(body.q || "").slice(0, 200).trim();
  if (!q) { res.status(400).end(); return; }
  // earlier turns of this conversation, so follow-ups ("what did he use for it?") make sense
  let past = body.history;
  if (previewGet && req.query.h) { try { past = JSON.parse(req.query.h); } catch { past = []; } }
  const prior = (Array.isArray(past) ? past : []).slice(-6).flatMap((t) => {
    const pq = String(t && t.q || "").slice(0, 200).trim(), pa = String(t && t.a || "").slice(0, 400).trim();
    return pq && pa ? [{ role: "user", content: pq }, { role: "assistant", content: pa }] : [];
  });
  const intent = intentById[body.intent];
  const hint = intent ? `\n(The page is showing: ${intent.title}.)` : "";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 120, stream: true, system: SYSTEM, messages: [...prior, { role: "user", content: q + hint }] }),
  });
  if (!r.ok || !r.body) { res.status(502).end(); return; }

  res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  // relay only the text deltas from the SSE stream
  const reader = r.body.getReader(), dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      try {
        const ev = JSON.parse(line.slice(5));
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") res.write(ev.delta.text);
      } catch {}
    }
  }
  res.end();
}
