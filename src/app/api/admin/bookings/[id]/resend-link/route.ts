import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { magicLinkUrl } from "@/lib/magic-link";
import { sendResendLinkEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: { formErrors: ["Booking not found."] } }, { status: 404 });
  }

  await sendResendLinkEmail({
    to: booking.detailsEmail,
    firstName: booking.firstName,
    magicLink: magicLinkUrl(booking.magicLinkToken),
  });

  return NextResponse.json({ ok: true });
}
