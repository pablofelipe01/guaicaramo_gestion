import { NextRequest, NextResponse } from 'next/server'
import { listarControles, crearControl } from '@/lib/sst/cambio'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarControles(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({
    record: await crearControl({ ...body, 'Cambio ID': id, Estado: 'pendiente' }),
  }, { status: 201 })
}
