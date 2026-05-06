import { NextRequest, NextResponse } from 'next/server'
import { listarPeligrosDeCargo, crearPeligro, obtenerPerfil } from '@/lib/sst/cargo'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/peligros'>
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {

    const { id } = await ctx.params
    const peligros = await listarPeligrosDeCargo(id)
    return NextResponse.json({ records: peligros })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener peligros' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/peligros'>
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {

    const { id } = await ctx.params
    const body = await request.json()

    const perfil = await obtenerPerfil(id)
    const peligro = await crearPeligro({
      ...body,
      'Cargo ID': id,
      'Cargo Nombre': perfil.fields['Nombre Cargo'],
    })
    return NextResponse.json({ record: peligro }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear peligro' }, { status: 500 })
  }
}
