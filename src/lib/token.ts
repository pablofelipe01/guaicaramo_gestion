export interface TokenPayload {
  id: string
  email: string
  name: string
  role?: string
  iat: number
  exp: number
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded)) as TokenPayload
  } catch {
    return null
  }
}

export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload) return false
  return payload.exp > Math.floor(Date.now() / 1000)
}
