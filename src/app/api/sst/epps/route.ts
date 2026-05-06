import { NextRequest, NextResponse } from 'next/server'
import { listarCatalogo, crearCatalogo, alertasVencimiento } from '@/lib/sst/epp'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const alertas = searchParams.get('alertas')
  if (alertas) return NextResponse.json({ records: await alertasVencimiento() })
  return NextResponse.json(await listarCatalogo())
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body.Nombre || !body.Tipo)
    return NextResponse.json({ message: 'Nombre y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearCatalogo({ ...body, Estado: 'activo' }) }, { status: 201 })
}
