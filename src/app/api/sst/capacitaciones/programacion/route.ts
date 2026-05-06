import { NextRequest, NextResponse } from 'next/server'
import { listarProgramacion, crearProgramacion } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { searchParams } = request.nextUrl
  const filtros = {
    actividadId: searchParams.get('actividad_id') ?? undefined,
    mes:         searchParams.get('mes')          ?? undefined,
  }
  const records = await listarProgramacion(filtros)
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const body = await request.json()
  if (!body.actividad_id || !body.mes || !body.semana)
    return NextResponse.json({ message: 'actividad_id, mes y semana son requeridos' }, { status: 400 })

  const record = await crearProgramacion(body)
  return NextResponse.json({ record }, { status: 201 })
}
