import { type NextRequest, NextResponse } from "next/server"
import { comparePasswords, generateToken, setSessionCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateCsrfOrThrow } from "@/lib/csrf-guard"

export async function POST(request: NextRequest) {
  try {
    
    validateCsrfOrThrow()

    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isPasswordValid = await comparePasswords(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    await prisma.profile.update({
      where: { id: user.id },
      data: { status: "online" },
    })

    const token = generateToken(user.id)
    await setSessionCookie(token)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    })

    response.cookies.set({
      name: "wavelength_session",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    })

    return response
  } catch (error: any) {
    console.error("Login error:", error)

    if (error.message === "Invalid CSRF token") {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
