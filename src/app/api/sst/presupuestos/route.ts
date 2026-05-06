import { NextRequest, NextResponse } from 'next/server'
import { listarPresupuestos, crearPresupuesto } from '@/lib/sst/ppto'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  return NextResponse.json(await listarPresupuestos())
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const body = await request.json()
  if (!body.Titulo || !body['Año']) return NextResponse.json({ message: 'Titulo y Año requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearPresupuesto(body, usuario.name as string) }, { status: 201 })
}
