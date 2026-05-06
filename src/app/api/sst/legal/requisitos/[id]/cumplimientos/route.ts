import { NextRequest, NextResponse } from 'next/server'
import { listarCumplimientos, crearCumplimiento, obtenerRequisito } from '@/lib/sst/legal'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarCumplimientos(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const { id } = await ctx.params
  const body = await request.json()
  const requisito = await obtenerRequisito(id)
  const record = await crearCumplimiento({ ...body, 'Requisito ID': id, 'Requisito Nombre': requisito.fields.Norma, Responsable: body.Responsable ?? usuario.name as string })
  return NextResponse.json({ record }, { status: 201 })
}
