// JWT secret key - in production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = "7d"

// Base64 URL encode
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Base64 URL decode
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64').toString()
}

// Generate JWT token
export function generateToken(userId: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  const signature = base64UrlEncode(
    Buffer.from(
      require('crypto')
        .createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest()
    ).toString()
  )

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

// Verify JWT token
export function verifyToken(token: string): { sub: string } | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const payload = JSON.parse(base64UrlDecode(payloadB64))
    if (!payload.sub || !payload.exp) return null

    // Überprüfe das Ablaufdatum
    if (payload.exp * 1000 < Date.now()) return null

    // Überprüfe die Signatur
    const expectedSignature = base64UrlEncode(
      Buffer.from(
        require('crypto')
          .createHmac('sha256', JWT_SECRET)
          .update(`${headerB64}.${payloadB64}`)
          .digest()
      ).toString()
    )

    if (signatureB64 !== expectedSignature) return null

    return { sub: payload.sub }
  } catch (error) {
    return null
  }
} 