import { NextRequest, NextResponse } from 'next/server'
import { listarRubros, crearRubro, alertasPresupuesto, obtenerPresupuesto } from '@/lib/sst/ppto'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/sst/presupuestos/[id]/rubros'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  if (request.nextUrl.searchParams.get('alertas') === 'true') {
    return NextResponse.json({ alertas: await alertasPresupuesto(id) })
  }
  return NextResponse.json({ records: await listarRubros(id) })
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/sst/presupuestos/[id]/rubros'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  const ppto = await obtenerPresupuesto(id)
  const record = await crearRubro({ ...body, 'Presupuesto ID': id, 'Presupuesto Titulo': ppto.fields.Titulo })
  return NextResponse.json({ record }, { status: 201 })
}
