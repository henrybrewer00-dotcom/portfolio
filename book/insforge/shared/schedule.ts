/** Pacific-time booking window + per-weekday 30-minute slot starts (PT). */
export const AVAIL_START = "2026-07-10";
export const AVAIL_END = "2026-07-31";
export const TZ = "America/Los_Angeles";
export const SLOT_MINUTES = 30;

function range(startH: number, startM: number, endH: number, endM: number, step = 30) {
  const out: string[] = [];
  let mins = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (mins <= end) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    mins += step;
  }
  return out;
}

/** 0=Sun … 6=Sat — same pattern used for the first booking window. */
export const WEEKDAY_SLOTS: Record<number, string[]> = {
  0: range(9, 0, 19, 30),
  1: ["10:00", "10:30", "11:00", "11:30", "12:30", "13:00", "13:30", "17:00", "17:30", "18:00", "18:30"],
  2: ["10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
  3: ["10:00", "10:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
  4: ["10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
  5: ["10:00", "10:30", "11:00", "11:30", "12:30", "13:00", "13:30", "17:00", "17:30", "18:00", "18:30"],
  6: [],
};

export const CARD_DECK = [
  { rank: "A", suit: "♠", color: "black" },
  { rank: "K", suit: "♥", color: "red" },
  { rank: "Q", suit: "♦", color: "red" },
  { rank: "J", suit: "♣", color: "black" },
  { rank: "10", suit: "♥", color: "red" },
  { rank: "9", suit: "♠", color: "black" },
  { rank: "8", suit: "♦", color: "red" },
  { rank: "7", suit: "♣", color: "black" },
  { rank: "6", suit: "♥", color: "red" },
  { rank: "5", suit: "♠", color: "black" },
  { rank: "4", suit: "♦", color: "red" },
  { rank: "3", suit: "♣", color: "black" },
  { rank: "2", suit: "♥", color: "red" },
];
