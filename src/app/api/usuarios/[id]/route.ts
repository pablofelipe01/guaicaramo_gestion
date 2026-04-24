import { NextRequest, NextResponse } from 'next/server'
import { updateRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

interface UserFields {
  'Nombre Completo'?: string
  Estado?: string
  Rol?: string[]
}

const ROLES_VALIDOS = [
  'coordinador_sst',
  'jefe_area',
  'trabajador',
  'gerencia',
  'auditor',
  'contratista',
  'medico_ocupacional',
]

function getEstadoName(estado: string | { id: string; name: string } | undefined): string {
  if (!estado) return 'activo'
  if (typeof estado === 'object') return estado.name
  return estado
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
    const updates: Partial<UserFields> = {}

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (name.length < 3) {
        return NextResponse.json({ success: false, message: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 })
      }
      updates['Nombre Completo'] = name
    }

    if (body.rol !== undefined) {
      if (!ROLES_VALIDOS.includes(String(body.rol))) {
        return NextResponse.json({ success: false, message: 'Rol inválido' }, { status: 400 })
      }
      updates['Rol'] = [String(body.rol)]
    }

    if (body.estado !== undefined) {
      const estado = String(body.estado).toLowerCase()
      if (estado !== 'activo' && estado !== 'inactivo') {
        return NextResponse.json({ success: false, message: 'Estado inválido' }, { status: 400 })
      }
      updates['Estado'] = estado
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'No hay cambios para aplicar' }, { status: 400 })
    }

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'
    const updated = await updateRecord<UserFields & { Email: string; 'Fecha Creacion'?: string }>(table, id, updates)

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.fields.Email,
        name: updated.fields['Nombre Completo'],
        estado: getEstadoName(updated.fields.Estado as string | undefined),
        rol: updated.fields.Rol?.[0] ?? 'coordinador_sst',
      },
    })
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar usuario' }, { status: 500 })
  }
}
