import { NextResponse, type NextRequest } from "next/server";
import { authCookieName, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/unlock", "/api/unlock"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(authCookieName)?.value;
  const ok = await verifySessionToken(token);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|opengraph-image|icon.svg).*)"],
};
