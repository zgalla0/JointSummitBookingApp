import type { Booking } from "@prisma/client";
import { prisma } from "./prisma";
import { config, daysBetween } from "./config";
import { magicLinkUrl } from "./magic-link";
import { sendCancellationEmail, sendHotelCancellationNotice, sendAdminCancellationNotice } from "./email";

/** Shared cancellation logic used by both the attendee's self-service cancel
 *  (gated by the lock-in date) and the admin override (which isn't). Keeps
 *  the days-out hotel-notice threshold and the email trigger points in one
 *  place so the two call sites can't drift apart. */
export async function cancelBooking(booking: Booking, { byAdmin }: { byAdmin: boolean }) {
  const now = new Date();
  const daysOut = daysBetween(booking.stayStart, now);
  const hotelNotified = daysOut > config.cancelHotelNoticeDays;

  const cancelled = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelledAt: now, cancelledByAdmin: byAdmin },
    include: { guests: true },
  });

  await sendCancellationEmail({
    to: cancelled.detailsEmail,
    firstName: cancelled.firstName,
    magicLink: magicLinkUrl(cancelled.magicLinkToken),
    booking: cancelled,
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
    byAdmin,
    hotelNotifiedNote: hotelNotified
      ? "Yes, hotel contact was emailed automatically since cancellation was more than 10 days out"
      : "No, cancellation was within 10 days of check-in so the hotel was not automatically notified, follow up manually if needed",
  });

  return { cancelled, hotelNotified, daysOut };
}
