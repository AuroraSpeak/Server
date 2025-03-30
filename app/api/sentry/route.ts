import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sentryUrl = process.env.NEXT_PUBLIC_SENTRY_DSN || "http://75499a7326cc4ae3bdfefd7f7185d16d@localhost:8000/1";
    
    const response = await fetch(`${sentryUrl}/api/1/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body,
    });

    return new NextResponse(null, { status: response.status });
  } catch (error) {
    console.error('Sentry proxy error:', error);
    return new NextResponse(null, { status: 500 });
  }
} 