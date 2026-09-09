# Q1 Summit Hotel Block Booking App

Replaces the manual email/spreadsheet process for the company event hotel block.
Being built in stages:

1. **Data model + public form** (this stage)
2. Self-service edit/cancel via magic link
3. Admin dashboard
4. Emails (Resend)

## Stack

- Next.js (App Router, TypeScript)
- Prisma + SQLite for local dev (swap to Postgres for production, see below)
- Tailwind CSS
- react-hook-form + zod for form validation
- react-day-picker for the stay-date picker
- Resend for transactional email (wired up in Stage 4)

## Setup

```bash
npm install
npx prisma migrate deploy   # creates prisma/dev.db from the committed migrations
npm run dev
```

Open http://localhost:3000.

## Configuration

All event dates, the discount rate, and the lock-in date are environment
variables, not hardcoded, so this can be reused for future events. See `.env`
for the full list and current defaults:

- `EVENT_BOOKABLE_START` / `EVENT_BOOKABLE_END` - range shown in the date picker.
- `EVENT_DISCOUNT_START` / `EVENT_DISCOUNT_END` / `EVENT_DISCOUNT_RATE_USD` -
  the $105/night group rate window.
- `EVENT_HAPPY_HOUR_DATE` / `EVENT_ALL_HANDS_DATE` / `EVENT_DINNER_DATE` -
  program dates. Company-paid nights are derived from these: the All Hands
  date and the night after are paid for everyone, the night before Happy Hour
  and Happy Hour night itself are paid only for "select" (self-attested)
  attendees.
- `EVENT_LOCK_IN_DATE` - after this date, edits/cancellations stop being
  automatic (Stage 2).
- `EVENT_CANCEL_HOTEL_NOTICE_DAYS` - days-out cutoff for the automatic hotel
  cancellation email (Stage 2/4).

Update these (and re-deploy) for a future event rather than editing code.
The current defaults assume a Jan 2026 event; update the year when reusing
this for a different event.

## Database: SQLite (dev) vs Postgres (production)

Dev uses a local SQLite file (`prisma/dev.db`, gitignored) for zero-setup
local development. Before deploying (e.g. to Vercel/Render), switch to
Postgres:

1. Change `provider = "sqlite"` to `provider = "postgresql"` in
   `prisma/schema.prisma`.
2. Point `DATABASE_URL` at your Postgres instance (Vercel Postgres, Neon,
   Render Postgres, etc.) in your deployment's env vars.
3. Run `npx prisma migrate deploy` against that database.

## Email (Resend)

Not wired up yet (Stage 4). `src/lib/email.ts` currently contains stub
functions that log what would be sent; each call site in the app is already
in place so Stage 4 only needs to fill in the real Resend calls and
templates. Set `RESEND_API_KEY` in your env (never commit it) when that
stage lands.
