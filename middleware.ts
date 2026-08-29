import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// /register is intentionally excluded: step 1 of the wizard runs before the
// visitor has an account/session at all. Later steps check auth themselves
// via their API routes and bounce the client back to step 1 if unauthenticated.
const PROTECTED_PREFIXES = ["/dashboard", "/friends", "/chat", "/match", "/profile", "/admin"];
const AUTH_ONLY_PREFIXES = ["/login"]; // redirect away if already logged in

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/friends/:path*", "/chat/:path*", "/match/:path*", "/profile/:path*", "/admin/:path*", "/login"],
};
