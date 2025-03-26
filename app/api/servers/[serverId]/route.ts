import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getServer } from "@/lib/server-service"

export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const server = await getServer(params.serverId)

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    return NextResponse.json({ server })
  } catch (error) {
    console.error("Error fetching server:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

