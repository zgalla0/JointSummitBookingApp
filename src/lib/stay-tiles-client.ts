// Client-safe (no process.env access) date-tile math for the stay-dates
// picker. The server resolves config into plain ISO-date strings and arrays,
// passed down as props; this file just does arithmetic on them.

export function addIsoDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of ISO dates from start to end. */
export function isoDateRange(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  let cursor = startIso;
  while (cursor <= endIso) {
    dates.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return dates;
}

/** True when at least one night of [stayStart, checkout) isn't one of the
 *  nights Cuesta is paying for - a room type choice only changes what the
 *  attendee themselves owes, so it's needed for any self-paid night,
 *  regardless of whether that night happens to fall inside the negotiated
 *  block or the discounted-rate window (most self-paid nights do - only
 *  the two forced and two optional company-paid nights are ever exempt).
 *  Used client-side (form validation); the server (booking-write.ts)
 *  mirrors this exact check. */
export function needsRoomTypeChoice(
  stayStart: string,
  stayEnd: string,
  companyPaidNights: string[],
): boolean {
  if (!stayStart || !stayEnd) return false;
  const lastNight = addIsoDays(stayEnd, -1);
  if (lastNight < stayStart) return false;
  const companyPaid = new Set(companyPaidNights);
  return isoDateRange(stayStart, lastNight).some((night) => !companyPaid.has(night));
}

/** True when the stay includes an optional (arrive-early) night that's
 *  neither marked self-pay nor company-paid yet - i.e. the attendee hasn't
 *  actually made a choice for it. Forces an explicit choice instead of
 *  silently treating "not company-paid" as "self-pay chosen". */
export function hasUndecidedOptionalNights(
  stayStart: string,
  stayEnd: string,
  companyPaidNights: string[],
  selfPayNights: string[],
  optionalCompanyPaidNights: string[],
): boolean {
  if (!stayStart || !stayEnd) return false;
  const lastNight = addIsoDays(stayEnd, -1);
  if (lastNight < stayStart) return false;
  const companyPaid = new Set(companyPaidNights);
  const selfPaid = new Set(selfPayNights);
  return isoDateRange(stayStart, lastNight).some(
    (night) => optionalCompanyPaidNights.includes(night) && !companyPaid.has(night) && !selfPaid.has(night),
  );
}

export const WEEKDAY_HEADER_SUN_FIRST = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function isoMonthYearLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function isoWeekday(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getUTCDay();
}

export function isoWeekdayLabel(iso: string): string {
  return WEEKDAY_HEADER_SUN_FIRST[isoWeekday(iso)];
}

/** Mon-Fri tiles get a "PTO" checkbox, except whichever specific dates are
 *  forced company-paid (checked separately - not every weekday tile is
 *  eligible, since you can't take PTO on a day you're required to be at
 *  the summit). */
export function isWeekdayIso(iso: string): boolean {
  const day = isoWeekday(iso);
  return day >= 1 && day <= 5;
}

/**
 * Lays out [startIso, endIso] as a real Sun-Sat calendar grid: each row is one
 * week, each column a fixed weekday, so the same weekday lines up vertically
 * across rows. Cells outside the range are `null` (rendered as blank space,
 * not a visible/grayed tile).
 */
export function buildCalendarGrid(startIso: string, endIso: string): (string | null)[][] {
  // isoWeekday is already 0=Sun...6=Sat, exactly the Sunday-first column index.
  const gridStart = addIsoDays(startIso, -isoWeekday(startIso));
  const daysInGrid = isoDateRange(gridStart, endIso).length;
  const rowCount = Math.ceil(daysInGrid / 7);

  const rows: (string | null)[][] = [];
  let cursor = gridStart;
  for (let r = 0; r < rowCount; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < 7; c++) {
      row.push(cursor >= startIso && cursor <= endIso ? cursor : null);
      cursor = addIsoDays(cursor, 1);
    }
    rows.push(row);
  }
  return rows;
}
