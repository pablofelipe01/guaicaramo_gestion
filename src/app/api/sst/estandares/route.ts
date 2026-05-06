import { NextRequest, NextResponse } from 'next/server'
import { listarEstandares, crearEstandar } from '@/lib/sst/eval'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const records = await listarEstandares()
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  const record = await crearEstandar({ ...body, Activo: true })
  return NextResponse.json({ record }, { status: 201 })
}
