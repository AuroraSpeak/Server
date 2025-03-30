import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getServers } from "@/lib/server-service"
import { prisma } from "@/lib/prisma"
import { validateCsrfOrThrow } from "@/lib/csrf-guard"
import { Prisma } from "@prisma/client"


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

export async function POST(req: Request) {
  try {
    // Validate CSRF token
    await validateCsrfOrThrow()

    // Get and validate request body
    const body = await req.json()
    const { name, icon, color } = body

    console.log('[SERVER_CREATE_REQUEST]', { name, icon, color })

    if (!name || typeof name !== 'string' || name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: "Server name must be between 3 and 50 characters" },
        { status: 400 }
      )
    }

    if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { error: "Invalid color format. Must be a valid hex color" },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('[SERVER_CREATE_USER]', { userId: user.id })

    // Check if user has reached server limit
    const userServerCount = await prisma.server.count({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (userServerCount >= 10) {
      return NextResponse.json(
        { error: "You have reached the maximum number of servers" },
        { status: 400 }
      )
    }

    // Create server with default channels
    const server = await prisma.server.create({
      data: {
        name,
        icon,
        color,
        createdById: user.id,
        categories: {
          create: [
            {
              name: "Text Channels",
              position: 0,
              channels: {
                create: [
                  {
                    name: "general",
                    type: "text",
                    position: 0,
                    serverId: undefined
                  },
                  {
                    name: "announcements",
                    type: "text",
                    position: 1
                  }
                ]
              }
            },
            {
              name: "Voice Channels",
              position: 1,
              channels: {
                create: [
                  {
                    name: "General Voice",
                    type: "voice",
                    position: 0
                  }
                ]
              }
            }
          ]
        },
        members: {
          create: {
            userId: user.id,
            nickname: null,
            roleString: "owner",
            isBoosting: false
          }
        }
      },
      include: {
        categories: {
          include: {
            channels: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    })

    console.log('[SERVER_CREATE_SUCCESS]', { serverId: server.id })
    return NextResponse.json(server)
  } catch (error) {
    console.error("[SERVER_CREATE_ERROR]", {
      error: error instanceof Error ? error.message : "Unknown error"
    })
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json("Invalid data provided", { status: 400 })
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json("Database error", { status: 500 })
    }
    
    return NextResponse.json("Internal error", { status: 500 })
  }
}