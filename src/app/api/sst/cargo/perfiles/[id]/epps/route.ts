import { NextRequest, NextResponse } from 'next/server'
import { listarEppsDeCargo, crearEpp, obtenerPerfil } from '@/lib/sst/cargo'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/epps'>
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const epps = await listarEppsDeCargo(id)
    return NextResponse.json({ records: epps })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener EPPs' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/epps'>
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const body = await request.json()
    const perfil = await obtenerPerfil(id)
    const epp = await crearEpp({ ...body, 'Cargo ID': id, 'Cargo Nombre': perfil.fields['Nombre Cargo'] })
    return NextResponse.json({ record: epp }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear EPP' }, { status: 500 })
  }
}
