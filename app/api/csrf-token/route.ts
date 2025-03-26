// app/api/csrf/route.ts
import { NextResponse } from 'next/server';
import { createCsrfToken } from '@/lib/csrf';

export async function GET() {
  const secret = 'your-secret-value'; // Replace with an appropriate secret value
  const token = await createCsrfToken(secret);

  const res = NextResponse.json({ csrfToken: token });

  res.cookies.set('csrfSecret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
