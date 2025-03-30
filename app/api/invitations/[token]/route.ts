import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateCsrfOrThrow } from "@/lib/csrf-guard"

// Delete an invitation
export async function DELETE(req: Request, { params }: { params: { token: string } }) {
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

    // Delete the invitation
    await prisma.invitation.delete({
      where: { token },
    })

    return new NextResponse("Invitation deleted successfully", { status: 200 })
  } catch (error) {
    console.error("Error deleting invitation:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

