import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendFlightDetailsReminderEmail } from "@/lib/email";
import { computeFlightStatusList } from "@/lib/admin-stats";
import { defaultFlightReminderTemplate, renderFlightReminder } from "@/lib/flight-reminder-email";

// Admin-triggered reminder to active, attending bookings that aren't
// "complete" (either leg still missing) - recomputed here from the database
// rather than trusting a client-supplied list, so this always matches
// what's actually on file. The admin can edit the template before sending.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const rawTemplate = (body as { template?: unknown })?.template;
  const template =
    typeof rawTemplate === "string" && rawTemplate.trim() ? rawTemplate : defaultFlightReminderTemplate();

  const bookings = await prisma.booking.findMany();
  const incompleteIds = new Set(
    computeFlightStatusList(bookings)
      .filter((row) => row.status !== "complete")
      .map((row) => row.bookingId),
  );
  const recipients = bookings.filter((b) => incompleteIds.has(b.id));

  for (const booking of recipients) {
    await sendFlightDetailsReminderEmail({
      to: booking.detailsEmail,
      body: renderFlightReminder(template, booking.firstName, magicLinkUrl(booking.magicLinkToken)),
    });
  }

  return NextResponse.json({ sent: recipients.length });
}
