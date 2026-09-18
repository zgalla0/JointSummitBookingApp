import { prisma } from "./prisma";
import { compareRosterToBookings, type RosterComparison, type RosterRow } from "./roster-compare";

// Single row, replaced wholesale on every upload - see RosterUpload in
// schema.prisma for why there's no history of past uploads.
export const ROSTER_UPLOAD_ID = "current";

/** Compares a roster against every currently-active booking's Cuesta
 *  email. Shared by the roster-check GET/POST routes and the export route
 *  so all three build the exact same three-way split. Server-only (touches
 *  prisma directly) - never import this from a client component. */
export async function compareAgainstCurrentBookings(roster: RosterRow[]): Promise<RosterComparison> {
  const bookings = await prisma.booking.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, cuestaEmail: true, firstName: true, lastName: true, isAttending: true },
  });

  return compareRosterToBookings(
    roster,
    bookings.map((b) => ({
      bookingId: b.id,
      name: `${b.firstName} ${b.lastName}${b.isAttending ? "" : " (not attending)"}`,
      cuestaEmail: b.cuestaEmail,
    })),
  );
}
