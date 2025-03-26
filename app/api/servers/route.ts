import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getServers } from "@/lib/server-service"
import { prisma } from "@/lib/prisma"
import { validateCsrfOrThrow } from "@/lib/csrf-guard"


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

    validateCsrfOrThrow()

    const body = await req.json()
    const { name, icon, color } = body

    if (!name || !color) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const user = await getCurrentUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const server = await prisma.server.create({
      data: {
        name,
        icon,
        color,
        createdById: user.id,
        categories: {
          create: [
            {
              name: 'Text Channels',
              position: 0,
              channels: {
                create: [
                  { name: 'general', type: 'text', position: 0 },
                  { name: 'announcements', type: 'text', position: 1 },
                ],
              },
            },
            {
              name: 'Voice Channels',
              position: 1,
              channels: {
                create: [{ name: 'General Voice', type: 'voice', position: 0 }],
              },
            },
          ],
        },
        members: {
          create: {
            userId: user.id,
            nickname: null,
            roleString: 'owner',
            isBoosting: false,
          },
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.error('[SERVER_CREATE_ERROR]', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}