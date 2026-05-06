import { NextRequest, NextResponse } from 'next/server'
import { listarExamenesDeCargo, crearExamen, obtenerPerfil } from '@/lib/sst/cargo'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/examenes'>
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const examenes = await listarExamenesDeCargo(id)
    return NextResponse.json({ records: examenes })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener exámenes' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/examenes'>
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { id } = await ctx.params
    const body = await request.json()
    const perfil = await obtenerPerfil(id)
    const examen = await crearExamen({ ...body, 'Cargo ID': id, 'Cargo Nombre': perfil.fields['Nombre Cargo'] })
    return NextResponse.json({ record: examen }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear examen' }, { status: 500 })
  }
}
