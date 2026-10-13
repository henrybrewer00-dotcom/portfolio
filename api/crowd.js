// GET  /api/crowd                         →  { sample, total, roles: {id: n}, days: [{t, n}], posts: [{role, text, t}] }
// POST /api/crowd { type: "visit", role }  →  counts one visitor (the page sends it once per browser)
// POST /api/crowd { type: "post", role, text } →  adds a line to the "what do you do?" wall, after moderation
//
// Storage is a stub for now: everything lives in this function's memory and resets on every cold start,
// on top of sample numbers. Swap `store` for InstaCloud Postgres once Henry connects it (DATABASE_URL);
// the two tables it needs are visits(role, at) and posts(role, text, at, hidden).

import { personaById } from "../src/content.js";
import { moderate } from "../src/moderate.js";
import { sampleCrowd } from "../src/crowd-sample.js";

const mem = { visits: [], posts: [] };
const store = {
  async read() {
    const c = sampleCrowd();
    for (const v of mem.visits) { c.roles[v.role] = (c.roles[v.role] || 0) + 1; c.total++; const d = c.days.at(-1); if (d) d.n++; }
    c.posts = [...mem.posts.filter((p) => !p.hidden), ...c.posts].slice(0, 30);
    return c;
  },
  async visit(role) { mem.visits.push({ role, at: Date.now() }); },
  async post(role, text) { mem.posts.unshift({ role, text, t: Date.now() }); mem.posts.length = Math.min(mem.posts.length, 200); },
};

const hits = new Map();
function limited(key, max) {
  const now = Date.now(), list = (hits.get(key) || []).filter((t) => now - t < 36e5);
  list.push(now); hits.set(key, list);
  return list.length > max;
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  if (req.method === "GET") { res.status(200).json(await store.read()); return; }
  if (req.method !== "POST") { res.status(405).end(); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const role = personaById[body.role] ? body.role : "curious";
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "?";
  if (body.type === "visit") {
    if (!limited("v" + ip, 5)) await store.visit(role);
    res.status(204).end(); return;
  }
  if (body.type === "post") {
    if (limited("p" + ip, 3)) { res.status(429).json({ ok: false, why: "That's a lot of posts. Try again later." }); return; }
    const m = moderate(body.text);
    if (!m.ok) { res.status(422).json(m); return; }
    await store.post(role, m.text);
    res.status(201).json({ ok: true, text: m.text }); return;
  }
  res.status(400).end();
}
