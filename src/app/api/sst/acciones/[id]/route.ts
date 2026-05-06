import { NextRequest, NextResponse } from 'next/server'
import { actualizarAccion } from '@/lib/sst/ac'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_ACCIONES = 'sst_ac_acciones'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarAccion(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await params
    await deleteRecord(T_ACCIONES, id)
    return NextResponse.json({ message: 'Acción eliminada' })
  } catch (error) {
    console.error('Error eliminando acción:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
