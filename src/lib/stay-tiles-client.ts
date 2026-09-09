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

export function isoMonthDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
