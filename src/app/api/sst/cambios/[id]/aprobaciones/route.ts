import { NextRequest, NextResponse } from 'next/server'
import { listarAprobaciones, registrarAprobacion } from '@/lib/sst/cambio'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarAprobaciones(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Decision || !body.Rol)
    return NextResponse.json({ message: 'Decision y Rol son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await registrarAprobacion({ ...body, 'Cambio ID': id, Aprobador: usuario.name }),
  }, { status: 201 })
}
