import { cookies } from "next/headers";
import { generateCsrfToken, tokens } from "@/lib/csrf-wrapper";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = tokens.secretSync();
  const csrfToken = generateCsrfToken(secret);

  (await cookies()).set("csrfSecret", secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ csrfToken });
}
