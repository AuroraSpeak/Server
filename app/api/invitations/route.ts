import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { email, serverId } = await req.json()

    if (!email || !serverId) {
      return new NextResponse("Email and serverId are required", { status: 400 })
    }

    // Check if the user has access to the server
    const serverMember = await prisma.serverMember.findFirst({
      where: {
        serverId,
        userId: session.user.id,
      },
    })

    if (!serverMember) {
      return new NextResponse("No access to this server", { status: 403 })
    }

    // Generate a unique token
    const token = randomBytes(32).toString("hex")

    // Create the invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        invitedById: session.user.id,
        serverId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // TODO: Send email with invitation link
    // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    // await sendInvitationEmail(email, inviteUrl);

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Error creating invitation:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const serverId = searchParams.get("serverId")

    if (!serverId) {
      return new NextResponse("Server ID is required", { status: 400 })
    }

    // Check if the user has access to the server
    const serverMember = await prisma.serverMember.findFirst({
      where: {
        serverId,
        userId: session.user.id,
      },
    })

    if (!serverMember) {
      return new NextResponse("No access to this server", { status: 403 })
    }

    // Get all invitations for this server
    const invitations = await prisma.invitation.findMany({
      where: {
        serverId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

