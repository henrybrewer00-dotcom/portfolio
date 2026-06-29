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

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function parseYmdFromIso(iso: string) {
  return iso.slice(0, 10);
}

function hmFromIso(iso: string) {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "";
}

function weekdayIndex(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function onSchedule(slotStart: string) {
  const ymd = parseYmdFromIso(slotStart);
  if (ymd < AVAIL_START || ymd > AVAIL_END) return false;
  const hm = hmFromIso(slotStart);
  return (WEEKDAY_SLOTS[weekdayIndex(ymd)] ?? []).includes(hm);
}

function endTime(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  const total = h * 60 + m + SLOT_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function labelDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(dt);
}

async function createMeet(name: string, email: string, slotStart: string, details: string) {
  const apiKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") ?? "primary";
  if (!apiKey) throw new Error("Meet is not configured.");

  const sa = JSON.parse(apiKey);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: await signJwt(sa, ["https://www.googleapis.com/auth/calendar"]),
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) throw new Error("Could not auth Google Calendar.");

  const start = new Date(slotStart);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
  const eventRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenJson.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      summary: `Call with ${name}`,
      description: details || `Booked via book.insforge.site\n${email}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email }],
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
    }),
  });
  const event = await eventRes.json();
  const meetLink = event?.hangoutLink || event?.conferenceData?.entryPoints?.find((e: { entryPointType: string }) => e.entryPointType === "video")?.uri;
  if (!meetLink) throw new Error("Google Meet link missing.");
  return meetLink;
}

async function signJwt(sa: { client_email: string; private_key: string }, scopes: string[]) {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const header = enc({ alg: "RS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = enc({
    iss: sa.client_email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${data}.${sigB64}`;
}

function pemToArrayBuffer(pem: string) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json(null, 204);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { name?: string; email?: string; details?: string; slotStart?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const details = String(body.details ?? "").trim();
  const slotStart = String(body.slotStart ?? "").trim();

  if (!name) return json({ error: "Please add your name." }, 400);
  if (!isEmail(email)) return json({ error: "Please enter a valid email." }, 400);
  if (!onSchedule(slotStart)) return json({ error: "That time isn't on the schedule." }, 400);

  const when = new Date(slotStart);
  if (when.getTime() <= Date.now()) return json({ error: "That time has already passed. Pick another." }, 400);

  const client = createClient({
    baseUrl: Deno.env.get("INSFORGE_BASE_URL")!,
    edgeFunctionToken: Deno.env.get("EDGE_FUNCTION_TOKEN"),
  });

  const { data: existing } = await client.database
    .from("bookings")
    .select("id")
    .eq("slot_start", slotStart)
    .maybeSingle();

  if (existing) return json({ error: "That slot was just booked — pick another time." }, 409);

  let meetLink = "";
  try {
    meetLink = await createMeet(name, email, slotStart, details);
  } catch (err) {
    console.error("meet", err);
    return json({ error: "Could not create the Google Meet link. Try again in a minute." }, 502);
  }

  const { error: insertErr } = await client.database.from("bookings").insert([{
    slot_start: slotStart,
    name,
    email,
    details,
    meet_link: meetLink,
  }]);
  if (insertErr) return json({ error: "Could not save the booking." }, 500);

  let emailed = false;
  try {
    await client.email.send({
      to: [email, Deno.env.get("HENRY_EMAIL") ?? "henrybrewer00@gmail.com"],
      subject: `You're booked with Henry — ${labelDate(parseYmdFromIso(slotStart))}`,
      html: `<p>Hi ${name},</p><p>You're on for <strong>${labelDate(parseYmdFromIso(slotStart))}</strong> at <strong>${hmFromIso(slotStart)} – ${endTime(hmFromIso(slotStart))} PT</strong>.</p><p><a href="${meetLink}">Join Google Meet</a></p>`,
    });
    emailed = true;
  } catch (err) {
    console.error("email", err);
  }

  const hm = hmFromIso(slotStart);
  return json({
    success: true,
    slot: { dateLabel: labelDate(parseYmdFromIso(slotStart)), timeRange: `${hm} – ${endTime(hm)} PT` },
    meetLink,
    emailed,
  });
}
