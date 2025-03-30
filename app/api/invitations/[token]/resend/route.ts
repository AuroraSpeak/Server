import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateCsrfOrThrow } from "@/lib/csrf-guard"
import { randomBytes } from "crypto"

// Resend an invitation
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    validateCsrfOrThrow()

    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { token } = params

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { server: true },
    })

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 })
    }

    // Check if user has permission (is the creator or server admin)
    const isCreator = invitation.invitedById === user.id

    // Check if user is server admin
    const serverMember = await prisma.serverMember.findFirst({
      where: {
        serverId: invitation.serverId,
        userId: user.id,
        roleString: { contains: "Admin" },
      },
    })

    const isAdmin = !!serverMember

    if (!isCreator && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Generate a new token
    const newToken = randomBytes(32).toString("hex")

    // Update the invitation with a new token and expiration date
    const updatedInvitation = await prisma.invitation.update({
      where: { token },
      data: {
        token: newToken,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // TODO: Send email with new invitation link
    // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${newToken}`;
    // await sendInvitationEmail(invitation.email, inviteUrl);

    return NextResponse.json(updatedInvitation)
  } catch (error) {
    console.error("Error resending invitation:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

