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

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
