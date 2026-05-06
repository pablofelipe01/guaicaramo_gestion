import { NextRequest, NextResponse } from 'next/server'
import { listarPlanes, crearPlan } from '@/lib/sst/plan'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  return NextResponse.json(await listarPlanes())
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  
  const body = await request.json()
  
  // Validar campos requeridos
  if (!body.Titulo?.trim()) {
    return NextResponse.json({ message: 'Título es requerido' }, { status: 400 })
  }
  if (!body['Año'] || body['Año'] < 2000 || body['Año'] > 2100) {
    return NextResponse.json({ message: 'Año inválido' }, { status: 400 })
  }
  
  // Usar usuario logueado como responsable si no se proporciona
  const fields = {
    ...body,
    Responsable: body.Responsable || usuario.name
  }
  
  try {
    const record = await crearPlan(fields, usuario.name as string)
    return NextResponse.json({ record }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear plan'
    return NextResponse.json({ message }, { status: 400 })
  }
}
