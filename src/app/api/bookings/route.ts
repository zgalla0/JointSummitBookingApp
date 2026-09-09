import { NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/booking-schema";
import { findDuplicateBooking } from "@/lib/duplicate-check";
import { prisma } from "@/lib/prisma";
import { generateMagicLinkToken, magicLinkExpiry, magicLinkUrl } from "@/lib/magic-link";
import { sendConfirmationEmail } from "@/lib/email";

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

  const magicLinkToken = generateMagicLinkToken();

  const booking = await prisma.booking.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      reservationName: data.reservationName,
      hotelEmail: data.hotelEmail,
      detailsEmail: data.detailsEmail,
      attendingHappyHour: data.attendingHappyHour,
      attendingAllHands: data.attendingAllHands,
      attendingDinner: data.attendingDinner,
      stayStart: new Date(`${data.stayStart}T00:00:00.000Z`),
      stayEnd: new Date(`${data.stayEnd}T00:00:00.000Z`),
      selectEligible: data.selectEligible,
      needsExtraNights: data.needsExtraNights,
      extraNights: data.needsExtraNights ? JSON.stringify(data.extraNights) : null,
      dietaryRestrictions: data.dietaryRestrictions || null,
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
    reservationName: booking.reservationName,
    stayStart: booking.stayStart,
    stayEnd: booking.stayEnd,
  });

  return NextResponse.json({ id: booking.id, magicLink });
}
