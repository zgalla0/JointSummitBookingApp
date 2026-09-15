import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendFlightDetailsReminderEmail } from "@/lib/email";

// Admin-triggered reminder to active attendees who haven't entered flight
// details yet, so carpool groups can be finalized closer to the event.
export async function POST() {
  const missing = await prisma.booking.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        { OR: [{ flightAirline: null }, { flightAirline: "" }] },
        { OR: [{ flightNumber: null }, { flightNumber: "" }] },
      ],
    },
  });

  for (const booking of missing) {
    await sendFlightDetailsReminderEmail({
      to: booking.detailsEmail,
      firstName: booking.firstName,
      magicLink: magicLinkUrl(booking.magicLinkToken),
    });
  }

  return NextResponse.json({ sent: missing.length });
}
