import { NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/booking-schema";
import { findBookingByEmail } from "@/lib/duplicate-check";
import { prisma } from "@/lib/prisma";
import { findBookingByIdOrNotFound } from "@/lib/require-booking";
import { cancelBooking } from "@/lib/cancel-booking";
import { bookingWriteData, guestWriteData, isValidRoomType } from "@/lib/booking-write";
import { needsRoomTypeChoice } from "@/lib/stay-tiles-client";
import { describeBookingChanges } from "@/lib/booking-edit-log";

/** Admin counterpart to PUT /api/bookings/[token] (the attendee's own
 *  magic-link edit) - same validation and write path (so data stays
 *  consistent), keyed by booking id instead of token, no lock-in check (an
 *  admin can always edit), and no attendee-facing "your booking changed"
 *  email - only the cancellation emails already wired into cancelBooking
 *  fire, when switching a booking to not-attending. Every save that
 *  actually changes something is recorded to BookingEditLog. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findBookingByIdOrNotFound(id);
  if ("notFound" in result) return result.notFound;
  const { booking } = result;

  const body = await req.json().catch(() => ({}));
  const editedBy = typeof body?.editedBy === "string" ? body.editedBy.trim() : "";
  if (!editedBy) {
    return NextResponse.json(
      { error: { formErrors: ["Please select who is making this edit."] } },
      { status: 400 },
    );
  }

  const parsed = bookingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const conflicting = await findBookingByEmail(data.cuestaEmail, booking.id);
  if (conflicting) {
    return NextResponse.json(
      { error: { formErrors: ["Another booking already exists for this email."] } },
      { status: 409 },
    );
  }

  const needsRoomType = data.isAttending
    ? needsRoomTypeChoice(data.stayStart, data.stayEnd, data.companyPaidNights)
    : false;
  if (needsRoomType && !isValidRoomType(data.extraNightsRoomType)) {
    return NextResponse.json(
      {
        error: {
          formErrors: ["Please choose a room type for the night(s) outside the standard rate."],
        },
      },
      { status: 400 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.bookingGuest.deleteMany({ where: { bookingId: booking.id } });
    const result = await tx.booking.update({
      where: { id: booking.id },
      data: {
        ...bookingWriteData(data, needsRoomType),
        guests: { create: guestWriteData(data.isAttending ? data.guests : []) },
      },
    });

    const changes = describeBookingChanges(booking, result);
    if (changes.length > 0) {
      await tx.bookingEditLog.create({
        data: { bookingId: booking.id, editedBy, changes: changes.join("\n") },
      });
    }

    return result;
  });

  if (!data.isAttending) {
    await cancelBooking(booking, { byAdmin: true });
  }

  return NextResponse.json({ id: updated.id });
}
