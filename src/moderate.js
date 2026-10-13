/* Light moderation for the "what do you do?" wall. Runs on the server (api/crowd.js) and in the
   browser, so a rejected post gets its reason before it's sent. Returns { ok, text } or { ok:false, why }. */

// STEMS block any word starting with them; WORDS only the whole word (so "cockpit" and "Dickens" are fine)
const STEMS = ["fuck", "shit", "bitch", "cunt", "nigg", "retard", "whore", "slut", "porn", "onlyfans", "viagra"];
const WORDS = ["fag", "fags", "nazi", "nazis", "kys", "rape", "dick", "dicks", "pussy", "cock", "cocks", "nsfw", "casino", "airdrop"];
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i" };

export const MAX_POST = 80;

export function moderate(raw) {
  const text = String(raw || "").replace(/\s+/g, " ").trim();
  if (text.length < 3) return { ok: false, why: "A few more words?" };
  if (text.length > MAX_POST) return { ok: false, why: `Keep it under ${MAX_POST} characters.` };
  if (/(https?:|www\.|\.(com|net|org|io|xyz|ly|gg|ru)\b)/i.test(text)) return { ok: false, why: "No links, just what you do." };
  if (/@\w|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/.test(text)) return { ok: false, why: "No handles or phone numbers." };
  const words = text.toLowerCase().replace(/[013457@$!]/g, (c) => LEET[c] || c).replace(/[^a-z\s]/g, "").split(/\s+/);
  if (words.some((w) => WORDS.includes(w) || STEMS.some((s) => w.startsWith(s)))) return { ok: false, why: "Let's keep it friendly." };
  if (/(.)\1{5,}/.test(text) || (text.length > 12 && text === text.toUpperCase() && /[A-Z]/.test(text))) return { ok: false, why: "Easy on the caps." };
  return { ok: true, text };
}
