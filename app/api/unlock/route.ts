import { NextResponse } from "next/server";
import { authCookieName, authMaxAgeSeconds, createSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = (process.env.UNLOCK_PASSWORD ?? "").trim().toLowerCase();
  if (!expected || password !== expected) {
    // pequeño delay artificial para que no sea trivial brute-forcear
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: authMaxAgeSeconds,
  });
  return res;
}
