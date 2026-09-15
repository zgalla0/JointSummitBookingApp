import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  await prisma.staticContent.delete({ where: { key } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
