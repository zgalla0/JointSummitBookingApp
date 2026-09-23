import type { Booking, BookingGuest } from "@prisma/client";
import type { BookingFormInput } from "./booking-schema";
import { toISODate } from "./format";
import { parseJsonArray } from "./admin-stats";
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
): BookingFormInput {
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
    stayStart: booking.isAttending ? toISODate(booking.stayStart) : "",
    stayEnd: booking.isAttending ? toISODate(booking.stayEnd) : "",
    companyPaidNights: parseJsonArray(booking.companyPaidNights),
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
