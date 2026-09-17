import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/format";
import { computeFlightGroups } from "@/lib/flight-groups";
import { buildFlightExportWorkbook } from "@/lib/flight-export-workbook";

// Same grouping as the admin Flights page, exported as a workbook - one
// sheet each for arrivals and departures, already split by date and
// terminal so there's no re-sorting needed after downloading it.
export async function GET() {
  const bookings = await prisma.booking.findMany();
  const { arrivals, departures } = computeFlightGroups(bookings);

  const workbook = buildFlightExportWorkbook(arrivals, departures);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="flights-export-${toISODate(new Date())}.xlsx"`,
    },
  });
}
