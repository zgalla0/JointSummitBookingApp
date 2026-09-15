import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const staticContentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .regex(/^[a-z0-9-]+$/, "Key may only contain lowercase letters, numbers, and hyphens"),
  title: z.string().trim().max(200),
  body: z.string().trim().max(5000),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = staticContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { key, title, body: content } = parsed.data;

  const saved = await prisma.staticContent.upsert({
    where: { key },
    create: { key, title: title || null, body: content || null },
    update: { title: title || null, body: content || null },
  });

  return NextResponse.json({ key: saved.key });
}
