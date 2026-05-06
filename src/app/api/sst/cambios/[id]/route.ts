import { NextRequest, NextResponse } from 'next/server'
import { obtenerCambio, actualizarCambio } from '@/lib/sst/cambio'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_CAMBIOS = 'sst_cambio_cambios'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const cambio = await obtenerCambio(id)
  if (!cambio) return NextResponse.json({ message: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ record: cambio })
}

export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarCambio(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    const { id } = await params
    await deleteRecord(T_CAMBIOS, id)
    return NextResponse.json({ message: 'Cambio eliminado' })
  } catch (error) {
    console.error('Error eliminando cambio:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
