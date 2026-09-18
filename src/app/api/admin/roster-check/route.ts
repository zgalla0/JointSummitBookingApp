import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseRosterFile, compareRosterToBookings, type RosterRow } from "@/lib/roster-compare";

// Single row, replaced wholesale on every upload - see RosterUpload in
// schema.prisma for why there's no history of past uploads.
const ROSTER_UPLOAD_ID = "current";

async function compareAgainstCurrentBookings(roster: RosterRow[]) {
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

// Whatever roster is currently on file (if any), compared fresh against
// today's bookings - so any admin can load this page and see up-to-date
// results without having to re-upload the same file.
export async function GET() {
  const upload = await prisma.rosterUpload.findUnique({ where: { id: ROSTER_UPLOAD_ID } });
  if (!upload) {
    return NextResponse.json({ roster: null });
  }

  const roster: RosterRow[] = JSON.parse(upload.rows);
  const comparison = await compareAgainstCurrentBookings(roster);

  return NextResponse.json({
    roster: { fileName: upload.fileName, uploadedAt: upload.uploadedAt.toISOString() },
    ...comparison,
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: { formErrors: ["No file uploaded."] } }, { status: 400 });
  }

  let roster: RosterRow[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    roster = await parseRosterFile(file.name, buffer);
  } catch {
    return NextResponse.json(
      { error: { formErrors: ["Couldn't read that file. Upload the roster as .xlsx, .csv, or .tsv."] } },
      { status: 400 },
    );
  }

  if (roster.length === 0) {
    return NextResponse.json(
      {
        error: {
          formErrors: [
            "No rows found - check the file has a header row and a column with \"email\" in its name.",
          ],
        },
      },
      { status: 400 },
    );
  }

  const upload = await prisma.rosterUpload.upsert({
    where: { id: ROSTER_UPLOAD_ID },
    create: { id: ROSTER_UPLOAD_ID, fileName: file.name, rows: JSON.stringify(roster) },
    update: { fileName: file.name, rows: JSON.stringify(roster), uploadedAt: new Date() },
  });

  const comparison = await compareAgainstCurrentBookings(roster);

  return NextResponse.json({
    roster: { fileName: upload.fileName, uploadedAt: upload.uploadedAt.toISOString() },
    ...comparison,
  });
}
