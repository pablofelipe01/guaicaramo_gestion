import { NextRequest, NextResponse } from 'next/server'
import { listarActividades, crearActividad, obtenerPlan, dashboardPlan } from '@/lib/sst/plan'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/sst/planes/[id]/actividades'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  if (request.nextUrl.searchParams.get('dashboard') === 'true') {
    return NextResponse.json(await dashboardPlan(id))
  }
  return NextResponse.json({ records: await listarActividades(id) })
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/sst/planes/[id]/actividades'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  const plan = await obtenerPlan(id)
  const record = await crearActividad({ ...body, 'Plan ID': id, 'Plan Titulo': plan.fields.Titulo, 'Porcentaje Avance': 0, Estado: body.Estado ?? 'pendiente' })
  return NextResponse.json({ record }, { status: 201 })
}
