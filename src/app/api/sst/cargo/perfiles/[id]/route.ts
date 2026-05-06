import { NextRequest, NextResponse } from 'next/server'
import { obtenerPerfil, actualizarPerfil } from '@/lib/sst/cargo'
import { deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const T_PERFILES = 'sst_cargo_perfiles'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  ctx: Ctx
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {

    const { id } = await ctx.params
    const perfil = await obtenerPerfil(id)
    return NextResponse.json({ record: perfil })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener perfil' }, { status: 500 })
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
    const perfil = await actualizarPerfil(id, body)
    return NextResponse.json({ record: perfil })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al actualizar perfil' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Ctx
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await params
    await deleteRecord(T_PERFILES, id)
    return NextResponse.json({ message: 'Perfil de cargo eliminado' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al eliminar perfil' }, { status: 500 })
  }
}
