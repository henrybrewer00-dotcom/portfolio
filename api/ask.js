// POST /api/ask  { q, intent }  →  streams one or two plain sentences about Henry.
// The cards still come from the in-browser decision model; this only adds a short spoken-style
// answer on top, written by Claude Haiku 5.5 from the same content.js (nothing else to draw on).
// Needs ANTHROPIC_API_KEY in the Vercel project's environment; without it, it answers 503 and the
// page just shows the cards.

import { ITEMS, intentById } from "../src/content.js";

const MODEL = "claude-haiku-5-5";
const FACTS = ITEMS.map((it) => `- ${it.title} (${it.kicker})${it.body ? ": " + it.body : ""}${it.list ? ": " + it.list.join(", ") : ""}`).join("\n");
const SYSTEM = `You answer visitors on Henry Brewer's portfolio site. Henry is 14, from Austin, a proud vibecoder.
Reply in one or two short, confident sentences (under 45 words), in the third person, like a friend vouching for him.
Point at the most relevant project by name. Use ONLY the facts below; never invent numbers, employers, awards or links.
If the question has nothing to do with Henry or his work, steer back to what he's built in one sentence.
No markdown, no lists, no emoji.

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
  if (req.method !== "POST") { res.status(405).end(); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(503).end(); return; }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "?";
  if (limited(ip)) { res.status(429).end(); return; }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const q = String(body.q || "").slice(0, 200).trim();
  if (!q) { res.status(400).end(); return; }
  const intent = intentById[body.intent];
  const hint = intent ? `\n(The page is showing: ${intent.title}.)` : "";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 120, stream: true, system: SYSTEM, messages: [{ role: "user", content: q + hint }] }),
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
