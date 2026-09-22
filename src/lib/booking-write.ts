import type { Prisma } from "@prisma/client";
import { config } from "./config";
import { toISODate } from "./format";
import { needsRoomTypeChoice } from "./stay-tiles-client";
import { ROOM_TYPE_KEYS } from "./room-types";
import type { BookingFormInput, GuestInput } from "./booking-schema";

/** Server-side mirror of BookingFields.tsx's client-side check (same
 *  underlying logic, in stay-tiles-client.ts) - true when a room type
 *  choice is required because at least one night falls outside the
 *  standard block or the guaranteed group rate window and isn't already
 *  covered by Cuesta. Needs to live server-side too since the block/
 *  discount config itself is server-only. */
export function bookingNeedsRoomType(
  stayStart: string,
  stayEnd: string,
  companyPaidNights: string[],
): boolean {
  return needsRoomTypeChoice(
    stayStart,
    stayEnd,
    companyPaidNights,
    toISODate(config.blockStart),
    toISODate(config.blockEnd),
    toISODate(config.discountStart),
    toISODate(config.discountEnd),
  );
}

export function isValidRoomType(value: string): boolean {
  return (ROOM_TYPE_KEYS as readonly string[]).includes(value);
}

/** Shared field mapping from validated form input to the Prisma write shape,
 *  used by both create and edit so the two can't drift apart. Excludes
 *  magicLinkToken/magicLinkExpiresAt/guests, which differ by call site. */
export function bookingWriteData(
  data: BookingFormInput,
  needsRoomType: boolean,
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
    nameTag: data.nameTag || null,
    hotelEmail: data.hotelEmail,
    detailsEmail: data.detailsEmail,
    cuestaEmail: data.cuestaEmail,
    attendingHappyHour: data.isAttending && data.attendingHappyHour,
    attendingAllHands: data.isAttending && data.attendingAllHands,
    attendingDinner: data.isAttending && data.attendingDinner,
    stayStart: new Date(`${stayStartIso}T00:00:00.000Z`),
    stayEnd: new Date(`${stayEndIso}T00:00:00.000Z`),
    companyPaidNights: JSON.stringify(data.isAttending ? data.companyPaidNights : []),
    extraNightsRoomType: data.isAttending && needsRoomType ? data.extraNightsRoomType : null,
    ptoDates: data.isAttending && data.ptoDates.length > 0 ? JSON.stringify(data.ptoDates) : null,
    dietaryOptions: JSON.stringify(data.isAttending ? data.dietaryOptions : []),
    dietaryOther: data.isAttending && data.dietaryOptions.includes("OTHER") ? data.dietaryOther || null : null,
    flightArrivalAirline: data.isAttending ? data.flightArrivalAirline || null : null,
    flightArrivalNumber: data.isAttending ? data.flightArrivalNumber || null : null,
    flightArrival: data.isAttending && data.flightArrival ? new Date(data.flightArrival) : null,
    flightDepartureAirline: data.isAttending ? data.flightDepartureAirline || null : null,
    flightDepartureNumber: data.isAttending ? data.flightDepartureNumber || null : null,
    flightDeparture: data.isAttending && data.flightDeparture ? new Date(data.flightDeparture) : null,
    flightNotes: data.isAttending ? data.flightNotes || null : null,
    additionalNotes: data.additionalNotes || null,
    flaggedForReview: data.isAttending && data.guests.length > 1,
    flagReason: data.isAttending && data.guests.length > 1 ? "More than 1 additional guest" : null,
  };
}

/** Shared guest field mapping, used by both create and edit. Pass an empty
 *  array (rather than data.guests) when the booking isn't attending - a
 *  non-attendee never has real companion data to carry forward. */
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
