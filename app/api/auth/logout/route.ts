import { type NextRequest, NextResponse } from "next/server"
import { deleteSessionCookie, getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (user) {
      // Update user status to offline
      await prisma.profile.update({
        where: { id: user.id },
        data: { status: "offline" },
      })
    }

    // Delete session cookie
    deleteSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

