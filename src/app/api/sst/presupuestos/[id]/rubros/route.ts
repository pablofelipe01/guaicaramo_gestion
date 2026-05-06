import { NextRequest, NextResponse } from 'next/server'
import { listarRubros, crearRubro, alertasPresupuesto, obtenerPresupuesto } from '@/lib/sst/ppto'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: RouteContext<'/api/sst/presupuestos/[id]/rubros'>) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  if (request.nextUrl.searchParams.get('alertas') === 'true') {
    return NextResponse.json({ alertas: await alertasPresupuesto(id) })
  }
  return NextResponse.json(await listarRubros(id))
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/sst/presupuestos/[id]/rubros'>) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  const ppto = await obtenerPresupuesto(id)
  const record = await crearRubro({ ...body, 'Presupuesto ID': id, 'Presupuesto Titulo': ppto.fields.Titulo })
  return NextResponse.json({ record }, { status: 201 })
}
