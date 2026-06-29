# Book time with Henry

Card-dealing booking UI at [book.insforge.site](https://book.insforge.site).  
Backend: InsForge edge functions on `s4f5vebr.us-east.insforge.app`.

## Availability window

Edit the date range in `insforge/shared/schedule.ts` (and redeploy), or patch the live functions:

| Constant | Value |
|---|---|
| `AVAIL_START` | `2026-07-10` |
| `AVAIL_END` | `2026-07-31` |

**Per-day slot times (PT, 30 min)** — unchanged from the first window:

| Day | Slots |
|---|---|
| Sun | 9:00 AM – 7:30 PM (every 30 min) |
| Mon / Fri | 10:00–11:30 AM, 12:30–1:30 PM, 5:00–6:30 PM |
| Tue / Thu | 10:00–11:30 AM, 2:00–7:30 PM |
| Wed | 10:00–10:30 AM, 4:00–7:30 PM |
| Sat | closed |

## Deploy

```bash
# after: npx @insforge/cli login
./book/deploy.sh
```

Or push with `INSFORGE_EMAIL` + `INSFORGE_PASSWORD` GitHub secrets — the workflow pulls live function code, swaps the date constants, and redeploys.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Booking site (also deployed to book.insforge.site) |
| `insforge/functions/availability/` | Returns open days + slots |
| `insforge/functions/book/` | Books a slot, creates Meet link, sends email |
| `insforge/shared/schedule.ts` | Shared schedule constants (source of truth in git) |
