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

/**
 * Company-paid nights, expressed as the night's start date.
 * Thu/Fri (the All Hands date and the day after) are paid for everyone.
 * Tue/Wed (the day before Happy Hour and the Happy Hour date itself) are
 * additionally paid only for self-attested "select" attendees.
 */
export function companyPaidNights(selectEligible: boolean): Date[] {
  const always = [config.allHandsDate, addDays(config.allHandsDate, 1)];
  const selectOnly = [addDays(config.happyHourDate, -1), config.happyHourDate];
  return selectEligible ? [...selectOnly, ...always] : always;
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
