import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { invitedBy: true },
    });

    if (!invitation) {
      return new NextResponse('Invitation not found', { status: 404 });
    }

    // Überprüfe, ob die Einladung abgelaufen ist
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      return NextResponse.json({
        status: 'expired',
        message: 'Invitation has expired',
      });
    }

    return NextResponse.json({
      status: invitation.status,
      email: invitation.email,
      invitedBy: invitation.invitedBy.name,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Error checking invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 