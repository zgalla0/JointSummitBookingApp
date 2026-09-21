import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findBookingByIdOrNotFound } from "@/lib/require-booking";

// Toggles the admin review flag off (there's no route to set it on manually;
// it's only ever set automatically at booking time for >1 additional guest).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findBookingByIdOrNotFound(id);
  if ("notFound" in result) return result.notFound;
  const { booking } = result;

  const updated = await prisma.booking.update({
    where: { id },
    data: { flaggedForReview: !booking.flaggedForReview },
  });

  return NextResponse.json({ id: updated.id, flaggedForReview: updated.flaggedForReview });
}
