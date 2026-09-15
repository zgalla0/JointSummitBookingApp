import { NextResponse } from "next/server";
import { getBookingByToken } from "@/lib/get-booking-by-token";
import { isLockedIn } from "@/lib/config";
import { cancelBooking } from "@/lib/cancel-booking";

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

  const { hotelNotified, daysOut } = await cancelBooking(booking, { byAdmin: false });
  return NextResponse.json({ id: booking.id, hotelNotified, daysOut });
}
