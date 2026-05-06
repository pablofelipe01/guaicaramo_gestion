import { NextRequest, NextResponse } from 'next/server'
import { listarProgramas, crearPrograma } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const records = await listarProgramas()
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const body = await request.json()
  if (!body.Titulo || !body['Año'])
    return NextResponse.json({ message: 'Titulo y Año son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearPrograma({
      ...body,
      Estado: 'activo',
      Responsable: body.Responsable ?? usuario.name,
      'Creado Por': usuario.name,
      'Fecha Creacion': new Date().toISOString().split('T')[0],
    }),
  }, { status: 201 })
}
