import { NextRequest, NextResponse } from 'next/server'
import { listarInspecciones, crearInspeccion } from '@/lib/sst/insp'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? undefined
  return NextResponse.json(await listarInspecciones(estado))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body['Tipo ID'] || !body.Area || !body['Fecha Programada'])
    return NextResponse.json({ message: 'Tipo ID, Area y Fecha Programada son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearInspeccion(body) }, { status: 201 })
}
