// GET /api/prs  →  { source, unit, total, weeks: [{t, n}], prs: [{repo, n, title, url, at, merged, private}] }
//
// Henry's GitHub activity for the "pull requests" section, newest first.
// With GITHUB_TOKEN set in Vercel (a token of Henry's that can read his repos), it asks GitHub's GraphQL API
// for his contribution calendar (private work included, as counts only) and every PR he's opened.
// Private repos never leak a name or title: they come back as "private repo" with no link.
// Without a token it falls back to his public pull requests from the search API.
// The answer is cached at the edge for an hour, so GitHub sees about one request an hour.

import { PRS } from "../src/content.js";

const LOGIN = "henrybrewer00-dotcom";
const DAY = 864e5;
const at = (d) => new Date(d).getTime();

const QUERY = `query {
  viewer {
    contributionsCollection { contributionCalendar { totalContributions weeks { firstDay contributionDays { contributionCount } } } }
    pullRequests(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { title number url createdAt mergedAt state repository { name nameWithOwner isPrivate } }
    }
  }
}`;

const shape = (p, repo) => p.repository.isPrivate
  ? { repo: "private repo", n: null, title: null, url: null, at: at(p.mergedAt || p.createdAt), merged: !!p.mergedAt, private: true }
  : { repo: repo(p.repository), n: p.number, title: p.title, url: p.url, at: at(p.mergedAt || p.createdAt), merged: !!p.mergedAt, private: false };

// his own repos read by name ("portfolio"), everyone else's by owner/name ("biomejs/biome" reads as "biome")
const repoName = (r) => r.name;

// weekly PR counts, oldest first, from the first PR's week to this one
function prWeeks(prs) {
  if (!prs.length) return [];
  const sunday = (t) => { const d = new Date(t); d.setUTCHours(0, 0, 0, 0); return d.getTime() - d.getUTCDay() * DAY; };
  const out = [];
  for (let t = sunday(Math.min(...prs.map((p) => p.at))), end = sunday(Date.now()); t <= end; t += 7 * DAY) out.push({ t, n: prs.filter((p) => sunday(p.at) === t).length });
  return out;
}

async function fromGraphQL(token) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "henry93-portfolio" },
    body: JSON.stringify({ query: QUERY }),
  });
  const j = await r.json();
  if (!r.ok || j.errors || !j.data) throw new Error("graphql " + r.status);
  const v = j.data.viewer, cal = v.contributionsCollection.contributionCalendar;
  const prs = v.pullRequests.nodes.filter((p) => p.state !== "CLOSED" || p.mergedAt).map((p) => shape(p, repoName));
  return {
    source: "github", unit: "contributions", total: cal.totalContributions, prCount: prs.length, prs,
    weeks: cal.weeks.map((w) => ({ t: at(w.firstDay + "T00:00:00Z"), n: w.contributionDays.reduce((a, d) => a + d.contributionCount, 0) })),
  };
}

async function fromSearch() {
  const r = await fetch(`https://api.github.com/search/issues?q=author:${LOGIN}+type:pr&sort=created&order=desc&per_page=100`, { headers: { "user-agent": "henry93-portfolio", accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error("search " + r.status);
  const j = await r.json();
  const prs = j.items.filter((i) => i.state === "open" || i.pull_request.merged_at).map((i) => ({
    repo: i.repository_url.split("/").pop(), n: i.number, title: i.title, url: i.html_url,
    at: at(i.pull_request.merged_at || i.created_at), merged: !!i.pull_request.merged_at, private: false,
  }));
  return { source: "public", unit: "pull requests", total: prs.length, prCount: prs.length, weeks: prWeeks(prs), prs };
}

function fromContent() {
  const prs = PRS.map((p) => ({ repo: p.repo, n: p.n, title: p.what, url: p.url, at: at(p.merged + "T12:00:00Z"), merged: true, private: false }));
  return { source: "static", unit: "pull requests", total: prs.length, prCount: prs.length, weeks: prWeeks(prs), prs };
}

// the same answer for api/ask, kept for an hour per instance
let kept = null;
export async function getPrs() {
  if (kept && Date.now() - kept.at < 3600e3) return kept.out;
  let out, why = process.env.GITHUB_TOKEN ? null : "no GITHUB_TOKEN";
  try { out = process.env.GITHUB_TOKEN ? await fromGraphQL(process.env.GITHUB_TOKEN) : await fromSearch(); }
  catch (e) {
    console.warn("prs: falling back", e.message);
    why = e.message;   // just the API and its status code, never the token
    try { out = process.env.GITHUB_TOKEN ? await fromSearch() : fromContent(); } catch (e2) { out = fromContent(); }
  }
  out.prs.sort((a, b) => b.at - a.at);
  if (why) out.fallback = why;   // says why it isn't the full GitHub picture, for checking the setup
  kept = { at: Date.now(), out };
  return out;
}

export default async function handler(req, res) {
  const out = await getPrs();
  res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json(out);
}
