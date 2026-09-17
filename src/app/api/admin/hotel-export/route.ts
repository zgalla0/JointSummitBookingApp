import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/format";
import { LAST_HOTEL_EXPORT_PULLED_AT_KEY } from "@/lib/internal-static-content";
import { classifyForHotelExport, computeHotelExportFields, parseOverrideSince } from "@/lib/hotel-export-diff";
import { buildHotelExportRows } from "@/lib/hotel-export-rows";
import { buildHotelExportWorkbook } from "@/lib/hotel-export-workbook";
import { buildHotelExportDraftEmail } from "@/lib/hotel-export-email";

// Read-only: lets the admin page show "changes since ..." before the admin
// commits to actually generating (and thereby re-basing) an export.
export async function GET() {
  const lastExport = await prisma.staticContent.findUnique({
    where: { key: LAST_HOTEL_EXPORT_PULLED_AT_KEY },
  });
  return NextResponse.json({ lastExportAt: lastExport?.body ?? null });
}

function parseRequiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const overrideSince = parseOverrideSince((body as { since?: unknown })?.since);

  // This export leaves the building (as a draft the admin sends
  // themselves), so - unlike "View All Data" - it requires a log entry
  // before it will generate anything.
  const pulledBy = parseRequiredString((body as { pulledBy?: unknown })?.pulledBy);
  const purpose = parseRequiredString((body as { purpose?: unknown })?.purpose);
  if (!pulledBy || !purpose) {
    return NextResponse.json(
      { error: { formErrors: ["Who is pulling this and why are both required."] } },
      { status: 400 },
    );
  }

  const [bookings, lastExport, snapshotRows] = await Promise.all([
    prisma.booking.findMany({ include: { guests: true } }),
    prisma.staticContent.findUnique({ where: { key: LAST_HOTEL_EXPORT_PULLED_AT_KEY } }),
    prisma.hotelExportSnapshot.findMany(),
  ]);

  const since = overrideSince ?? (lastExport?.body ? new Date(lastExport.body) : null);
  const snapshots = new Map(snapshotRows.map((s) => [s.bookingId, s]));

  const { newRows, editedRows, unchangedRows, cancelledRows } = classifyForHotelExport(bookings, since, snapshots);
  const rows = buildHotelExportRows(newRows, editedRows, unchangedRows, cancelledRows);

  const workbook = buildHotelExportWorkbook(rows, since);
  const buffer = await workbook.xlsx.writeBuffer();

  // Every send re-bases the snapshot table against current data (so future
  // diffs stay accurate, even for bookings not included in this pull) and
  // advances the tracked "last export" timestamp - regardless of whether
  // this particular pull used a manual override for its comparison window.
  const now = new Date();
  const activeAttending = bookings.filter((b) => b.status === "ACTIVE" && b.isAttending);
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");

  await prisma.$transaction([
    prisma.hotelExportLog.create({ data: { pulledBy, purpose, createdAt: now } }),
    prisma.staticContent.upsert({
      where: { key: LAST_HOTEL_EXPORT_PULLED_AT_KEY },
      create: { key: LAST_HOTEL_EXPORT_PULLED_AT_KEY, body: now.toISOString() },
      update: { body: now.toISOString() },
    }),
    ...activeAttending.map((b) => {
      const fields = computeHotelExportFields(b);
      return prisma.hotelExportSnapshot.upsert({
        where: { bookingId: b.id },
        create: { bookingId: b.id, ...fields },
        update: { ...fields },
      });
    }),
    ...cancelled.map((b) => prisma.hotelExportSnapshot.deleteMany({ where: { bookingId: b.id } })),
  ]);

  const counts = { newCount: newRows.length, editedCount: editedRows.length, cancelledCount: cancelledRows.length };

  return NextResponse.json({
    since: since ? since.toISOString() : null,
    generatedAt: now.toISOString(),
    counts,
    draftEmail: buildHotelExportDraftEmail(counts),
    filename: `hotel-export-${toISODate(now)}.xlsx`,
    fileBase64: Buffer.from(buffer).toString("base64"),
  });
}
