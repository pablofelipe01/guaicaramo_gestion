import { NextRequest, NextResponse } from 'next/server'
import { actualizarPermiso, verificarPrerrequisitos } from '@/lib/sst/perm'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_PERMISOS = 'sst_perm_permisos'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await verificarPrerrequisitos(id))
}

export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarPermiso(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    const { id } = await params
    await deleteRecord(T_PERMISOS, id)
    return NextResponse.json({ message: 'Permiso eliminado' })
  } catch (error) {
    console.error('Error eliminando permiso:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
