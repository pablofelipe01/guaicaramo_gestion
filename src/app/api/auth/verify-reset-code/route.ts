import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

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
    const body = await request.json()
    const { resetToken, code } = body

    if (!resetToken || typeof resetToken !== 'string') {
      return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 400 })
    }
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json({ success: false, message: 'Código inválido.' }, { status: 400 })
    }

    const secret = getSecret()

    let payload: { email?: string; code?: string; purpose?: string }
    try {
      const result = await jwtVerify(resetToken, secret)
      payload = result.payload as typeof payload
    } catch {
      return NextResponse.json(
        { success: false, message: 'El código expiró. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    if (payload.purpose !== 'reset-otp' || !payload.email || !payload.code) {
      return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 400 })
    }

    if (payload.code !== code.trim()) {
      return NextResponse.json({ success: false, message: 'Código incorrecto.' }, { status: 400 })
    }

    const verifiedToken = await new SignJWT({ email: payload.email, purpose: 'reset-verified' })
      .setProtectedHeader({ alg: 'HS256' })
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
