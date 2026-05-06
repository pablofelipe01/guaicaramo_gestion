import { NextRequest, NextResponse } from 'next/server'
import { listarInvestigaciones, crearInvestigacion } from '@/lib/sst/inc'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarInvestigaciones(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Metodologia) return NextResponse.json({ message: 'Metodologia es requerida' }, { status: 400 })
  return NextResponse.json({
    record: await crearInvestigacion({ ...body, 'Incidente ID': id }),
  }, { status: 201 })
}
