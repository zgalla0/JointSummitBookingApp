import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/format";
import { buildExportWorkbook } from "@/lib/export-workbook";

// "View All Data" - the full, unfiltered dataset for internal reference.
// No log, no diffing against a prior pull; anyone with admin access can
// use this freely. The diff-aware, logged export for the hotel lives at
// /api/admin/hotel-export instead.
export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { guests: true },
    orderBy: { createdAt: "asc" },
  });

  const workbook = buildExportWorkbook(bookings);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="all-data-export-${toISODate(new Date())}.xlsx"`,
    },
  });
}
