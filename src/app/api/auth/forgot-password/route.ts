import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { listRecords } from '@/lib/airtable-client'
import { sendResetCodeEmail } from '@/lib/email'

interface UserFields {
  Email: string
  Estado?: { id: string; name: string; color?: string } | string
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/

function escapeAirtableString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return new TextEncoder().encode(secret)
}

const GENERIC_OK = {
  success: true,
  message: 'Si el email está registrado recibirás un código en los próximos minutos.',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ success: false, message: 'Email inválido.' }, { status: 400 })
    }

    const safeEmail = escapeAirtableString(email.trim().toLowerCase())
    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

    const { records } = await listRecords<UserFields>(table, {
      filterByFormula: `LOWER({Email})="${safeEmail}"`,
      maxRecords: 1,
      fields: ['Email', 'Estado'],
    })

    if (records.length === 0) {
      return NextResponse.json(GENERIC_OK)
    }

    const user = records[0]
    const estado = typeof user.fields.Estado === 'object'
      ? user.fields.Estado?.name
      : user.fields.Estado

    if (estado && estado.toLowerCase() !== 'activo') {
      return NextResponse.json(GENERIC_OK)
    }

    const code = generateCode()
    const normalizedEmail = email.trim().toLowerCase()

    const resetToken = await new SignJWT({ email: normalizedEmail, code, purpose: 'reset-otp' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .setIssuedAt()
      .sign(getSecret())

    await sendResetCodeEmail(normalizedEmail, code)

    return NextResponse.json({ success: true, resetToken, message: GENERIC_OK.message })
  } catch (error) {
    console.error('[/api/auth/forgot-password]', error)
    return NextResponse.json(
      { success: false, message: 'Error al procesar la solicitud. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
