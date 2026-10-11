/* =========================================================================
   henry. — ghost text. Finds the suggestion that continues what's typed,
   either from its start ("show me hen…") or from any word in it
   ("henry's cu…" → "henry's current job"). Ties go to whatever the model
   thinks the typed text means.
   ========================================================================= */

/** @param {{ id: string, suggest: string[] }[]} intents */
export function createSuggester(intents) {
  const list = [];
  for (const intent of intents) intent.suggest.forEach((text, rank) => {
    const lower = text.toLowerCase();
    const starts = [0];
    for (let i = 1; i < lower.length; i++) if (lower[i - 1] === " ") starts.push(i);
    list.push({ text, lower, starts, intent: intent.id, rank });
  });

  /**
   * @param {string} typed what's in the box
   * @param {(id: string) => number} score the model's probability for an intent
   * @returns {{ text: string, ghost: string, intent: string } | null}
   */
  function suggest(typed, score) {
    const q = typed.toLowerCase().replace(/’/g, "'");
    if (q.trim().length < 2) return null;
    let best = null, bestKey = -Infinity;
    for (const s of list) {
      for (const at of s.starts) {
        if (!s.lower.startsWith(q, at) || s.lower.length === at + q.length) continue;
        // prefer a match from the very start, then the model's pick, then canonical phrasing
        const key = (at === 0 ? 2 : 0) + score(s.intent) - s.rank * 0.02;
        if (key > bestKey) { bestKey = key; best = { text: typed + s.text.slice(at + q.length), ghost: s.text.slice(at + q.length), intent: s.intent }; }
        break;
      }
    }
    return best;
  }
  return { suggest };
}
