import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/format";
import type { RosterRow } from "@/lib/roster-compare";
import { compareAgainstCurrentBookings, ROSTER_UPLOAD_ID } from "@/lib/roster-check-service";
import { buildRosterComparisonWorkbook } from "@/lib/roster-compare-workbook";

// Exports the same three tables shown on the Roster check page (haven't
// submitted / has submitted / submitted but not on roster) as one workbook,
// one sheet each - computed fresh against today's bookings, same as the page.
export async function GET() {
  const upload = await prisma.rosterUpload.findUnique({ where: { id: ROSTER_UPLOAD_ID } });
  if (!upload) {
    return NextResponse.json(
      { error: { formErrors: ["No roster on file yet - upload one first."] } },
      { status: 400 },
    );
  }

  const roster: RosterRow[] = JSON.parse(upload.rows);
  const comparison = await compareAgainstCurrentBookings(roster);

  const workbook = buildRosterComparisonWorkbook(comparison);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="roster-check-${toISODate(new Date())}.xlsx"`,
    },
  });
}
