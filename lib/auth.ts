import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { SignJWT, jwtVerify } from 'jose'

// JWT secret key - in production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const JWT_EXPIRES_IN = "7d"
const secret = new TextEncoder().encode(JWT_SECRET)

// Session cookie name
export const SESSION_COOKIE_NAME = "wavelength_session"

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

// Compare password with hash
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Generate JWT token - Edge Runtime compatible
export async function generateToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  
  return token
}

// Verify JWT token - Edge Runtime compatible
export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (!payload.sub) return null
    return { sub: payload.sub as string }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Set session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "strict",
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  })
}

// Delete session cookie
export async function deleteSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Get current user from session
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    deleteSessionCookie()
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    })

    if (!user) {
      deleteSessionCookie()
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Check if user is authenticated
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export async function getSession(): Promise<Session> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return { user: null };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      await deleteSessionCookie();
      return { user: null };
    }

    // Hole den Benutzer aus der Datenbank
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      await deleteSessionCookie();
      return { user: null };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
      },
    };
  } catch (error) {
    console.error('Session error:', error);
    return { user: null };
  }
}

