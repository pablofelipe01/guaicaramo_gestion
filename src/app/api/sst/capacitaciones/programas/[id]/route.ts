import { NextRequest, NextResponse } from 'next/server'
import { deleteRecord, updateRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'
import type { CapProgramaFields } from '@/types/sst/cap'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  try {
    const record = await updateRecord<CapProgramaFields>('sst_cap_programas', id, body)
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error actualizando programa:', error)
    return NextResponse.json({ error: 'Error al actualizar programa' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  try {
    await deleteRecord('sst_cap_programas', id)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error eliminando programa:', error)
    return NextResponse.json({ error: 'Error al eliminar programa' }, { status: 500 })
  }
}
