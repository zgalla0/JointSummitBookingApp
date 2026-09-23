import { NextResponse } from "next/server";
import { identitySchema } from "@/lib/booking-schema";
import { findBookingByEmail } from "@/lib/duplicate-check";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendDuplicateWarningEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = identitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Matched by email only - everyone is unique by email for this event.
  const { firstName, email } = parsed.data;
  const existing = await findBookingByEmail(email);

  if (!existing) {
    return NextResponse.json({ duplicate: false });
  }

  await sendDuplicateWarningEmail({
    to: existing.detailsEmail,
    firstName,
    magicLink: magicLinkUrl(existing.magicLinkToken),
  });

  return NextResponse.json({ duplicate: true });
}
