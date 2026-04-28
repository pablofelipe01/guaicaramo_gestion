import { NextRequest, NextResponse } from 'next/server'
import { listRecords, updateRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'
import type { RolFields } from '@/types/usuarios'

interface UserFields {
  'Nombre Completo'?: string
  Estado?: string | { id: string; name: string; color?: string }
  Rol?: string[]
  Email?: string
}

const ROLES_VALIDOS = ['superadmin', 'admin', 'usuario']
const T_USUARIOS = () => process.env.AIRTABLE_TABLE_USERS ?? 'Usuarios'
const T_ROLES = 'Roles'

/** Busca el record ID en la tabla Roles para un nombre de rol dado */
async function getRolRecordId(rolName: string): Promise<string | null> {
  const { records } = await listRecords<RolFields>(T_ROLES, {
    filterByFormula: `{Nombre}="${rolName}"`,
    maxRecords: 1,
  })
  return records.length > 0 ? records[0].id : null
}

function normalizeEstado(estado: UserFields['Estado']): string {
  if (!estado) return 'activo'
  if (typeof estado === 'object') return estado.name.toLowerCase()
  return estado.toLowerCase()
}

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    let rolNameForResponse: string | undefined

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (name.length < 3) {
        return NextResponse.json({ success: false, message: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 })
      }
      updates['Nombre Completo'] = name
    }

    if (body.rol !== undefined) {
      const rolName = String(body.rol)
      if (!ROLES_VALIDOS.includes(rolName)) {
        return NextResponse.json({ success: false, message: 'Rol inválido' }, { status: 400 })
      }
      // Rol es un campo linked record → necesitamos el record ID, no el nombre
      const rolRecordId = await getRolRecordId(rolName)
      if (!rolRecordId) {
        return NextResponse.json(
          { success: false, message: `El rol "${rolName}" no existe en la tabla de Roles` },
          { status: 400 }
        )
      }
      updates['Rol'] = [rolRecordId]
      rolNameForResponse = rolName
    }

    if (body.estado !== undefined) {
      const estado = String(body.estado).toLowerCase()
      if (estado !== 'activo' && estado !== 'inactivo') {
        return NextResponse.json({ success: false, message: 'Estado inválido' }, { status: 400 })
      }
      // Capitalizar para coincidir con los valores del single select de Airtable
      updates['Estado'] = estado.charAt(0).toUpperCase() + estado.slice(1)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'No hay cambios para aplicar' }, { status: 400 })
    }

    const updated = await updateRecord<UserFields>(T_USUARIOS(), id, updates as Partial<UserFields>)

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.fields.Email,
        name: updated.fields['Nombre Completo'],
        estado: normalizeEstado(updated.fields.Estado),
        // Rol linked record devuelve IDs después del PATCH — usamos el nombre validado
        rol: rolNameForResponse ?? 'usuario',
      },
    })
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar usuario' }, { status: 500 })
  }
}

