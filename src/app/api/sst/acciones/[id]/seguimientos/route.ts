import { NextRequest, NextResponse } from 'next/server'
import { listarSeguimientos, crearSeguimiento } from '@/lib/sst/ac'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarSeguimientos(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Nota) return NextResponse.json({ message: 'Nota es requerida' }, { status: 400 })
  return NextResponse.json({ record: await crearSeguimiento({ ...body, 'Accion ID': id }) }, { status: 201 })
}
