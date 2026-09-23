import type { Booking, BookingGuest } from "@prisma/client";
import { parseJsonArray, bookingNights } from "./admin-stats";
import { config } from "./config";
import { formatMonthDay } from "./format";
import { DIETARY_OPTIONS } from "./dietary-options";
import { ACTIVITY_OPTIONS } from "./activity-options";
import { ROOM_TYPES } from "./room-types";
import { LOCATION_OPTIONS } from "./location-options";

type BookingWithGuests = Booking & { guests?: BookingGuest[] };

function dietaryLabels(keys: string[], other: string | null): string[] {
  const labels = keys
    .filter((k) => k !== "OTHER")
    .map((k) => DIETARY_OPTIONS.find((o) => o.key === k)?.label ?? k);
  if (keys.includes("OTHER")) labels.push(other ? `Other (${other})` : "Other");
  return labels;
}

// Used inline (guest lines, comma-joined) rather than as its own bulleted
// list like the main dietary block below.
function dietaryLabel(keys: string[], other: string | null): string {
  const labels = dietaryLabels(keys, other);
  return labels.length > 0 ? labels.join(", ") : "Not specified";
}

function activityLabels(keys: string[], other: string | null): string[] {
  const labels = keys
    .filter((k) => k !== "OTHER")
    .map((k) => ACTIVITY_OPTIONS.find((o) => o.key === k)?.label ?? k);
  if (keys.includes("OTHER")) labels.push(other ? `Other (${other})` : "Other");
  return labels;
}

function formatFlightDateTime(date: Date | null): string {
  if (!date) return "";
  const [isoDate, isoTime] = date.toISOString().slice(0, 16).split("T");
  return `${isoDate} / ${isoTime}`;
}

/** Plain-text receipt of everything the attendee submitted - included at
 *  the bottom of confirmation/edit emails so they have a record of exactly
 *  what they signed up for, not just a magic link with nothing to show for
 *  it if they ever need to double-check later. */
