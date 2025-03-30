import { type NextRequest, NextResponse } from "next/server";
import { deleteSessionCookie, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrfOrThrow } from "@/lib/csrf-guard";
import logger from "@/lib/logging";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    logger.info('Logout attempt started', { ip });
    
    validateCsrfOrThrow();
    
    // Get current user
    const user = await getCurrentUser();

    if (user) {
      logger.info('User found for logout', { userId: user.id, email: user.email });
      
      // Update user status to offline
      await prisma.profile.update({
        where: { id: user.id },
        data: { status: "offline" },
      });
      
      logger.info('User status updated to offline', { userId: user.id });
    } else {
      logger.warn('Logout attempted without valid user session', { ip });
    }

    // Delete session cookie
    deleteSessionCookie();

    logger.info('Logout successful', { userId: user?.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    logger.error('Logout error occurred', { 
      error: error.message,
      stack: error.stack,
      ip
    });

    if (error.message === "Invalid CSRF token") {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
