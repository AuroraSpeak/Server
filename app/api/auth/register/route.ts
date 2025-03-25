import { type NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrfOrThrow } from "@/lib/csrf-guard";

export async function POST(request: NextRequest) {
  try {
    validateCsrfOrThrow();
    const { email, password, fullName } = await request.json();

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName
        )}&background=0D9488&color=fff`,
        profile: {
          create: {
            fullName,
            email,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              fullName
            )}&background=0D9488&color=fff`,
            status: "online",
          },
        },
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Set session cookie
    setSessionCookie(token);

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    if (error.message === "Invalid CSRF token") {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
