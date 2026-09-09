const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Formats a Date (or ISO date string) as e.g. "Wed 1/21", using UTC fields
 *  since all event dates are stored as UTC midnight day markers. */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${WEEKDAY[d.getUTCDay()]} ${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

const MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Formats as e.g. "Jan 26" (month + day, no weekday, no year). */
export function formatMonthDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** e.g. "Jan 16-26" when start/end share a month, else "Jan 30-Feb 3". */
export function formatDateRangeShort(start: Date | string, end: Date | string): string {
  const a = typeof start === "string" ? new Date(start) : start;
  const b = typeof end === "string" ? new Date(end) : end;
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${MONTH[a.getUTCMonth()]} ${a.getUTCDate()}-${b.getUTCDate()}`;
  }
  return `${formatMonthDay(a)}-${formatMonthDay(b)}`;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** react-day-picker gives back Date objects at LOCAL midnight for the
 *  selected calendar day, so use local getters (not UTC) to round-trip. */
export function localDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
