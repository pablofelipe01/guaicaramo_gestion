import { NextRequest, NextResponse } from 'next/server'
import { obtenerRequisito, actualizarRequisito, listarCumplimientos } from '@/lib/sst/legal'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_REQUISITOS = 'sst_legal_requisitos'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  try {
    const [requisito, cumplimientos] = await Promise.all([
      obtenerRequisito(id),
      listarCumplimientos(id),
    ])
    if (!requisito) return NextResponse.json({ message: 'Requisito no encontrado' }, { status: 404 })
    return NextResponse.json({ record: requisito, cumplimientos })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al obtener requisito' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  try {
    const updated = await actualizarRequisito(id, body)
    return NextResponse.json({ record: updated })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al actualizar requisito' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    const { id } = await params
    await deleteRecord(T_REQUISITOS, id)
    return NextResponse.json({ message: 'Requisito eliminado' })
  } catch (error) {
    console.error('Error eliminando requisito:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
