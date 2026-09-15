import { NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/booking-schema";
import { findDuplicateBooking } from "@/lib/duplicate-check";
import { prisma } from "@/lib/prisma";
import { generateMagicLinkToken, magicLinkExpiry, magicLinkUrl } from "@/lib/magic-link";
import { sendConfirmationEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { toISODate } from "@/lib/format";
import { isoDateRange, addIsoDays } from "@/lib/stay-tiles-client";
import { ROOM_TYPE_KEYS } from "@/lib/room-types";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bookingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Defense in depth: the client already ran the Step 0 duplicate check, but
  // re-verify here in case of a race or a client that skipped it.
  const existing = await findDuplicateBooking(data.firstName, data.lastName, data.hotelEmail);
  if (existing) {
    return NextResponse.json(
      { error: { formErrors: ["A booking already exists for this name and email."] } },
      { status: 409 },
    );
  }

  // Nights outside the standard block are always self-paid and need a room
  // type choice; the block config only lives server-side, so this can't be
  // a zod refine.
  const blockStart = toISODate(config.blockStart);
  const blockEnd = toISODate(config.blockEnd);
  const lastNight = addIsoDays(data.stayEnd, -1);
  const hasNightsOutsideBlock = isoDateRange(data.stayStart, lastNight).some(
    (night) => night < blockStart || night > blockEnd,
  );
  if (hasNightsOutsideBlock && !ROOM_TYPE_KEYS.includes(data.extraNightsRoomType as never)) {
    return NextResponse.json(
      {
        error: {
          formErrors: ["Please choose a room type for the night(s) outside the standard block."],
        },
      },
      { status: 400 },
    );
  }

  const magicLinkToken = generateMagicLinkToken();

  const booking = await prisma.booking.create({
    data: {
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
      extraNightsRoomType: hasNightsOutsideBlock ? data.extraNightsRoomType : null,
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
      magicLinkToken,
      magicLinkExpiresAt: magicLinkExpiry(),
      guests: {
        create: data.guests.map((g) => ({
          firstName: g.firstName,
          lastName: g.lastName,
          type: g.type,
        })),
      },
    },
    include: { guests: true },
  });

  const magicLink = magicLinkUrl(magicLinkToken);

  await sendConfirmationEmail({
    to: booking.detailsEmail,
    firstName: booking.firstName,
    magicLink,
    reservationFirstName: booking.reservationFirstName,
    reservationLastName: booking.reservationLastName,
    stayStart: booking.stayStart,
    stayEnd: booking.stayEnd,
  });

  return NextResponse.json({ id: booking.id, magicLink });
}
