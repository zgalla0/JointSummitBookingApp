import { NextResponse } from "next/server";
import { identitySchema } from "@/lib/booking-schema";
import { findBookingByName } from "@/lib/duplicate-check";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendResendLinkEmail } from "@/lib/email";

// Always returns the same neutral response whether or not a match was
// found, so this can't be used to probe which names have a booking.
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = identitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Matched by name only (no two attendees share a name for this event) -
  // the email typed here may not be the one on file, so the link goes to
  // whichever email the original booking actually used.
  const { firstName, lastName } = parsed.data;
  const existing = await findBookingByName(firstName, lastName);

  if (existing) {
    await sendResendLinkEmail({
      to: existing.detailsEmail,
      firstName: existing.firstName,
      magicLink: magicLinkUrl(existing.magicLinkToken),
    });
  }

  return NextResponse.json({ ok: true });
}
