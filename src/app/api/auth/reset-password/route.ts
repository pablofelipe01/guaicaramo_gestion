import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { listRecords, updateRecord } from '@/lib/airtable-client'
import { isNonceConsumed, consumeNonce, checkRateLimit } from '@/lib/auth/reset-store'

interface UserFields {
  Email: string
}

function escapeAirtableString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return new TextEncoder().encode(secret)
}

// Política: 8-72 chars (máx 72 = límite de bcrypt), al menos 1 mayúscula y 1 número
const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d).{8,72}$/

/**
 * POST /api/auth/reset-password
 * Paso 3 del flujo de recuperación: establece la nueva contraseña.
 * Body: { verifiedToken: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 intentos por IP cada 15 minutos
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`reset:${ip}`, 3, 15 * 60_000)) {
      return NextResponse.json(
        { success: false, message: 'Demasiados intentos. Espera 15 minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { verifiedToken, newPassword } = body

    if (!verifiedToken || typeof verifiedToken !== 'string') {
      return NextResponse.json({ success: false, message: 'Token de verificación inválido.' }, { status: 400 })
    }
    if (!newPassword || typeof newPassword !== 'string' || !PASSWORD_POLICY.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener entre 8 y 72 caracteres, al menos una mayúscula y un número.' },
        { status: 400 }
      )
    }

    const secret = getSecret()

    let email: string
    let jti: string
    try {
      const result = await jwtVerify(verifiedToken, secret)
      const p = result.payload as { email?: string; purpose?: string; jti?: string }
      if (p.purpose !== 'reset-verified' || !p.email || !p.jti) {
        return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 400 })
      }
      email = p.email
      jti = p.jti
    } catch {
      return NextResponse.json(
        { success: false, message: 'La sesión de recuperación expiró. Inicia el proceso de nuevo.' },
        { status: 400 }
      )
    }

    // Nonce single-use: previene reutilización del verifiedToken
    if (isNonceConsumed(jti)) {
      return NextResponse.json(
        { success: false, message: 'Este enlace de recuperación ya fue utilizado.' },
        { status: 400 }
      )
    }
    consumeNonce(jti)

    const safeEmail = escapeAirtableString(email)
    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

    const { records } = await listRecords<UserFields>(table, {
      filterByFormula: `LOWER({Email})="${safeEmail}"`,
      maxRecords: 1,
      fields: ['Email'],
    })

    if (records.length === 0) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 })
    }

    // Cost factor 12 — recomendación OWASP para hardware moderno
    const hash = await bcrypt.hash(newPassword, 12)
    await updateRecord<{ 'Password Hash': string }>(table, records[0].id, { 'Password Hash': hash })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' })
  } catch (error) {
    console.error('[/api/auth/reset-password]', error)
    return NextResponse.json(
      { success: false, message: 'Error al actualizar la contraseña.' },
      { status: 500 }
    )
  }
}
