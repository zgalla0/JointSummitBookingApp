import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseRosterFile, compareRosterToBookings } from "@/lib/roster-compare";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: { formErrors: ["No file uploaded."] } }, { status: 400 });
  }

  let roster;
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

  const bookings = await prisma.booking.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, cuestaEmail: true, firstName: true, lastName: true, isAttending: true },
  });

  const comparison = compareRosterToBookings(
    roster,
    bookings.map((b) => ({
      bookingId: b.id,
      name: `${b.firstName} ${b.lastName}${b.isAttending ? "" : " (not attending)"}`,
      cuestaEmail: b.cuestaEmail,
    })),
  );

  return NextResponse.json(comparison);
}
