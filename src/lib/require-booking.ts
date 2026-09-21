import { NextResponse } from "next/server";
import type { Booking } from "@prisma/client";
import { prisma } from "./prisma";

/** Shared "fetch a booking by id, or a 404" used by the admin id-keyed
 *  booking routes (cancel, resend-link, flag), so the lookup and not-found
 *  response can't drift between them. */
export async function findBookingByIdOrNotFound(
  id: string,
): Promise<{ booking: Booking } | { notFound: NextResponse }> {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return {
      notFound: NextResponse.json({ error: { formErrors: ["Booking not found."] } }, { status: 404 }),
    };
  }
  return { booking };
}
