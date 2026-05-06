import { NextRequest, NextResponse } from 'next/server'
import { actualizarCaso } from '@/lib/sst/caso'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_CASOS = 'sst_caso_casos'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarCaso(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    const { id } = await params
    await deleteRecord(T_CASOS, id)
    return NextResponse.json({ message: 'Caso eliminado' })
  } catch (error) {
    console.error('Error eliminando caso:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
