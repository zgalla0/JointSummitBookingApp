import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Manual, per-row action from the Hotel Export "Review before generating"
// table: an admin confirms the hotel has actually processed a cancellation,
// so it stops appearing (red) on every future pull. Never automatic - a
// cancellation otherwise stays on the roster indefinitely until cleared.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const bookingId = typeof (body as { bookingId?: unknown })?.bookingId === "string" ? (body as { bookingId: string }).bookingId : "";
  if (!bookingId) {
    return NextResponse.json({ error: { formErrors: ["Missing bookingId."] } }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== "CANCELLED") {
    return NextResponse.json(
      { error: { formErrors: ["That booking isn't a cancelled booking on file."] } },
      { status: 400 },
    );
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { hotelExportClearedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
