// lib/validateCsrfOrThrow.ts
import { cookies, headers } from 'next/headers';
import { verifyCsrfToken } from './csrf';

export async function validateCsrfOrThrow() {
  const cookieStore = cookies();
  const headerStore = headers();

  const secret = (await cookieStore).get('csrfSecret')?.value;
  const token = (await headerStore).get('x-csrf-token');

  if (!secret || !token) {
    throw new Error('Missing CSRF token or secret');
  }

  const valid = verifyCsrfToken(secret, token);

  if (!valid) {
    throw new Error('Invalid CSRF token');
  }
}