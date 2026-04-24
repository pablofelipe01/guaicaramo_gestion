import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords } from '@/lib/airtable-client'
import { signToken } from '@/lib/auth'

interface AirtableSelect { id: string; name: string; color?: string }

interface UserFields {
  Email: string
  'Password Hash': string
  'Nombre Completo'?: string
  Estado?: AirtableSelect | string
  Rol?: Array<{ id: string; name: string }> | string[]
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/

/**
 * Escapa comillas dobles en valores usados dentro de fórmulas de Airtable
 * para prevenir inyección de fórmulas (Airtable Formula Injection).
 */
function escapeAirtableString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export async function POST(request: NextRequest) {
  try {
    // Verificar Content-Type
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Tipo de contenido no válido' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const email: unknown = body?.email
    const password: unknown = body?.password

    // Validaciones de tipo y longitud
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos' },
        { status: 400 },
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || trimmedEmail.length > 254) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 },
      )
    }

    if (!password || password.length > 128) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 },
      )
    }

    // Validar formato de email antes de consultar Airtable
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 },
      )
    }

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

    // Escapar el email para prevenir Airtable Formula Injection
    const safeEmail = escapeAirtableString(trimmedEmail)

    const { records } = await listRecords<UserFields>(table, {
      filterByFormula: `{Email}="${safeEmail}"`,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 },
      )
    }

    const user = records[0]
    const storedHash = user.fields['Password Hash']

    if (!storedHash) {
      return NextResponse.json(
        { success: false, message: 'Configuración de cuenta inválida' },
        { status: 401 },
      )
    }

    const passwordMatch = await bcrypt.compare(password, storedHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 },
      )
    }

    const estadoName =
      typeof user.fields.Estado === 'object' && user.fields.Estado !== null
        ? user.fields.Estado.name
        : user.fields.Estado

    if (estadoName?.toLowerCase() === 'inactivo') {
      return NextResponse.json(
        { success: false, message: 'La cuenta está desactivada' },
        { status: 403 },
      )
    }

    const nombre = user.fields['Nombre Completo'] ?? 'Usuario'

    const token = await signToken({
      id: user.id,
      email: user.fields.Email,
      name: nombre,
      role: 'coordinador_sst',
    })

    return NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      token,
      user: { id: user.id, email: user.fields.Email, name: nombre },
    })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 },
    )
  }
}

