import { NextRequest, NextResponse } from 'next/server'
import { obtenerDocumento, actualizarDocumento } from '@/lib/sst/doc'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  ctx: Ctx
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const doc = await obtenerDocumento(id)
    return NextResponse.json({ record: doc })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener documento' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  ctx: Ctx
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const body = await request.json()
    const doc = await actualizarDocumento(id, body)
    return NextResponse.json({ record: doc })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al actualizar documento' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: Ctx
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const { deleteRecord } = await import('@/lib/airtable-client')
    await deleteRecord('sst_doc_documentos', id)
    return NextResponse.json({ message: 'Documento eliminado' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al eliminar documento' }, { status: 500 })
  }
}