export function buildBookingReceiptText(booking: BookingWithGuests): string {
  if (!booking.isAttending) {
    return "You're marked as not attending the summit - no hotel reservation, events, or other details are on file for you.";
  }

  const lines: string[] = [];
  const nights = bookingNights(booking);
  const companyPaid = new Set(parseJsonArray(booking.companyPaidNights));
  const companyNights = nights.filter((n) => companyPaid.has(n));
  const selfNights = nights.filter((n) => !companyPaid.has(n));
  const location = LOCATION_OPTIONS.find((o) => o.key === booking.location)?.label ?? booking.location;

  const DIVIDER = "-".repeat(40);
  const headerLabel = (s: string) => `${s} `;
  const bulletLabel = (s: string) => `   • ${s} `;

  lines.push(DIVIDER);
  lines.push(`${headerLabel("Reservation name:")}${booking.reservationFirstName} ${booking.reservationLastName}`);
  if (booking.nameTag) lines.push(`${headerLabel("Name tag:")}${booking.nameTag}`);
  lines.push(`${headerLabel("Location:")}${location}`);
  lines.push("");
  lines.push(
    `STAY:  ${formatMonthDay(booking.stayStart)} - ${formatMonthDay(booking.stayEnd)} (${nights.length} night${nights.length === 1 ? "" : "s"})`,
  );
  if (companyNights.length > 0) {
    lines.push(`${bulletLabel("Paid by Cuesta:")}${companyNights.map((n) => formatMonthDay(n)).join(", ")}`);
  }
  if (selfNights.length > 0) {
    lines.push(`${bulletLabel("Self-paid:")}${selfNights.map((n) => formatMonthDay(n)).join(", ")}`);
  }
  if (booking.extraNightsRoomType) {
    const roomLabel =
      ROOM_TYPES.find((rt) => rt.key === booking.extraNightsRoomType)?.label ?? booking.extraNightsRoomType;
    lines.push(`${bulletLabel("Room type (self-paid nights):")}${roomLabel}`);
  }

  const events = [
    booking.attendingHappyHour && `Happy Hour (${formatMonthDay(config.happyHourDate)})`,
    booking.attendingAllHands && `All Hands (${formatMonthDay(config.allHandsDate)})`,
    booking.attendingDinner && `Dinner (${formatMonthDay(config.dinnerDate)})`,
  ].filter((v): v is string => Boolean(v));
  lines.push("");
  lines.push("Events:");
  if (events.length > 0) {
    for (const event of events) lines.push(`   • ${event}`);
  } else {
    lines.push("   • None");
  }

  lines.push("");
  lines.push("Dietary:");
  const dietary = dietaryLabels(parseJsonArray(booking.dietaryOptions), booking.dietaryOther);
  if (dietary.length > 0) {
    for (const item of dietary) lines.push(`   • ${item}`);
  } else {
    lines.push("   • Not specified");
  }

  // Interest poll, not a commitment - only shown when something was
  // actually selected, unlike Dietary (which always shows, even as "Not
  // specified", since it's effectively required whenever it matters).
  const activities = activityLabels(parseJsonArray(booking.activityOptions), booking.activityOther);
  if (activities.length > 0) {
    lines.push("");
    lines.push("Activities interested in:");
    for (const item of activities) lines.push(`   • ${item}`);
  }

  const ptoDates = parseJsonArray(booking.ptoDates);
  if (ptoDates.length > 0) {
    lines.push("");
    lines.push("PTO days:");
    for (const d of ptoDates) lines.push(`   • ${formatMonthDay(d)}`);
  }

  if (booking.guests && booking.guests.length > 0) {
    lines.push("");
    lines.push("Additional guests:");
    for (const g of booking.guests) {
      const guestEvents = [
        g.attendingHappyHour && `Happy Hour (${formatMonthDay(config.happyHourDate)})`,
        g.attendingDinner && `Dinner (${formatMonthDay(config.dinnerDate)})`,
      ].filter((v): v is string => Boolean(v));
      const guestDiet = dietaryLabel(parseJsonArray(g.dietaryOptions), g.dietaryOther);
      lines.push(`   • ${g.firstName} ${g.lastName} (${g.type === "CHILD" ? "Child" : "Adult"}):`);
      if (guestEvents.length > 0) lines.push(`      • Joining: ${guestEvents.join(", ")}`);
      lines.push(`      • Dietary: ${guestDiet}`);
    }
  }

  if (booking.flightArrivalAirline || booking.flightDepartureAirline) {
    lines.push("");
    lines.push("Flights:");

    const flightRows = [
      booking.flightArrivalAirline && {
        label: "Arrival:",
        airline: booking.flightArrivalAirline,
        number: booking.flightArrivalNumber || "",
        when: formatFlightDateTime(booking.flightArrival),
      },
      booking.flightDepartureAirline && {
        label: "Departure:",
        airline: booking.flightDepartureAirline,
        number: booking.flightDepartureNumber || "",
        when: formatFlightDateTime(booking.flightDeparture),
      },
    ].filter((r): r is { label: string; airline: string; number: string; when: string } => Boolean(r));

    // Column widths come from just these 1-2 rows (not a fixed constant),
    // so "Arrival"/"Departure" and the airline/flight-number columns line
    // up under each other whatever the actual airline name length is.
    const labelWidth = Math.max(...flightRows.map((r) => r.label.length));
    const airlineWidth = Math.max(...flightRows.map((r) => r.airline.length));
    const numberWidth = Math.max(...flightRows.map((r) => r.number.length));
    const showNumberColumn = flightRows.some((r) => r.number);

    for (const row of flightRows) {
      const columns = [row.airline.padEnd(airlineWidth)];
      if (showNumberColumn) columns.push(row.number.padEnd(numberWidth));
      if (row.when) columns.push(row.when);
      lines.push(`   • ${row.label.padEnd(labelWidth)} ${columns.join("    |    ").trimEnd()}`);
    }

    if (booking.flightNotes) lines.push(`${bulletLabel("Flight notes:")}${booking.flightNotes}`);
  }

  if (booking.additionalNotes) {
    lines.push("");
    lines.push("Additional notes:");
    lines.push(`  ${booking.additionalNotes}`);
  }

  lines.push(DIVIDER);

  return lines.join("\n");
}
