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

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isoWeekday(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getUTCDay();
}

export function isoWeekdayLabel(iso: string): string {
  return WEEKDAY[isoWeekday(iso)];
}

/** Only Tue/Wed/Thu/Fri nights get a company-pays/self-pays toggle. */
export function isToggleableIso(iso: string): boolean {
  const day = isoWeekday(iso);
  return day >= 2 && day <= 5;
}

/** Tue/Wed nights use the "Paid by Cuesta" label and its approval warning,
 *  since (unlike Thu/Fri) company-pay there means arriving early. */
export function isTueOrWedIso(iso: string): boolean {
  const day = isoWeekday(iso);
  return day === 2 || day === 3;
}

/** Mon/Tue/Wed tiles always get a "PTO" checkbox. */
export function isMonTueWedIso(iso: string): boolean {
  const day = isoWeekday(iso);
  return day === 1 || day === 2 || day === 3;
}

/** Thu/Fri tiles get a "PTO" checkbox too, except the specific Thu/Fri the
 *  event itself falls on (checked separately against the company-paid
 *  event dates, since not every Thu/Fri is one of those). */
export function isThuOrFriIso(iso: string): boolean {
  const day = isoWeekday(iso);
  return day === 4 || day === 5;
}

export function isoMonthDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export const WEEKDAY_HEADER_SUN_FIRST = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
