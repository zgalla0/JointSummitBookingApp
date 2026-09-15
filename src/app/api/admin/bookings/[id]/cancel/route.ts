import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelBooking } from "@/lib/cancel-booking";

// Admin override: unlike the attendee-facing cancel route, this isn't
// gated by the lock-in date, since the whole point is to handle changes
// after the automatic self-service window has closed.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: { formErrors: ["Booking not found."] } }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ id: booking.id, alreadyCancelled: true });
  }

  const { hotelNotified, daysOut } = await cancelBooking(booking, { byAdmin: true });
  return NextResponse.json({ id: booking.id, hotelNotified, daysOut });
}
