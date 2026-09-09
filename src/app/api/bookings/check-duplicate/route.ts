import { NextResponse } from "next/server";
import { identitySchema } from "@/lib/booking-schema";
import { findDuplicateBooking } from "@/lib/duplicate-check";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendDuplicateWarningEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = identitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { firstName, lastName, email } = parsed.data;
  const existing = await findDuplicateBooking(firstName, lastName, email);

  if (!existing) {
    return NextResponse.json({ duplicate: false });
  }

  await sendDuplicateWarningEmail({
    to: email,
    firstName,
    magicLink: magicLinkUrl(existing.magicLinkToken),
  });

  return NextResponse.json({ duplicate: true });
}
