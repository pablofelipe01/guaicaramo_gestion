/**
 * Server-side in-memory store for password reset flows.
 * - OTP sessions: el código nunca sale del servidor.
 * - Consumed nonces: previene reutilización del verifiedToken.
 * - Rate limiting por IP: evita fuerza bruta y email bombing.
 *
 * Para deployments multi-instancia, reemplazar con Redis/Upstash.
 */

interface OtpEntry {
  code: string
  email: string
  expiresAt: number // epoch ms
}

interface RateLimitEntry {
  count: number
  resetAt: number // epoch ms
}

const _otpSessions = new Map<string, OtpEntry>()
const _consumedNonces = new Map<string, number>() // jti → expiresAt para limpieza
const _rateLimits = new Map<string, RateLimitEntry>()

function _cleanup() {
  const now = Date.now()
  for (const [k, v] of _otpSessions) if (v.expiresAt < now) _otpSessions.delete(k)
  for (const [k, v] of _consumedNonces) if (v < now) _consumedNonces.delete(k)
  for (const [k, v] of _rateLimits) if (v.resetAt < now) _rateLimits.delete(k)
}

// Limpieza periódica de entradas expiradas
setInterval(_cleanup, 60_000)

// ── OTP Sessions ──────────────────────────────────────────────────────────────

/** Almacena un código OTP en el servidor. El cliente nunca recibe el código. */
export function storeOtpSession(sessionId: string, code: string, email: string): void {
  _otpSessions.set(sessionId, { code, email, expiresAt: Date.now() + 10 * 60_000 })
}

/**
 * Verifica el código y consume la sesión atómicamente (single-use).
 * Devuelve el email asociado si es válido, null si no.
 */
export function verifyAndConsumeOtp(sessionId: string, code: string): string | null {
  const entry = _otpSessions.get(sessionId)
  if (!entry || entry.expiresAt < Date.now()) {
    _otpSessions.delete(sessionId)
    return null
  }
  if (entry.code !== code) return null
  _otpSessions.delete(sessionId) // single-use
  return entry.email
}

// ── Nonces (verifiedToken single-use) ─────────────────────────────────────────

/** Verifica si un JTI ya fue consumido. */
export function isNonceConsumed(jti: string): boolean {
  return _consumedNonces.has(jti)
}

/** Marca un JTI como consumido. TTL > al de verifiedToken (5 min) para cubrir toda la ventana. */
export function consumeNonce(jti: string): void {
  _consumedNonces.set(jti, Date.now() + 10 * 60_000)
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────

/**
 * Devuelve true si la solicitud está permitida, false si está bloqueada.
 * @param key      Clave única (ej. `forgot:192.168.1.1`)
 * @param max      Máximo de solicitudes en la ventana
 * @param windowMs Tamaño de la ventana en ms
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = _rateLimits.get(key)
  if (!entry || entry.resetAt < now) {
    _rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}
