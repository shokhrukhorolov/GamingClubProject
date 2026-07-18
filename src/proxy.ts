import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import {
  verifyClientSessionToken,
  CLIENT_SESSION_COOKIE,
} from "@/lib/auth/client-session";

const CLIENT_GATED = ["/account"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const valid = token ? await verifySessionToken(token) : false;

    if (!valid) {
      const url = new URL("/admin/login", request.url);
      if (pathname !== "/admin") url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (CLIENT_GATED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const clientId = token ? await verifyClientSessionToken(token) : null;

    if (!clientId) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/account/:path*",
    "/account",
  ],
};
