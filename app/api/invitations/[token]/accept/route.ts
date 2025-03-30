import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { token } = params;

    // Finde die Einladung
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
      return new NextResponse('Invitation has expired', { status: 400 });
    }

    // Überprüfe, ob die Einladung bereits akzeptiert wurde
    if (invitation.status === 'accepted') {
      return new NextResponse('Invitation already accepted', { status: 400 });
    }

    // Überprüfe, ob die E-Mail-Adresse übereinstimmt
    if (invitation.email !== session.user.email) {
      return new NextResponse('Email does not match invitation', { status: 400 });
    }

    // Aktualisiere den Status der Einladung
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    });

    return NextResponse.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 