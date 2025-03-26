// lib/csrf.ts (Edge-safe)

export async function createCsrfToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', hmacKey, key);
  return Buffer.from(signature).toString('hex');
}

export async function verifyCsrfToken(secret: string, token: string): Promise<boolean> {
  const expected = await createCsrfToken(secret);
  return timingSafeEqual(expected, token);
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);

  if (aBuf.length !== bBuf.length) return false;

  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}
