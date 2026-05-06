import { NextRequest, NextResponse } from 'next/server'
import { actualizarEvaluacion } from '@/lib/sst/med'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_EVALUACIONES_MED = 'sst_med_evaluaciones'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarEvaluacion(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    const { id } = await params
    await deleteRecord(T_EVALUACIONES_MED, id)
    return NextResponse.json({ message: 'Evaluación médica eliminada' })
  } catch (error) {
    console.error('Error eliminando evaluación médica:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
