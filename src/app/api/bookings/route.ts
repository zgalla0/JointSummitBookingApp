import { NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/booking-schema";
import { findDuplicateBooking } from "@/lib/duplicate-check";
import { prisma } from "@/lib/prisma";
import { generateMagicLinkToken, magicLinkExpiry, magicLinkUrl } from "@/lib/magic-link";
import { sendConfirmationEmail } from "@/lib/email";
import { bookingWriteData, hasNightsOutsideBlock, isValidRoomType } from "@/lib/booking-write";

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

  const outsideBlock = hasNightsOutsideBlock(data.stayStart, data.stayEnd);
  if (outsideBlock && !isValidRoomType(data.extraNightsRoomType)) {
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
      ...bookingWriteData(data, outsideBlock),
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
