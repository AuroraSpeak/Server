import { type NextRequest, NextResponse } from "next/server"
import { generateToken, setSessionCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get demo user from database
    const user = await prisma.user.findUnique({
      where: { email: "demo@example.com" },
    })

    if (!user) {
      return NextResponse.json({ error: "Demo user not found" }, { status: 404 })
    }

    // Update user status to online
    await prisma.profile.update({
      where: { id: user.id },
      data: { status: "online" },
    })

    // Generate JWT token
    const token = generateToken(user.id)

    // Set session cookie
    setSessionCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

