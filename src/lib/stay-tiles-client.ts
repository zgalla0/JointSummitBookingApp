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

/** True when any night of [stayStart, checkout) falls outside [rangeStart,
 *  rangeEnd] - used client-side (form validation) against boundaries the
 *  server has already resolved into plain ISO strings and sent down as
 *  form config, so this needs no server-only config of its own. */
export function hasNightOutsideRange(
  stayStart: string,
  stayEnd: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  if (!stayStart || !stayEnd) return false;
  const lastNight = addIsoDays(stayEnd, -1);
  if (lastNight < stayStart) return false;
  return isoDateRange(stayStart, lastNight).some((night) => night < rangeStart || night > rangeEnd);
}

export const WEEKDAY_HEADER_SUN_FIRST = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
