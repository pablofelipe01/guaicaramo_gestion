import { NextRequest, NextResponse } from 'next/server'
import { listarReuniones, crearReunion } from '@/lib/sst/ccl'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const comiteId = request.nextUrl.searchParams.get('comiteId') ?? undefined
  return NextResponse.json(await listarReuniones(comiteId))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const body = await request.json()
  if (!body['Comite ID'] || !body.Fecha || !body.Tipo)
    return NextResponse.json({ message: 'Comite ID, Fecha y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearReunion({ ...body, Estado: 'programada', 'Creado Por': usuario.name }),
  }, { status: 201 })
}
