import type { Booking, BookingGuest } from "@prisma/client";
import { parseJsonArray, bookingNights } from "./admin-stats";
import { formatMonthDay } from "./format";
import { DIETARY_OPTIONS } from "./dietary-options";
import { ROOM_TYPES } from "./room-types";
import { LOCATION_OPTIONS } from "./location-options";

type BookingWithGuests = Booking & { guests?: BookingGuest[] };

function dietaryLabel(keys: string[], other: string | null): string {
  if (keys.length === 0) return "Not specified";
  const labels = keys
    .filter((k) => k !== "OTHER")
    .map((k) => DIETARY_OPTIONS.find((o) => o.key === k)?.label ?? k);
  if (keys.includes("OTHER")) labels.push(other ? `Other (${other})` : "Other");
  return labels.join(", ");
}

function formatFlightDateTime(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 16).replace("T", " ");
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

  lines.push(`Reservation name: ${booking.reservationFirstName} ${booking.reservationLastName}`);
  if (booking.nameTag) lines.push(`Name tag: ${booking.nameTag}`);
  lines.push(`Location: ${location}`);
  lines.push("");
  lines.push(
    `Stay: ${formatMonthDay(booking.stayStart)} - ${formatMonthDay(booking.stayEnd)} (${nights.length} night${nights.length === 1 ? "" : "s"})`,
  );
  if (companyNights.length > 0) {
    lines.push(`  Paid by Cuesta: ${companyNights.map((n) => formatMonthDay(n)).join(", ")}`);
  }
  if (selfNights.length > 0) {
    lines.push(`  Self-paid: ${selfNights.map((n) => formatMonthDay(n)).join(", ")}`);
  }
  if (booking.extraNightsRoomType) {
    const roomLabel =
      ROOM_TYPES.find((rt) => rt.key === booking.extraNightsRoomType)?.label ?? booking.extraNightsRoomType;
    lines.push(`  Room type for night(s) outside the standard rate: ${roomLabel}`);
  }

  const events = [
    booking.attendingHappyHour && "Happy Hour",
    booking.attendingAllHands && "All Hands",
    booking.attendingDinner && "Dinner",
  ].filter(Boolean);
  lines.push("");
  lines.push(`Events attending: ${events.length > 0 ? events.join(", ") : "None"}`);
  lines.push(
    `Dietary restrictions: ${dietaryLabel(parseJsonArray(booking.dietaryOptions), booking.dietaryOther)}`,
  );

  const ptoDates = parseJsonArray(booking.ptoDates);
  if (ptoDates.length > 0) {
    lines.push(`PTO days: ${ptoDates.map((d) => formatMonthDay(d)).join(", ")}`);
  }

  if (booking.guests && booking.guests.length > 0) {
    lines.push("");
    lines.push("Additional guests:");
    for (const g of booking.guests) {
      const guestEvents = [g.attendingHappyHour && "Happy Hour", g.attendingDinner && "Dinner"].filter(
        Boolean,
      );
      const guestDiet = dietaryLabel(parseJsonArray(g.dietaryOptions), g.dietaryOther);
      const eventsNote = guestEvents.length > 0 ? `, joining: ${guestEvents.join(", ")}` : "";
      lines.push(
        `  - ${g.firstName} ${g.lastName} (${g.type === "CHILD" ? "Child" : "Adult"})${eventsNote}, dietary: ${guestDiet}`,
      );
    }
  }

  if (booking.flightArrivalAirline || booking.flightDepartureAirline) {
    lines.push("");
    lines.push("Flight details:");
    if (booking.flightArrivalAirline) {
      const when = formatFlightDateTime(booking.flightArrival);
      lines.push(
        `  Arrival: ${booking.flightArrivalAirline} ${booking.flightArrivalNumber || ""}${when ? `, ${when}` : ""}`.trimEnd(),
      );
    }
    if (booking.flightDepartureAirline) {
      const when = formatFlightDateTime(booking.flightDeparture);
      lines.push(
        `  Departure: ${booking.flightDepartureAirline} ${booking.flightDepartureNumber || ""}${when ? `, ${when}` : ""}`.trimEnd(),
      );
    }
    if (booking.flightNotes) lines.push(`  Flight notes: ${booking.flightNotes}`);
  }

  if (booking.additionalNotes) {
    lines.push("");
    lines.push(`Additional notes: ${booking.additionalNotes}`);
  }

  return lines.join("\n");
}
