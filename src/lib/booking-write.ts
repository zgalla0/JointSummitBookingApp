import type { Prisma } from "@prisma/client";
import { config } from "./config";
import { toISODate } from "./format";
import { isoDateRange, addIsoDays } from "./stay-tiles-client";
import { ROOM_TYPE_KEYS } from "./room-types";
import type { BookingFormInput } from "./booking-schema";

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
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    reservationFirstName: data.reservationFirstName,
    reservationLastName: data.reservationLastName,
    hotelEmail: data.hotelEmail,
    detailsEmail: data.detailsEmail,
    attendingHappyHour: data.attendingHappyHour,
    happyHourPlusOne: data.attendingHappyHour && data.happyHourPlusOne,
    attendingAllHands: data.attendingAllHands,
    attendingDinner: data.attendingDinner,
    dinnerPlusOne: data.attendingDinner && data.dinnerPlusOne,
    stayStart: new Date(`${data.stayStart}T00:00:00.000Z`),
    stayEnd: new Date(`${data.stayEnd}T00:00:00.000Z`),
    companyPaidNights: JSON.stringify(data.companyPaidNights),
    extraNightsRoomType: outsideBlock ? data.extraNightsRoomType : null,
    ptoDates: data.ptoDates.length > 0 ? JSON.stringify(data.ptoDates) : null,
    dietaryOptions: JSON.stringify(data.dietaryOptions),
    dietaryOther: data.dietaryOptions.includes("OTHER") ? data.dietaryOther || null : null,
    flightAirline: data.flightAirline || null,
    flightNumber: data.flightNumber || null,
    flightArrival: data.flightArrival ? new Date(data.flightArrival) : null,
    flightDeparture: data.flightDeparture ? new Date(data.flightDeparture) : null,
    flightNotes: data.flightNotes || null,
    flaggedForReview: data.guests.length > 1,
    flagReason: data.guests.length > 1 ? "More than 1 additional guest" : null,
  };
}
