import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { verifyAndConsumeOtp, checkRateLimit } from '@/lib/auth/reset-store'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return new TextEncoder().encode(secret)
}

/**
 * POST /api/auth/verify-reset-code
 * Paso 2 del flujo de recuperación: valida el código OTP.
 * Body: { resetToken: string, code: string }
 * Respuesta: { success: true, verifiedToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 intentos por IP cada 15 minutos
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(`verify:${ip}`, 5, 15 * 60_000)) {
      return NextResponse.json(
        { success: false, message: 'Demasiados intentos. Espera 15 minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { resetToken, code } = body

    if (!resetToken || typeof resetToken !== 'string') {
      return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 400 })
    }
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json({ success: false, message: 'Código inválido.' }, { status: 400 })
    }

    const secret = getSecret()

    let payload: { sessionId?: string; purpose?: string }
    try {
      const result = await jwtVerify(resetToken, secret)
      payload = result.payload as typeof payload
    } catch {
      return NextResponse.json(
        { success: false, message: 'El código expiró. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    if (payload.purpose !== 'reset-otp' || !payload.sessionId) {
      return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 400 })
    }

    // Verifica y consume el OTP del servidor (single-use, timing-safe)
    const email = verifyAndConsumeOtp(payload.sessionId, code.trim())
    if (!email) {
      return NextResponse.json({ success: false, message: 'Código incorrecto o expirado.' }, { status: 400 })
    }

    // JTI único para prevenir reutilización del verifiedToken
    const jti = randomUUID()
    const verifiedToken = await new SignJWT({ email, purpose: 'reset-verified' })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(jti)
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(secret)

    return NextResponse.json({ success: true, verifiedToken })
  } catch (error) {
    console.error('[/api/auth/verify-reset-code]', error)
    return NextResponse.json(
      { success: false, message: 'Error al verificar el código.' },
      { status: 500 }
    )
  }
}
