import { createClient } from "npm:@insforge/sdk@0.0.21";

declare const Deno: { env: { get(key: string): string | undefined } };

const AVAIL_START = "2026-07-10";
const AVAIL_END = "2026-07-31";
const TZ = "America/Los_Angeles";
const SLOT_MINUTES = 30;

const WEEKDAY_SLOTS: Record<number, string[]> = {
  0: times(9, 0, 19, 30),
  1: ["10:00", "10:30", "11:00", "11:30", "12:30", "13:00", "13:30", "17:00", "17:30", "18:00", "18:30"],
  2: ["10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
  3: ["10:00", "10:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
  4: ["10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
  5: ["10:00", "10:30", "11:00", "11:30", "12:30", "13:00", "13:30", "17:00", "17:30", "18:00", "18:30"],
  6: [],
};

const CARD_DECK = [
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

function times(sh: number, sm: number, eh: number, em: number) {
  const out: string[] = [];
  let m = sh * 60 + sm;
  const end = eh * 60 + em;
  while (m <= end) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    m += 30;
  }
  return out;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

function ptParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return parts;
}

function ymdInPT(d: Date) {
  const p = ptParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

function parseYmd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

function addDaysYmd(ymd: string, n: number) {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function slotIso(ymd: string, hm: string) {
  return `${ymd}T${hm}:00-07:00`;
}

function endTime(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  const total = h * 60 + m + SLOT_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function weekdayIndex(ymd: string) {
  const { y, m, d } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function labelDate(ymd: string) {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const long = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(dt);
  const short = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(dt);
  const shortDate = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(dt);
  return { dateLabel: long, weekday: short, shortDate };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json(null, 204);

  const now = new Date();
  const client = createClient({
    baseUrl: Deno.env.get("INSFORGE_BASE_URL")!,
    edgeFunctionToken: Deno.env.get("EDGE_FUNCTION_TOKEN"),
  });

  const booked = new Set<string>();
  try {
    const { data: bookedRows } = await client.database
      .from("bookings")
      .select("slot_start")
      .gte("slot_start", `${AVAIL_START}T00:00:00-07:00`)
      .lte("slot_start", `${AVAIL_END}T23:59:59-07:00`);
    for (const r of bookedRows ?? []) booked.add(r.slot_start);
  } catch (err) {
    console.error("bookings lookup failed", err);
  }

  const days = [];
  let ymd = AVAIL_START;
  let i = 0;
  while (ymd <= AVAIL_END) {
    const dow = weekdayIndex(ymd);
    const starts = WEEKDAY_SLOTS[dow] ?? [];
    if (starts.length) {
      const labels = labelDate(ymd);
      const card = CARD_DECK[i % CARD_DECK.length];
      const slots = starts.map((hm) => {
        const start = slotIso(ymd, hm);
        const startDate = new Date(start);
        let status = "open";
        if (booked.has(start)) status = "booked";
        else if (startDate.getTime() <= now.getTime()) status = "past";
        return { time: hm, endTime: endTime(hm), start, status };
      });
      days.push({ ...labels, ymd, card, slots });
      i += 1;
    }
    ymd = addDaysYmd(ymd, 1);
  }

  return json({ now: now.toISOString(), tz: "PT", days });
}
