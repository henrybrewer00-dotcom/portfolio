/* Placeholder crowd numbers, shown (and labelled "sample") until real storage is connected.
   Deterministic, so the preview looks the same on every load. */
import { PERSONAS } from "./content.js";

export function sampleCrowd(now = Date.now()) {
  const weights = { hiring: 9, founder: 14, engineer: 22, security: 7, designer: 11, student: 18, curious: 26 };
  const roles = Object.fromEntries(PERSONAS.map((p) => [p.id, weights[p.id] || 5]));
  const day = 864e5, today = Math.floor(now / day) * day;
  // four months of days: a slow climb, weekly rhythm, and a couple of spikes (a post that got shared)
  const N = 120;
  const days = Array.from({ length: N }, (_, i) => ({ t: today - (N - 1 - i) * day,
    n: Math.round(3 + i * 0.09 + 3 * Math.sin(i * 0.9) ** 2 + ((i * 37) % 11) * 0.5 + (i === 71 ? 26 : i === 72 ? 14 : 0) + (i > 110 ? 7 : 0)) }));
  const posts = [
    ["engineer", "I write the firmware for coffee machines", 3],
    ["student", "Junior in high school, building a rocket club", 7],
    ["designer", "I design board games on weekends", 12],
    ["founder", "Running a tiny bakery delivery app", 26],
    ["security", "Bug bounty hunter, mostly fintech", 40],
    ["curious", "Saw this on X and the hover got me", 55],
  ].map(([role, text, h]) => ({ role, text, t: now - h * 36e5 }));
  return { sample: true, total: Object.values(roles).reduce((a, b) => a + b, 0), roles, days, posts };
}
