import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Re-serves the exact draft email generated alongside a past pull, from the
// stored snapshot.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.hotelExportLog.findUnique({ where: { id } });
  if (!entry?.draftEmail) {
    return new NextResponse("No draft email on file for this export.", { status: 404 });
  }

  return new NextResponse(entry.draftEmail, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
