import type { Booking } from "@prisma/client";
import { toISODate } from "./format";
import { terminalForAirline, type Terminal } from "./airport-terminals";

type FlightEntry = {
  bookingId: string;
  name: string;
  airline: string;
  flightNumber: string;
  dateTime: Date;
};

export type FlightGroup = {
  dateIso: string;
  terminal: Terminal;
  entries: FlightEntry[];
};

type Leg = "arrival" | "departure";

function buildEntries(bookings: Booking[], leg: Leg): FlightEntry[] {
  const airlineKey = leg === "arrival" ? "flightArrivalAirline" : "flightDepartureAirline";
  const numberKey = leg === "arrival" ? "flightArrivalNumber" : "flightDepartureNumber";
  const dateKey = leg === "arrival" ? "flightArrival" : "flightDeparture";

  return bookings
    .filter((b) => b[dateKey] != null)
    .map((b) => ({
      bookingId: b.id,
      name: `${b.reservationFirstName} ${b.reservationLastName}`,
      airline: b[airlineKey] ?? "Not provided",
      flightNumber: b[numberKey] ?? "",
      dateTime: b[dateKey] as Date,
    }));
}

/** Groups by calendar date (in the flight's own stored time, UTC) and
 *  terminal, sorted so an admin can scan straight down the page: earliest
 *  date first, then Terminal 1 before Terminal 2 before the uncertain/
 *  unknown buckets, and within a group by time so nearby flights are easy
 *  to spot for carpool grouping - the finer-grained grouping (who actually
 *  rides together) is left for the admin to do by hand from here. */
function groupEntries(entries: FlightEntry[]): FlightGroup[] {
  const buckets = new Map<string, FlightGroup>();
  for (const entry of entries) {
    const dateIso = toISODate(entry.dateTime);
    const terminal = terminalForAirline(entry.airline);
    const key = `${dateIso}__${terminal}`;
    if (!buckets.has(key)) buckets.set(key, { dateIso, terminal, entries: [] });
    buckets.get(key)!.entries.push(entry);
  }

  const terminalOrder: Record<Terminal, number> = { "1": 0, "2": 1, ambiguous: 2, unknown: 3 };
  const groups = [...buckets.values()];
  for (const group of groups) {
    group.entries.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }
  groups.sort((a, b) => {
    if (a.dateIso !== b.dateIso) return a.dateIso < b.dateIso ? -1 : 1;
    return terminalOrder[a.terminal] - terminalOrder[b.terminal];
  });
  return groups;
}

export function computeFlightGroups(bookings: Booking[]): {
  arrivals: FlightGroup[];
  departures: FlightGroup[];
} {
  const attending = bookings.filter((b) => b.status === "ACTIVE" && b.isAttending);
  return {
    arrivals: groupEntries(buildEntries(attending, "arrival")),
    departures: groupEntries(buildEntries(attending, "departure")),
  };
}
