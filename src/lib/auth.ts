import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import type { TokenPayload } from '@/lib/token'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no está configurada')
  return new TextEncoder().encode(secret)
}

export async function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}
