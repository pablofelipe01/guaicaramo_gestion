import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { listRecords, updateRecord } from '@/lib/airtable-client'

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

/**
 * POST /api/auth/reset-password
 * Paso 3 del flujo de recuperación: establece la nueva contraseña.
 * Requiere el verifiedToken emitido por /api/auth/verify-reset-code.
 * Body: { verifiedToken: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { verifiedToken, newPassword } = body

    if (!verifiedToken || typeof verifiedToken !== 'string') {
      return NextResponse.json({ success: false, message: 'Token de verificación inválido.' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      )
    }

    const secret = getSecret()

    let payload: { email?: string; purpose?: string }
    try {
      const result = await jwtVerify(verifiedToken, secret)
      payload = result.payload as typeof payload
    } catch {
      return NextResponse.json(
        { success: false, message: 'La sesión de recuperación expiró. Inicia el proceso de nuevo.' },
        { status: 400 }
      )
    }

    if (payload.purpose !== 'reset-verified' || !payload.email) {
      return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 400 })
    }

    const safeEmail = escapeAirtableString(payload.email)
    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

    const { records } = await listRecords<UserFields>(table, {
      filterByFormula: `LOWER({Email})="${safeEmail}"`,
      maxRecords: 1,
      fields: ['Email'],
    })

    if (records.length === 0) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 })
    }

    const hash = await bcrypt.hash(newPassword, 10)
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
