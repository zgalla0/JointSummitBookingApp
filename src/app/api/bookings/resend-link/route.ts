import { NextResponse } from "next/server";
import { identitySchema } from "@/lib/booking-schema";
import { findDuplicateBooking } from "@/lib/duplicate-check";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendResendLinkEmail } from "@/lib/email";

// Always returns the same neutral response whether or not a match was
// found, so this can't be used to probe which names/emails have a booking.
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = identitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { firstName, lastName, email } = parsed.data;
  const existing = await findDuplicateBooking(firstName, lastName, email);

  if (existing) {
    await sendResendLinkEmail({
      to: email,
      firstName: existing.firstName,
      magicLink: magicLinkUrl(existing.magicLinkToken),
    });
  }

  return NextResponse.json({ ok: true });
}
