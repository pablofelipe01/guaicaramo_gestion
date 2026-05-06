import { NextRequest, NextResponse } from 'next/server'
import { listarCasos, crearCaso } from '@/lib/sst/caso'
import { requireRole } from '@/lib/auth/middleware'

// Datos médicos confidenciales — solo coordinador SST, médico y administrador
const ROLES_MEDICO = ['coordinador_sst', 'medico', 'administrador'] as const

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...ROLES_MEDICO)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? undefined
  return NextResponse.json(await listarCasos(estado))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...ROLES_MEDICO)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body['Trabajador ID'] || !body.Tipo)
    return NextResponse.json({ message: 'Trabajador ID y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearCaso({ ...body, 'Fecha Apertura': body['Fecha Apertura'] ?? new Date().toISOString().split('T')[0] }),
  }, { status: 201 })
}
