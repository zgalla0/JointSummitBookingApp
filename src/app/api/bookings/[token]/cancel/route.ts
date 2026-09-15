import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingByToken } from "@/lib/get-booking-by-token";
import { config, isLockedIn, daysBetween } from "@/lib/config";
import { magicLinkUrl } from "@/lib/magic-link";
import {
  sendCancellationEmail,
  sendHotelCancellationNotice,
  sendAdminCancellationNotice,
} from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) {
    return NextResponse.json({ error: { formErrors: ["Booking not found."] } }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ id: booking.id, alreadyCancelled: true });
  }

  if (isLockedIn()) {
    return NextResponse.json(
      {
        error: {
          formErrors: [
            "Reservations locked in on the lock-in date, one month before the event. This form can no longer make automatic changes, please reach out to the planning team directly to cancel.",
          ],
        },
      },
      { status: 403 },
    );
  }

  const now = new Date();
  const daysOut = daysBetween(booking.stayStart, now);
  const hotelNotified = daysOut > config.cancelHotelNoticeDays;

  const cancelled = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelledAt: now, cancelledByAdmin: false },
  });

  await sendCancellationEmail({
    to: cancelled.detailsEmail,
    firstName: cancelled.firstName,
    magicLink: magicLinkUrl(token),
    stayStart: cancelled.stayStart,
    stayEnd: cancelled.stayEnd,
  });

  if (hotelNotified) {
    await sendHotelCancellationNotice({
      reservationFirstName: cancelled.reservationFirstName,
      reservationLastName: cancelled.reservationLastName,
      stayStart: cancelled.stayStart,
      stayEnd: cancelled.stayEnd,
    });
  }

  await sendAdminCancellationNotice({
    fullName: `${cancelled.firstName} ${cancelled.lastName}`,
    stayStart: cancelled.stayStart,
    stayEnd: cancelled.stayEnd,
    daysOut,
    hotelNotifiedNote: hotelNotified
      ? "Yes, hotel contact was emailed automatically since cancellation was more than 10 days out"
      : "No, cancellation was within 10 days of check-in so the hotel was not automatically notified, follow up manually if needed",
  });

  return NextResponse.json({ id: cancelled.id, hotelNotified, daysOut });
}
