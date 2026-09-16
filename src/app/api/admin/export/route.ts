import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/format";
import { buildExportWorkbook } from "@/lib/export-workbook";

const LAST_EXPORT_KEY = "lastExportPulledAt";

export async function GET() {
  const [bookings, lastExport] = await Promise.all([
    prisma.booking.findMany({
      include: { guests: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staticContent.findUnique({ where: { key: LAST_EXPORT_KEY } }),
  ]);

  // Stored as the `body` text rather than relying on `updatedAt`: an update
  // with no changed fields is a no-op that Prisma skips entirely, so
  // `@updatedAt` would never advance past the very first pull.
  const since = lastExport?.body ? new Date(lastExport.body) : null;
  const workbook = buildExportWorkbook(bookings, since);

  // Recorded immediately so this pull becomes the new baseline for the next
  // one, regardless of whether the caller actually does anything with the
  // file it gets back.
  const now = new Date().toISOString();
  await prisma.staticContent.upsert({
    where: { key: LAST_EXPORT_KEY },
    create: { key: LAST_EXPORT_KEY, body: now },
    update: { body: now },
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bookings-export-${toISODate(new Date())}.xlsx"`,
    },
  });
}
