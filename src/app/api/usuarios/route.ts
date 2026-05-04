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
  if (!rol || rol.length === 0) return 'Sin rol'
  const first = rol[0]
  if (typeof first === 'object' && first !== null && 'id' in first) {
    // Airtable a veces expande el objeto con 'name'
    const obj = first as { id: string; name?: string }
    return rolesMap.get(obj.id) ?? obj.name ?? 'Sin rol'
  }
  // Es un string
  const rawStr = first as string
  const byId = rolesMap.get(rawStr)
  if (byId) return byId
  // Si parece un record ID de Airtable (empieza con 'rec'), no lo mostramos crudo
  if (rawStr.startsWith('rec')) return 'Sin rol'
  return rawStr
}

/** Obtiene todos los roles y construye un mapa recordId → nombre */
async function buildRolesMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const T_ROLES = process.env.AIRTABLE_TABLE_ROLES ?? 'ROLES'
  try {
    const { records } = await listRecords<RolFields>(T_ROLES, { fields: ['Nombre Rol'] })
    for (const r of records) {
      if (r.fields['Nombre Rol']) map.set(r.id, r.fields['Nombre Rol'])
    }
  } catch { /* tabla Roles inaccesible */ }
  return map
}

/** Busca el record ID en la tabla Roles para un nombre de rol dado */
async function getRolRecordId(rolName: string): Promise<string | null> {
  const T_ROLES = process.env.AIRTABLE_TABLE_ROLES ?? 'ROLES'
  const { records } = await listRecords<RolFields>(T_ROLES, {
    filterByFormula: `{Nombre Rol}="${rolName}"`,

    maxRecords: 1,
  })
  return records.length > 0 ? records[0].id : null
}

function escapeAirtable(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/
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

    const users = records.map((r) => {
      const rolRaw = r.fields.Rol
      let rolId = ''
      if (Array.isArray(rolRaw) && rolRaw.length > 0) {
        const first = rolRaw[0]
        rolId = typeof first === 'object' ? (first as { id: string }).id : String(first)
      }
      return {
        id: r.id,
        email: r.fields.Email,
        name: r.fields['Nombre Completo'] ?? '',
        estado: getEstadoName(r.fields.Estado),
        rol: getRolName(r.fields.Rol, rolesMap),
        rolId,
        fechaCreacion: r.fields['Fecha Creacion'] ?? '',
      }
    })

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
    const { email, password, name, rolId, documento, telefono } = body

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

    const fieldsToCreate: Record<string, unknown> = {
      Email: trimmedEmail,
      'Password Hash': hash,
      'Nombre Completo': String(name).trim(),
      Estado: 'Activo',
      'Fecha Creacion': new Date().toISOString().split('T')[0],
    }
    if (rolId && String(rolId).startsWith('rec')) {
      fieldsToCreate['Rol'] = [String(rolId)]
    }
    if (documento && String(documento).trim()) {
      fieldsToCreate['Documento'] = String(documento).trim()
    }
    if (telefono && String(telefono).trim()) {
      fieldsToCreate['Telefono'] = String(telefono).trim()
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
          rol: '',
          rolId: rolId ?? '',
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

