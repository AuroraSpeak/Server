import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getServers } from "@/lib/server-service"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const servers = await getServers(user.id)

    return NextResponse.json({ servers })
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

