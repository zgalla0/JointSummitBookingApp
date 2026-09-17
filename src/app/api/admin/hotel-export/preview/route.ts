import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { LAST_HOTEL_EXPORT_PULLED_AT_KEY } from "@/lib/internal-static-content";
import { classifyForHotelExport, parseOverrideSince } from "@/lib/hotel-export-diff";
import { buildHotelExportRows } from "@/lib/hotel-export-rows";

// The "Pull" step: read-only preview of exactly what a "Send to Hotel"
// would include right now, with no side effects at all - no snapshot
// updates, no timestamp advance, no log entry. Lets the admin see what
// changed before committing to anything.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const overrideSince = parseOverrideSince((body as { since?: unknown })?.since);

  const [bookings, lastExport, snapshotRows] = await Promise.all([
    prisma.booking.findMany({ include: { guests: true } }),
    prisma.staticContent.findUnique({ where: { key: LAST_HOTEL_EXPORT_PULLED_AT_KEY } }),
    prisma.hotelExportSnapshot.findMany(),
  ]);

  const since = overrideSince ?? (lastExport?.body ? new Date(lastExport.body) : null);
  const snapshots = new Map(snapshotRows.map((s) => [s.bookingId, s]));

  const { newRows, editedRows, unchangedRows, cancelledRows } = classifyForHotelExport(bookings, since, snapshots);
  const rows = buildHotelExportRows(newRows, editedRows, unchangedRows, cancelledRows);

  return NextResponse.json({
    since: since ? since.toISOString() : null,
    counts: { newCount: newRows.length, editedCount: editedRows.length, cancelledCount: cancelledRows.length },
    rows,
  });
}
