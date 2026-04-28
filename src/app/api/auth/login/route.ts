import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords } from '@/lib/airtable-client'
import { signToken } from '@/lib/auth'
import type { RolFields } from '@/types/usuarios'

interface AirtableSelect { id: string; name: string; color?: string }

interface UserFields {
  Email: string
  'Password Hash': string
  'Nombre Completo'?: string
  Estado?: AirtableSelect | string
  Rol?: Array<{ id: string; name?: string }> | string[]
}

async function resolveRoleName(rolRaw: UserFields['Rol']): Promise<string> {
  if (!Array.isArray(rolRaw) || rolRaw.length === 0) return 'usuario'
  const first = rolRaw[0]
  // Si Airtable devuelve el objeto expandido con name
  if (typeof first === 'object' && first !== null && 'name' in first && first.name) {
    return first.name
  }
  // Es un string: puede ser record ID (recXXXXX) o nombre directo
  const rawStr = typeof first === 'string' ? first : first.id
  if (!rawStr.startsWith('rec')) return rawStr  // ya es nombre
  // Resolver record ID → nombre en tabla Roles
  try {
    const { records } = await listRecords<RolFields>('Roles', {
      filterByFormula: `RECORD_ID()="${rawStr}"`,
      maxRecords: 1,
      fields: ['Nombre'],
    })
    return records[0]?.fields.Nombre ?? 'usuario'
  } catch {
    return 'usuario'
  }
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/

/**
 * Escapa comillas dobles y barras para prevenir Airtable Formula Injection.
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

    // Validación de tipos y longitud — Fix #2
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos' },
        { status: 400 },
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
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

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

    // Escapar el email para prevenir Formula Injection — Fix #1
    const safeEmail = escapeAirtableString(trimmedEmail)
    const { records } = await listRecords<UserFields>(table, {
      filterByFormula: `{Email}="${safeEmail}"`,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 }
      )
    }

    const user = records[0]
    const storedHash = user.fields['Password Hash']

    if (!storedHash) {
      return NextResponse.json(
        { success: false, message: 'Configuración de cuenta inválida' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, storedHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 }
      )
    }

    const estadoName = typeof user.fields.Estado === 'object' && user.fields.Estado !== null
      ? user.fields.Estado.name
      : user.fields.Estado

    if (estadoName?.toLowerCase() === 'inactivo') {
      return NextResponse.json(
        { success: false, message: 'La cuenta está desactivada' },
        { status: 403 }
      )
    }

    const nombre = user.fields['Nombre Completo'] ?? 'Usuario'

    const roleName = await resolveRoleName(user.fields.Rol)

    const token = await signToken({
      id: user.id,
      email: user.fields.Email,
      name: nombre,
      role: roleName,
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
      { status: 500 }
    )
  }
}
