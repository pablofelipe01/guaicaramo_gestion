import { NextRequest, NextResponse } from 'next/server'
import { listarCambios, crearCambio } from '@/lib/sst/cambio'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  return NextResponse.json(await listarCambios())
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const body = await request.json()
  if (!body.Titulo || !body.Tipo)
    return NextResponse.json({ message: 'Titulo y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearCambio({ ...body, Estado: 'borrador', Solicitante: body.Solicitante ?? usuario.name }),
  }, { status: 201 })
}
