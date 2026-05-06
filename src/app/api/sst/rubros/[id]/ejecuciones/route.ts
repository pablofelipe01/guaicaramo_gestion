import { NextRequest, NextResponse } from 'next/server'
import { listarEjecuciones, registrarEjecucion } from '@/lib/sst/ppto'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: RouteContext<'/api/sst/rubros/[id]/ejecuciones'>) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarEjecuciones(id))
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/sst/rubros/[id]/ejecuciones'>) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const { id } = await ctx.params
  const body = await request.json()
  const record = await registrarEjecucion({ ...body, 'Rubro ID': id }, usuario.name as string)
  return NextResponse.json({ record }, { status: 201 })
}
