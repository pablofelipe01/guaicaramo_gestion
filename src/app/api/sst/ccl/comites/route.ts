import { NextRequest, NextResponse } from 'next/server'
import { listarComites, crearComite, alertasComite } from '@/lib/sst/ccl'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  if (request.nextUrl.searchParams.get('alertas') === 'true')
    return NextResponse.json({ alertas: await alertasComite() })
  return NextResponse.json(await listarComites())
}

export async function POST(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body.Nombre || !body['Fecha Inicio'] || !body['Fecha Fin'])
    return NextResponse.json({ message: 'Nombre, Fecha Inicio y Fecha Fin son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearComite({ ...body, Estado: 'activo' }) }, { status: 201 })
}
