import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, SESSION_COOKIE_NAME } from "./lib/auth"

export function middleware(req: NextRequest) {
  // Check if the request is for an auth page
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password")

  // Get session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value

  // For debugging
  console.log("Path:", req.nextUrl.pathname)
  console.log("Cookie exists:", !!sessionCookie)

  // If accessing auth pages
  if (isAuthPage) {
    // If user has a valid session and trying to access an auth page, redirect to home
    if (sessionCookie && verifyToken(sessionCookie)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    // Allow unauthenticated users to access auth pages
    return NextResponse.next()
  }

  // For the home page, allow access even without authentication
  if (req.nextUrl.pathname === "/") {
    return NextResponse.next()
  }

  // For all other pages, require authentication
  if (!sessionCookie || !verifyToken(sessionCookie)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

