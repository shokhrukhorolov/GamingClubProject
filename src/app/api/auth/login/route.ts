import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // compare anyway to keep timing uniform
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");

  const validUser = safeCompare(username, process.env.ADMIN_USERNAME ?? "");
  const validPass = safeCompare(password, process.env.ADMIN_PASSWORD ?? "");

  const redirectTo = String(form.get("redirect") ?? "") || "/admin/calendar";
  // only allow internal admin paths as redirect targets
  const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin/calendar";

  if (!validUser || !validPass) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    if (safeRedirect !== "/admin/calendar") url.searchParams.set("redirect", safeRedirect);
    return NextResponse.redirect(url, 303);
  }

  const token = await createSessionToken();
  const response = NextResponse.redirect(new URL(safeRedirect, request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
