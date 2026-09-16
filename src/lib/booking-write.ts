import type { Prisma } from "@prisma/client";
import { config } from "./config";
import { toISODate } from "./format";
import { isoDateRange, addIsoDays } from "./stay-tiles-client";
import { ROOM_TYPE_KEYS } from "./room-types";
import type { BookingFormInput, GuestInput } from "./booking-schema";

/** True when any selected night falls outside the standard block, meaning a
 *  room type choice is required (the block config only lives server-side,
 *  so this can't be a zod refine on the client). */
export function hasNightsOutsideBlock(stayStart: string, stayEnd: string): boolean {
  const blockStart = toISODate(config.blockStart);
  const blockEnd = toISODate(config.blockEnd);
  const lastNight = addIsoDays(stayEnd, -1);
  return isoDateRange(stayStart, lastNight).some((night) => night < blockStart || night > blockEnd);
}

export function isValidRoomType(value: string): boolean {
  return (ROOM_TYPE_KEYS as readonly string[]).includes(value);
}

/** Shared field mapping from validated form input to the Prisma write shape,
 *  used by both create and edit so the two can't drift apart. Excludes
 *  magicLinkToken/magicLinkExpiresAt/guests, which differ by call site. */
export function bookingWriteData(
  data: BookingFormInput,
  outsideBlock: boolean,
): Omit<Prisma.BookingUncheckedCreateInput, "magicLinkToken" | "magicLinkExpiresAt" | "guests"> {
  // A non-attendee never picks stay dates - store a zero-night placeholder
  // (checkout same day as check-in) so every downstream night/room/PTO
  // computation naturally sees nothing for them, with no special-casing.
  const placeholder = toISODate(config.bookableStart);
  const stayStartIso = data.isAttending ? data.stayStart : placeholder;
  const stayEndIso = data.isAttending ? data.stayEnd : placeholder;

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    isAttending: data.isAttending,
    // Guaranteed non-empty by the schema's refine; the type still carries
    // "" for the form's unselected default.
    location: data.location as Exclude<BookingFormInput["location"], "">,
    reservationFirstName: data.reservationFirstName,
    reservationLastName: data.reservationLastName,
    hotelEmail: data.hotelEmail,
    detailsEmail: data.detailsEmail,
    attendingHappyHour: data.isAttending && data.attendingHappyHour,
    attendingAllHands: data.isAttending && data.attendingAllHands,
    attendingDinner: data.isAttending && data.attendingDinner,
    stayStart: new Date(`${stayStartIso}T00:00:00.000Z`),
    stayEnd: new Date(`${stayEndIso}T00:00:00.000Z`),
    companyPaidNights: JSON.stringify(data.isAttending ? data.companyPaidNights : []),
    extraNightsRoomType: data.isAttending && outsideBlock ? data.extraNightsRoomType : null,
    ptoDates: data.isAttending && data.ptoDates.length > 0 ? JSON.stringify(data.ptoDates) : null,
    dietaryOptions: JSON.stringify(data.dietaryOptions),
    dietaryOther: data.dietaryOptions.includes("OTHER") ? data.dietaryOther || null : null,
    flightArrivalAirline: data.flightArrivalAirline || null,
    flightArrivalNumber: data.flightArrivalNumber || null,
    flightArrival: data.flightArrival ? new Date(data.flightArrival) : null,
    flightDepartureAirline: data.flightDepartureAirline || null,
    flightDepartureNumber: data.flightDepartureNumber || null,
    flightDeparture: data.flightDeparture ? new Date(data.flightDeparture) : null,
    flightNotes: data.flightNotes || null,
    additionalNotes: data.additionalNotes || null,
    flaggedForReview: data.guests.length > 1,
    flagReason: data.guests.length > 1 ? "More than 1 additional guest" : null,
  };
}

/** Shared guest field mapping, used by both create and edit. */
export function guestWriteData(guests: GuestInput[]) {
  return guests.map((g) => ({
    firstName: g.firstName,
    lastName: g.lastName,
    type: g.type,
    attendingHappyHour: g.attendingHappyHour,
    attendingDinner: g.attendingDinner,
    dietaryOptions: JSON.stringify(g.dietaryOptions),
    dietaryOther: g.dietaryOptions.includes("OTHER") ? g.dietaryOther || null : null,
  }));
}
