// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pages only for logged-out users (guests)
const GUEST_ONLY_ROUTES = new Set<string>(["/login", "/signup"]);

// Neutral/open routes accessible by everyone (logged in or not)
const OPEN_ROUTES = new Set<string>(["/"]);

// Optional: open prefixes like `/public/*`
const OPEN_PREFIXES = ["/public"];

function isBypassPath(pathname: string) {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/api")
  ) return true;
  return false;
}

function isGuestOnly(pathname: string) {
  return GUEST_ONLY_ROUTES.has(pathname);
}

function isOpen(pathname: string) {
  if (OPEN_ROUTES.has(pathname)) return true;
  return OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname, search } = url;

  if (isBypassPath(pathname)) return NextResponse.next();

  const isAuthed = Boolean(getSessionCookie(request));

  // 1) If logged in, block guest-only pages (e.g., /sign-in, /sign-up)
  if (isAuthed && isGuestOnly(pathname)) {
    return NextResponse.redirect(new URL("/", request.url)); // or "/dashboard"
  }

  // 2) If not logged in and the route is neither open nor guest-only => protected
  const isProtected = !isOpen(pathname) && !isGuestOnly(pathname);
  if (!isAuthed && isProtected) {
    const callbackUrl = pathname + (search || "");
    const signInUrl = new URL("/login", request.url);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  // 3) Otherwise allowed (neutral/open or properly authenticated)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};

