import 'server-only'
import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no está configurada')
  return new TextEncoder().encode(secret)
}

const PURPOSE = 'firma_asistencia_capacitacion'

/**
 * Genera un token JWT de corta duración (72 h) para el flujo de firma pública
 * de asistencia a una capacitación. El token lleva el `registroId` y un campo
 * `purpose` para evitar que tokens de autenticación normal sean reutilizados aquí.
 */
export async function generarTokenFirmaCapacitacion(
  registroId: string,
  actividadTema?: string,
  fechaEjecucion?: string
): Promise<string> {
  return new SignJWT({ registroId, actividadTema, fechaEjecucion, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('72h')
    .sign(getSecret())
}

export interface TokenFirmaPayload {
  registroId: string
  actividadTema?: string
  fechaEjecucion?: string
}

/**
 * Verifica y decodifica un token de firma de asistencia.
 * Retorna null si el token es inválido, expirado o tiene un propósito distinto.
 */
export async function verificarTokenFirmaCapacitacion(
  token: string
): Promise<TokenFirmaPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.purpose !== PURPOSE) return null
    if (!payload.registroId || typeof payload.registroId !== 'string') return null
    return {
      registroId: payload.registroId,
      actividadTema: typeof payload.actividadTema === 'string' ? payload.actividadTema : undefined,
      fechaEjecucion: typeof payload.fechaEjecucion === 'string' ? payload.fechaEjecucion : undefined,
    }
  } catch {
    return null
  }
}
