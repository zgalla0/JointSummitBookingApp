import { NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/booking-schema";
import { findDuplicateBooking } from "@/lib/duplicate-check";
import { prisma } from "@/lib/prisma";
import { getBookingByToken } from "@/lib/get-booking-by-token";
import { isLockedIn } from "@/lib/config";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendEditConfirmationEmail } from "@/lib/email";
import { bookingWriteData, hasNightsOutsideBlock, isValidRoomType } from "@/lib/booking-write";

export async function PUT(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) {
    return NextResponse.json({ error: { formErrors: ["Booking not found."] } }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json(
      { error: { formErrors: ["This booking has been cancelled. Submit the form again to rejoin."] } },
      { status: 400 },
    );
  }

  if (isLockedIn()) {
    return NextResponse.json(
      {
        error: {
          formErrors: [
            "Reservations locked in on the lock-in date, one month before the event. This form can no longer make automatic changes, please reach out to the planning team directly.",
          ],
        },
      },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = bookingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const conflicting = await findDuplicateBooking(
    data.firstName,
    data.lastName,
    data.hotelEmail,
    booking.id,
  );
  if (conflicting) {
    return NextResponse.json(
      { error: { formErrors: ["Another booking already exists for this name and email."] } },
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

  const updated = await prisma.$transaction(async (tx) => {
    await tx.bookingGuest.deleteMany({ where: { bookingId: booking.id } });
    return tx.booking.update({
      where: { id: booking.id },
      data: {
        ...bookingWriteData(data, outsideBlock),
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
  });

  await sendEditConfirmationEmail({
    to: updated.detailsEmail,
    firstName: updated.firstName,
    magicLink: magicLinkUrl(token),
    stayStart: updated.stayStart,
    stayEnd: updated.stayEnd,
  });

  return NextResponse.json({ id: updated.id });
}
