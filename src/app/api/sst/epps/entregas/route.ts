import { NextRequest, NextResponse } from 'next/server'
import { listarEntregas, registrarEntrega } from '@/lib/sst/epp'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const trabajadorId = searchParams.get('trabajadorId') ?? undefined
  return NextResponse.json(await listarEntregas(trabajadorId))
}

export async function POST(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body['Trabajador ID'] || !body['Catalogo ID'] || !body.Motivo || !body['Fecha Entrega'])
    return NextResponse.json({ message: 'Trabajador ID, Catalogo ID, Motivo y Fecha Entrega son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await registrarEntrega(body) }, { status: 201 })
}
