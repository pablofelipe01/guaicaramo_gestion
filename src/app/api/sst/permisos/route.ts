import { NextRequest, NextResponse } from 'next/server'
import { listarPermisos, crearPermiso } from '@/lib/sst/perm'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? undefined
  return NextResponse.json(await listarPermisos(estado))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const body = await request.json()
  if (!body['Tipo ID'] || !body.Area || !body['Tarea Descripcion'] || !body['Fecha Inicio'] || !body['Fecha Fin'])
    return NextResponse.json({ message: 'Tipo ID, Area, Tarea Descripcion, Fecha Inicio y Fecha Fin son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearPermiso({ ...body, 'Solicitante Nombre': usuario.name }),
  }, { status: 201 })
}
