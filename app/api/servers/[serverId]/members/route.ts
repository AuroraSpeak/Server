import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // TODO: Implementiere die Logik zum Abrufen der Server-Mitglieder
  const members = [
    {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      status: "online" as const,
      avatarUrl: user.avatarUrl
    }
  ]

  return NextResponse.json({ members })
} 