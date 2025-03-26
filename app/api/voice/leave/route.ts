import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { leaveVoiceChannel } from "@/lib/server-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await leaveVoiceChannel(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving voice channel:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

