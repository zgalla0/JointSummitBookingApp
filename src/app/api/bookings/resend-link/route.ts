import { NextResponse } from "next/server";
import { emailLookupSchema } from "@/lib/booking-schema";
import { findBookingByEmail } from "@/lib/duplicate-check";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendResendLinkEmail } from "@/lib/email";

// Always returns the same neutral response whether or not a match was
// found, so this can't be used to probe which emails have a booking.
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = emailLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email } = parsed.data;
  const existing = await findBookingByEmail(email);

  if (existing) {
    await sendResendLinkEmail({
      to: existing.detailsEmail,
      firstName: existing.firstName,
      magicLink: magicLinkUrl(existing.magicLinkToken),
    });
  }

  return NextResponse.json({ ok: true });
}
