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

export function isoMonthDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export const WEEKDAY_HEADER_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 0 = Monday ... 6 = Sunday. */
function mondayFirstIndex(iso: string): number {
  return (isoWeekday(iso) + 6) % 7;
}

/**
 * Lays out [startIso, endIso] as a real Mon-Sun calendar grid: each row is one
 * week, each column a fixed weekday, so the same weekday lines up vertically
 * across rows. Cells outside the range are `null` (rendered as blank space,
 * not a visible/grayed tile).
 */
export function buildCalendarGrid(startIso: string, endIso: string): (string | null)[][] {
  const gridStart = addIsoDays(startIso, -mondayFirstIndex(startIso));
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
