import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const formSuggestionSchema = z.object({
  message: z.string().trim().min(1, "Enter a suggestion first").max(2000, "Keep it under 2000 characters"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = formSuggestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.formSuggestion.create({ data: { message: parsed.data.message } });

  return NextResponse.json({ ok: true });
}
