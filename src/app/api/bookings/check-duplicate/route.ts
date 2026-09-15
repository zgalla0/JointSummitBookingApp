import { NextResponse } from "next/server";
import { identitySchema } from "@/lib/booking-schema";
import { findBookingByName } from "@/lib/duplicate-check";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendDuplicateWarningEmail } from "@/lib/email";

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
