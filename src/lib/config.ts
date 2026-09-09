// All event dates / rates live here, sourced from env vars so a future event
// can be reconfigured without touching code. See .env for the current values.

function envDate(name: string, fallback: string): Date {
  const raw = process.env[name] ?? fallback;
  // Parse as UTC midnight so date-only comparisons don't drift with server TZ.
  return new Date(`${raw}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export const config = {
  // Dates selectable in the date picker. Hotel may extend this range (up to
  // 5 days post-event) once confirmed, so this is deliberately separate from
  // the discount window.
  bookableStart: envDate("EVENT_BOOKABLE_START", "2026-01-14"),
  bookableEnd: envDate("EVENT_BOOKABLE_END", "2026-01-29"),

  // "+ Add extra nights" reveals this many extra days of tiles on either
  // side of the bookable range (self-paid only, no company-pay toggle).
  extraNightsBufferDays: Number(process.env.EVENT_EXTRA_NIGHTS_BUFFER_DAYS ?? "5"),

  // $105/night group rate is only guaranteed inside this window.
  discountStart: envDate("EVENT_DISCOUNT_START", "2026-01-16"),
  discountEnd: envDate("EVENT_DISCOUNT_END", "2026-01-26"),
  discountRateUsd: Number(process.env.EVENT_DISCOUNT_RATE_USD ?? "105"),

  // Event program dates.
  happyHourDate: envDate("EVENT_HAPPY_HOUR_DATE", "2026-01-21"), // Wed
  allHandsDate: envDate("EVENT_ALL_HANDS_DATE", "2026-01-22"), // Thurs
  dinnerDate: envDate("EVENT_DINNER_DATE", "2026-01-22"), // Thurs

  // After this date, the form stops accepting automatic edits/cancellations;
  // changes must be routed to admin for manual handling.
  lockInDate: envDate("EVENT_LOCK_IN_DATE", "2025-12-21"),

  // Cancelling this many days or fewer before stay start skips the automatic
  // hotel notification email (admin is still notified either way).
  cancelHotelNoticeDays: Number(process.env.EVENT_CANCEL_HOTEL_NOTICE_DAYS ?? "10"),
};

export const extendedRange = {
  start: addDays(config.bookableStart, -config.extraNightsBufferDays),
  end: addDays(config.bookableEnd, config.extraNightsBufferDays),
};

/** Tue/Wed/Thu/Fri nights are the only ones with a company-pays/self-pays
 *  toggle; everything else (weekend nights, extra nights outside the block)
 *  is always self-paid. */
export function isToggleableNight(date: Date): boolean {
  const day = date.getUTCDay(); // Sun=0 ... Sat=6
  return day >= 2 && day <= 5;
}

/** Sensible default toggle state before the attendee touches anything:
 *  the All Hands date and the night after (Thu/Fri) default to company-paid,
 *  since that's guaranteed to every attendee regardless of "select" status. */
export function defaultCompanyPaidNights(): Date[] {
  return [config.allHandsDate, addDays(config.allHandsDate, 1)];
}

export function isWithinDiscountWindow(nightStart: Date): boolean {
  // Inclusive of both endpoints: "valid Jan 16-Jan 26" covers the night of the 26th too.
  return nightStart >= config.discountStart && nightStart <= config.discountEnd;
}

export function isLockedIn(now: Date = new Date()): boolean {
  return now >= config.lockInDate;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export { addDays };
