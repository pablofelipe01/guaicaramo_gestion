import { NextRequest, NextResponse } from 'next/server'
import { listarContratistas, crearContratista, alertasContratistas } from '@/lib/sst/cont'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  if (request.nextUrl.searchParams.get('alertas') === 'true')
    return NextResponse.json({ alertas: await alertasContratistas() })
  return NextResponse.json(await listarContratistas())
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body['Nombre Empresa'] || !body.NIT)
    return NextResponse.json({ message: 'Nombre Empresa y NIT son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearContratista({
      ...body,
      Estado: 'activo',
      'Fecha Registro': new Date().toISOString().split('T')[0],
    }),
  }, { status: 201 })
}
