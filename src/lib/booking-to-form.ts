import type { Booking, BookingGuest } from "@prisma/client";
import type { BookingFormInput } from "./booking-schema";
import { toISODate } from "./format";
import { parseJsonArray } from "./admin-stats";
import { addIsoDays, isoDateRange } from "./stay-tiles-client";
import type { RoomTypeKey } from "./room-types";

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  // datetime-local inputs want "YYYY-MM-DDTHH:mm", no timezone/seconds.
  return date.toISOString().slice(0, 16);
}

/** Converts a stored Booking (+ guests) back into the form's shape, so the
 *  magic-link edit page can pre-fill react-hook-form with it. */
export function bookingToFormInput(
  booking: Booking & { guests: BookingGuest[] },
  optionalCompanyPaidNights: string[] = [],
): BookingFormInput {
  const stayStart = booking.isAttending ? toISODate(booking.stayStart) : "";
  const stayEnd = booking.isAttending ? toISODate(booking.stayEnd) : "";
  const companyPaidNights = parseJsonArray(booking.companyPaidNights);

  // An already-submitted booking made its self-pay/company-pay choice for
  // every optional night at submit time (the old default was company-paid,
  // so "not in companyPaidNights" only ever happened when the attendee
  // actively chose otherwise) - treat those as already decided rather than
  // forcing a re-choice on every edit.
  const companyPaidSet = new Set(companyPaidNights);
  const lastNight = stayEnd ? addIsoDays(stayEnd, -1) : "";
  const nights = stayStart && lastNight >= stayStart ? isoDateRange(stayStart, lastNight) : [];
  const selfPayNights = nights.filter(
    (d) => optionalCompanyPaidNights.includes(d) && !companyPaidSet.has(d),
  );

  return {
    firstName: booking.firstName,
    lastName: booking.lastName,
    isAttending: booking.isAttending,
    location: booking.location,
    reservationFirstName: booking.reservationFirstName,
    reservationLastName: booking.reservationLastName,
    nameTag: booking.nameTag ?? "",
    hotelEmail: booking.hotelEmail,
    detailsEmail: booking.detailsEmail,
    cuestaEmail: booking.cuestaEmail,
    attendingHappyHour: booking.attendingHappyHour,
    attendingAllHands: booking.attendingAllHands,
    attendingDinner: booking.attendingDinner,
    stayStart,
    stayEnd,
    companyPaidNights,
    selfPayNights,
    extraNightsRoomType: (booking.extraNightsRoomType ?? "") as RoomTypeKey | "",
    ptoDates: parseJsonArray(booking.ptoDates),
    guests: booking.guests.map((g) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      type: g.type,
      attendingHappyHour: g.attendingHappyHour,
      attendingDinner: g.attendingDinner,
      dietaryOptions: parseJsonArray(g.dietaryOptions) as BookingFormInput["dietaryOptions"],
      dietaryOther: g.dietaryOther ?? "",
    })),
    dietaryOptions: parseJsonArray(booking.dietaryOptions) as BookingFormInput["dietaryOptions"],
    dietaryOther: booking.dietaryOther ?? "",
    activityOptions: parseJsonArray(booking.activityOptions) as BookingFormInput["activityOptions"],
    activityOther: booking.activityOther ?? "",
    flightArrivalAirline: booking.flightArrivalAirline ?? "",
    flightArrivalNumber: booking.flightArrivalNumber ?? "",
    flightArrival: toDatetimeLocal(booking.flightArrival),
    flightDepartureAirline: booking.flightDepartureAirline ?? "",
    flightDepartureNumber: booking.flightDepartureNumber ?? "",
    flightDeparture: toDatetimeLocal(booking.flightDeparture),
    additionalNotes: booking.additionalNotes ?? "",
  };
}
