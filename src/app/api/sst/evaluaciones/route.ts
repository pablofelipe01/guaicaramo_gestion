import { NextRequest, NextResponse } from 'next/server'
import { listarEvaluaciones, crearEvaluacion } from '@/lib/sst/eval'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const records = await listarEvaluaciones()
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const body = await request.json()
  if (!body.Titulo || !body.Responsable) return NextResponse.json({ message: 'Titulo y Responsable son requeridos' }, { status: 400 })
  const record = await crearEvaluacion(body, usuario.name as string)
  return NextResponse.json({ record }, { status: 201 })
}
