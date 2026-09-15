import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createAdminSessionValue } from "@/lib/admin-session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!process.env.ADMIN_PASSWORD || !password || !checkAdminPassword(password)) {
    return NextResponse.json(
      { error: { formErrors: ["Incorrect password."] } },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours, mirrors the session TTL
  });
  return res;
}
