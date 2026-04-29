import { NextRequest, NextResponse } from 'next/server'
import { updateRecord, deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

interface UserFields {
  'Nombre Completo'?: string
  Estado?: string | { id: string; name: string; color?: string }
  Rol?: string[]
  Email?: string
}

const T_USUARIOS = () => process.env.AIRTABLE_TABLE_USERS ?? 'Usuarios'

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
    let rolIdForResponse: string | undefined

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (name.length < 3) {
        return NextResponse.json({ success: false, message: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 })
      }
      updates['Nombre Completo'] = name
    }

    if (body.rolId !== undefined) {
      const rolId = String(body.rolId)
      if (rolId.startsWith('rec')) {
        updates['Rol'] = [rolId]
        rolIdForResponse = rolId
      }
    }

    if (body.estado !== undefined) {
      const estado = String(body.estado).toLowerCase()
      if (estado !== 'activo' && estado !== 'inactivo') {
        return NextResponse.json({ success: false, message: 'Estado inválido' }, { status: 400 })
      }
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
        rolId: rolIdForResponse,
      },
    })
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 })
  }

  // Solo superadmin puede eliminar usuarios
  if (payload.role !== 'superadmin') {
    return NextResponse.json({ success: false, message: 'Solo el superadmin puede eliminar usuarios' }, { status: 403 })
  }

  try {
    const { id } = await params
    await deleteRecord(T_USUARIOS(), id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ success: false, message: 'Error al eliminar usuario' }, { status: 500 })
  }
}
