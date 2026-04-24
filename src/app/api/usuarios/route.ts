import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords, createRecords } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

interface UserFields {
  Email: string
  'Password Hash': string
  'Nombre Completo'?: string
  Estado?: string | { id: string; name: string; color?: string }
  Rol?: string[]
  'Fecha Creacion'?: string
}

function getEstadoName(estado: UserFields['Estado']): string {
  if (!estado) return 'activo'
  if (typeof estado === 'object') return estado.name
  return estado
}

function getRolName(rol: UserFields['Rol']): string {
  if (!rol || rol.length === 0) return 'coordinador_sst'
  return rol[0]
}

function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/
const TABLE = () => process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  const payload = await authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 })
  }

  try {
    const { records } = await listRecords<UserFields>(TABLE(), {
      sort: [{ field: 'Nombre Completo', direction: 'asc' }],
      fields: ['Email', 'Nombre Completo', 'Estado', 'Rol', 'Fecha Creacion'],
    })

    const users = records.map((r) => ({
      id: r.id,
      email: r.fields.Email,
      name: r.fields['Nombre Completo'] ?? '',
      estado: getEstadoName(r.fields.Estado),
      rol: getRolName(r.fields.Rol),
      fechaCreacion: r.fields['Fecha Creacion'] ?? '',
    }))

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Error al listar usuarios:', error)
    return NextResponse.json({ success: false, message: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = await authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, password, name, rol } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    const trimmedEmail = String(email).trim().toLowerCase()
    if (trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ success: false, message: 'Email inválido' }, { status: 400 })
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const { records: existing } = await listRecords<UserFields>(TABLE(), {
      filterByFormula: `{Email}="${escapeAirtable(trimmedEmail)}"`,
      maxRecords: 1,
    })

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    const hash = await bcrypt.hash(String(password), 10)
    const rolValue = rol ? String(rol) : 'coordinador_sst'

    const [newUser] = await createRecords<UserFields>(TABLE(), [
      {
        fields: {
          Email: trimmedEmail,
          'Password Hash': hash,
          'Nombre Completo': String(name).trim(),
          Estado: 'activo',
          Rol: [rolValue],
          'Fecha Creacion': new Date().toISOString().split('T')[0],
        },
      },
    ])

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.fields.Email,
          name: newUser.fields['Nombre Completo'],
          estado: 'activo',
          rol: rolValue,
          fechaCreacion: newUser.fields['Fecha Creacion'],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ success: false, message: 'Error al crear usuario' }, { status: 500 })
  }
}
