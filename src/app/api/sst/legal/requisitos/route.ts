import { NextRequest, NextResponse } from 'next/server'
import { listarRequisitos, crearRequisito, alertasLegal, resumenCumplimiento } from '@/lib/sst/legal'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = request.nextUrl
  if (searchParams.get('alertas') === 'true') return NextResponse.json({ alertas: await alertasLegal() })
  if (searchParams.get('resumen') === 'true') return NextResponse.json(await resumenCumplimiento())
  const todos = searchParams.get('todos') === 'true'
  return NextResponse.json(await listarRequisitos(!todos))
}

export async function POST(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body.Norma || !body.Tipo || !body.Ambito) return NextResponse.json({ message: 'Norma, Tipo y Ambito son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearRequisito(body) }, { status: 201 })
}
