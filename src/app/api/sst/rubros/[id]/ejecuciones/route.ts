import { NextRequest, NextResponse } from 'next/server'
import { listarEjecuciones, registrarEjecucion } from '@/lib/sst/ppto'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/sst/rubros/[id]/ejecuciones'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarEjecuciones(id) })
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/sst/rubros/[id]/ejecuciones'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  const record = await registrarEjecucion({ ...body, 'Rubro ID': id }, usuario.name as string)
  return NextResponse.json({ record }, { status: 201 })
}
