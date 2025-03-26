import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, SESSION_COOKIE_NAME } from "./lib/auth"
import { createCsrfMiddleware } from "@edge-csrf/nextjs"

const csrfMiddleware = createCsrfMiddleware({
  cookie: {
    secure: process.env.NODE_ENV === "production",
  },
})

export async function middleware(req: NextRequest) {
  const csrfResponse = await csrfMiddleware(req)
  if (csrfResponse) return csrfResponse

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password")

  if (isAuthPage) {
    if (sessionCookie && verifyToken(sessionCookie)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  if (req.nextUrl.pathname === "/") {
    return NextResponse.next()
  }

  if (!sessionCookie || !verifyToken(sessionCookie)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
