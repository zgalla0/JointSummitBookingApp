import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/cancel-booking";
import { findBookingByIdOrNotFound } from "@/lib/require-booking";

// Admin override: unlike the attendee-facing cancel route, this isn't
// gated by the lock-in date, since the whole point is to handle changes
// after the automatic self-service window has closed.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findBookingByIdOrNotFound(id);
  if ("notFound" in result) return result.notFound;
  const { booking } = result;

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ id: booking.id, alreadyCancelled: true });
  }

  const { hotelNotified, daysOut } = await cancelBooking(booking, { byAdmin: true });
  return NextResponse.json({ id: booking.id, hotelNotified, daysOut });
}
