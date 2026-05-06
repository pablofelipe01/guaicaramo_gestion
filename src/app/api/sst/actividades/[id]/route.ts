import { NextRequest, NextResponse } from 'next/server'
import { actualizarActividad } from '@/lib/sst/plan'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_ACTIVIDADES = 'sst_plan_actividades'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    
    const { id } = await params
    const body = await request.json()
    const record = await actualizarActividad(id, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error actualizando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    
    const { id } = await params
    await deleteRecord(T_ACTIVIDADES, id)
    return NextResponse.json({ message: 'Actividad eliminada' })
  } catch (error) {
    console.error('Error eliminando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
