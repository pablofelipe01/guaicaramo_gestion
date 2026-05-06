import { NextRequest, NextResponse } from 'next/server'
import { obtenerEvaluacion, cerrarEvaluacion } from '@/lib/sst/eval'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

const T_EVALUACIONES = 'sst_eval_evaluaciones'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await params
  const record = await obtenerEvaluacion(id)
  return NextResponse.json({ record })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await request.json()
  if (body.accion === 'cerrar') {
    const record = await cerrarEvaluacion(id)
    return NextResponse.json({ record })
  }
  return NextResponse.json({ message: 'Acción no reconocida' }, { status: 400 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await params
  try {
    await deleteRecord(T_EVALUACIONES, id)
    return NextResponse.json({ message: 'Evaluación eliminada' })
  } catch (error) {
    console.error('Error eliminando evaluación:', error)
    return NextResponse.json({ message: 'Error al eliminar evaluación' }, { status: 500 })
  }
}
