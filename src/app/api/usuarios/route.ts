import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords, createRecords } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'
import type { RolFields } from '@/types/usuarios'

interface UserFields {
  Email: string
  'Password Hash': string
  'Nombre Completo'?: string
  Estado?: string | { id: string; name: string; color?: string }
  Rol?: string[] | Array<{ id: string; name?: string }>
  'Fecha Creacion'?: string
}

function getEstadoName(estado: UserFields['Estado']): string {
  if (!estado) return 'activo'
  if (typeof estado === 'object') return estado.name.toLowerCase()
  return estado.toLowerCase()
}

/** Resuelve el nombre del rol a partir del array de linked records o strings */
function getRolName(rol: UserFields['Rol'], rolesMap: Map<string, string>): string {
  if (!rol || rol.length === 0) return 'usuario'
  const first = rol[0]
  if (typeof first === 'object' && first !== null && 'id' in first) {
    return rolesMap.get(first.id) ?? first.id
  }
  // Es un string — puede ser un record ID o un nombre directo
  const byId = rolesMap.get(first as string)
  return byId ?? (first as string)
}

/** Obtiene todos los roles y construye un mapa recordId → nombre */
async function buildRolesMap(): Promise<Map<string, string>> {
  try {
    const { records } = await listRecords<RolFields>('Roles', {
      fields: ['Nombre'],
    })
    const map = new Map<string, string>()
    for (const r of records) {
      if (r.fields.Nombre) map.set(r.id, r.fields.Nombre)
    }
    return map
  } catch {
    return new Map()
  }
}

/** Busca el record ID en la tabla Roles para un nombre de rol dado */
async function getRolRecordId(rolName: string): Promise<string | null> {
  const { records } = await listRecords<RolFields>('Roles', {
    filterByFormula: `{Nombre}="${rolName}"`,
    maxRecords: 1,
  })
  return records.length > 0 ? records[0].id : null
}

function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/
const ROLES_VALIDOS = ['superadmin', 'admin', 'usuario']
const TABLE = () => process.env.AIRTABLE_TABLE_USERS ?? 'Usuarios'

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
    const [{ records }, rolesMap] = await Promise.all([
      listRecords<UserFields>(TABLE(), {
        sort: [{ field: 'Nombre Completo', direction: 'asc' }],
        fields: ['Email', 'Nombre Completo', 'Estado', 'Rol', 'Fecha Creacion'],
      }),
      buildRolesMap(),
    ])

    const users = records.map((r) => ({
      id: r.id,
      email: r.fields.Email,
      name: r.fields['Nombre Completo'] ?? '',
      estado: getEstadoName(r.fields.Estado),
      rol: getRolName(r.fields.Rol, rolesMap),
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

    const rolName = rol && ROLES_VALIDOS.includes(String(rol)) ? String(rol) : 'usuario'

    const hash = await bcrypt.hash(String(password), 10)

    // Rol es linked record → buscar el record ID
    const rolRecordId = await getRolRecordId(rolName)

    const fieldsToCreate: Record<string, unknown> = {
      Email: trimmedEmail,
      'Password Hash': hash,
      'Nombre Completo': String(name).trim(),
      Estado: 'Activo',
      'Fecha Creacion': new Date().toISOString().split('T')[0],
    }
    if (rolRecordId) {
      fieldsToCreate['Rol'] = [rolRecordId]
    }

    const [newUser] = await createRecords<UserFields>(TABLE(), [
      { fields: fieldsToCreate as Partial<UserFields> },
    ])

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.fields.Email,
          name: newUser.fields['Nombre Completo'],
          estado: 'activo',
          rol: rolName,
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

