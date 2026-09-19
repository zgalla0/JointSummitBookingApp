import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Re-serves the exact .xlsx generated for a past pull, from the stored
// snapshot - not a recomputed diff, since the underlying booking data may
// have changed since then.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.hotelExportLog.findUnique({ where: { id } });
  if (!entry?.fileData) {
    return NextResponse.json({ error: { formErrors: ["No file on file for this export."] } }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(entry.fileData), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${entry.filename ?? "hotel-export.xlsx"}"`,
    },
  });
}
