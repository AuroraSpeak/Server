import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateCsrfOrThrow } from "@/lib/csrf-guard"

export async function POST(req: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    validateCsrfOrThrow()

    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, type, userLimit } = body

    if (!name || !type) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const server = await prisma.server.findUnique({
      where: { id: params.serverId },
      include: { members: true },
    })

    if (!server) {
      return new NextResponse("Server not found", { status: 404 })
    }

    // Optional: check if user is member of the server
    const isMember = server.members.some((m) => m.userId === user.id)
    if (!isMember) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const lastCategory = await prisma.category.findFirst({
      where: { serverId: params.serverId },
      orderBy: { position: "asc" },
    })

    let categoryId = lastCategory?.id

    if (!categoryId) {
      const defaultCategory = await prisma.category.create({
        data: {
          name: "Allgemein",
          position: 0,
          serverId: params.serverId,
        },
      })
      categoryId = defaultCategory.id
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        userLimit,
        position: 0,
        serverId: params.serverId,
        categoryId,
      },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (err) {
    console.error("[CHANNEL_CREATE_ERROR]", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // TODO: Implementiere die Logik zum Abrufen der Server-Kanäle
  const channels = [
    {
      id: "general",
      name: "Allgemein",
      type: "text" as const,
      serverId: params.serverId
    }
  ]

  return NextResponse.json({ channels })
}
