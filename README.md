# Q1 Summit Hotel Block Booking App

Replaces the manual email/spreadsheet process for the company event hotel block.
Being built in stages:

1. Data model + public form
2. Self-service edit/cancel via magic link
3. **Admin dashboard** (this stage)
4. Emails (Resend)

## Stack

- Next.js (App Router, TypeScript)
- Prisma + SQLite for local dev (swap to Postgres for production, see below)
- Tailwind CSS, Inter + JetBrains Mono (via `next/font/google`)
- react-hook-form + zod for form validation
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

- `EVENT_BOOKABLE_START` / `EVENT_BOOKABLE_END` - the full calendar always
  renders this whole range as tiles (the hotel's group-rate extension may
  reach further than the standard block below).
- `EVENT_BLOCK_START` / `EVENT_BLOCK_END` - the standard block. Every tile in
  the bookable range is directly selectable as part of one contiguous stay;
  nights outside this block are always self-paid (no company toggle) and
  trigger the room-type picker (Deluxe $105 / Brisas Business Club $145, see
  `src/lib/room-types.ts`) since they're outside the negotiated block.
- `EVENT_DISCOUNT_START` / `EVENT_DISCOUNT_END` / `EVENT_DISCOUNT_RATE_USD` -
  the $105/night group rate window. Not currently surfaced on the form
  (superseded there by the room-type picker), kept for the admin export.
- `EVENT_HAPPY_HOUR_DATE` / `EVENT_ALL_HANDS_DATE` / `EVENT_DINNER_DATE` -
  program dates. The All Hands date and the night after are the default
  company-paid nights seeded on the stay-dates picker; attendees can toggle
  any Tue-Fri night between company-pays and self-pays themselves (that
  toggle *is* the "select" self-attestation, stored per booking rather than
  a single yes/no field).
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

## Admin dashboard

`/admin` (redirects to `/admin/login` until authenticated) is gated by a
single shared password, not per-user accounts:

1. Set `ADMIN_PASSWORD` in your env (see `.env.example`).
2. Log in at `/admin/login`. This sets a signed, httpOnly session cookie
   (`src/lib/admin-session.ts`, 24-hour TTL) - there's no separate user table.
3. `src/proxy.ts` (Next 16's `middleware.ts` replacement) gates every
   `/admin/*` page and `/api/admin/*` route on that cookie, redirecting to
   the login page (or returning 401 for API calls) when it's missing/expired.

What's there:

- **Dashboard** (`/admin`) - summary stats: booking counts, event attendance,
  company-paid vs self-paid room nights, discount-window coverage, room-type
  breakdown, dietary breakdown, PTO days claimed, flagged-for-review count,
  and attendees still missing flight details (with a button to trigger the
  flight-details-reminder email stub for all of them).
- **Bookings** (`/admin/bookings` and `/admin/bookings/[id]`) - full list and
  per-booking detail, with actions to cancel a booking as admin (not gated by
  the Stage 2 lock-in date, see `src/lib/cancel-booking.ts`), toggle the
  review flag, or resend a magic link.
- **Static content** (`/admin/static-content`) - CRUD for the `StaticContent`
  table, which powers the "Event info, Q&A, and timing" section shown on the
  public booking form.
- **Export** (`/api/admin/export`) - downloads every booking (active and
  cancelled) as CSV, including the discount-window/room-nights breakdown per
  booking.

## Email (Resend)

Not wired up yet (Stage 4). `src/lib/email.ts` currently contains stub
functions that log what would be sent; each call site in the app is already
in place so Stage 4 only needs to fill in the real Resend calls and
templates. Set `RESEND_API_KEY` in your env (never commit it) when that
stage lands.
