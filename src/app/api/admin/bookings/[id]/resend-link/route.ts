import { NextResponse } from "next/server";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendResendLinkEmail } from "@/lib/email";
import { findBookingByIdOrNotFound } from "@/lib/require-booking";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findBookingByIdOrNotFound(id);
  if ("notFound" in result) return result.notFound;
  const { booking } = result;

  await sendResendLinkEmail({
    to: booking.detailsEmail,
    firstName: booking.firstName,
    magicLink: magicLinkUrl(booking.magicLinkToken),
  });

  return NextResponse.json({ ok: true });
}
