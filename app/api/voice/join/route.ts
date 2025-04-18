import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { joinVoiceChannel } from "@/lib/server-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    await joinVoiceChannel(user.id, channelId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error joining voice channel:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

