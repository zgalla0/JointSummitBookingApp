import type { Booking, BookingGuest } from "@prisma/client";
import type { BookingFormInput } from "./booking-schema";
import { toISODate } from "./format";
import type { RoomTypeKey } from "./room-types";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
    reservationFirstName: booking.reservationFirstName,
    reservationLastName: booking.reservationLastName,
    hotelEmail: booking.hotelEmail,
    detailsEmail: booking.detailsEmail,
    attendingHappyHour: booking.attendingHappyHour,
    happyHourPlusOne: booking.happyHourPlusOne,
    attendingAllHands: booking.attendingAllHands,
    attendingDinner: booking.attendingDinner,
    dinnerPlusOne: booking.dinnerPlusOne,
    stayStart: toISODate(booking.stayStart),
    stayEnd: toISODate(booking.stayEnd),
    companyPaidNights: parseJsonArray(booking.companyPaidNights),
    extraNightsRoomType: (booking.extraNightsRoomType ?? "") as RoomTypeKey | "",
    ptoDates: parseJsonArray(booking.ptoDates),
    guests: booking.guests.map((g) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      type: g.type,
    })),
    dietaryOptions: parseJsonArray(booking.dietaryOptions) as BookingFormInput["dietaryOptions"],
    dietaryOther: booking.dietaryOther ?? "",
    flightArrivalAirline: booking.flightArrivalAirline ?? "",
    flightArrivalNumber: booking.flightArrivalNumber ?? "",
    flightArrival: toDatetimeLocal(booking.flightArrival),
    flightDepartureAirline: booking.flightDepartureAirline ?? "",
    flightDepartureNumber: booking.flightDepartureNumber ?? "",
    flightDeparture: toDatetimeLocal(booking.flightDeparture),
    flightNotes: booking.flightNotes ?? "",
    additionalNotes: booking.additionalNotes ?? "",
  };
}
