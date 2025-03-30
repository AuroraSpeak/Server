import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from './lib/auth';

const PUBLIC_AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export async function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isLoggedIn = !!sessionToken && await verifyToken(sessionToken);
  const { pathname } = req.nextUrl;

  // Erlaube Zugriff auf öffentliche Routen
  if (PUBLIC_AUTH_ROUTES.some((path) => pathname.startsWith(path))) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  // Erlaube Zugriff auf die Startseite
  if (pathname === '/') return NextResponse.next();

  // Überprüfe Authentifizierung für geschützte Routen
  if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
