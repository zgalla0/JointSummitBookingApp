import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findBookingByIdOrNotFound } from "@/lib/require-booking";
import { bookingNights, parseJsonArray } from "@/lib/admin-stats";

/** Admin-only overrides that sit outside the normal booking-form rules -
 *  e.g. an extra night Cuesta agreed to cover that isn't one of the two
 *  configured optional nights, or a free-text note for the hotel (early
 *  check-in, a reservation issue, etc.). Deliberately separate from the
 *  attendee-facing PUT on /api/bookings/[token]: that route re-validates
 *  the whole form against bookingFormSchema, which would reject exactly
 *  the kind of out-of-policy override this route exists to allow. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findBookingByIdOrNotFound(id);
  if ("notFound" in result) return result.notFound;
  const { booking } = result;

  const body = await req.json().catch(() => ({}));
  const data: { companyPaidNights?: string; hotelNote?: string | null } = {};

  if (Array.isArray(body?.companyPaidNights)) {
    // Only nights actually part of this booking's stay are ever valid here -
    // this overrides which of *those* nights Cuesta covers, not the stay
    // itself (use the booking form / admin cancel+resubmit to change dates).
    const validNights = new Set(bookingNights(booking));
    const next = body.companyPaidNights.filter(
      (d: unknown): d is string => typeof d === "string" && validNights.has(d),
    );
    data.companyPaidNights = JSON.stringify(next);
  }

  if (typeof body?.hotelNote === "string") {
    data.hotelNote = body.hotelNote.trim() || null;
  }

  const updated = await prisma.booking.update({ where: { id }, data });

  return NextResponse.json({
    id: updated.id,
    companyPaidNights: parseJsonArray(updated.companyPaidNights),
    hotelNote: updated.hotelNote,
  });
}
