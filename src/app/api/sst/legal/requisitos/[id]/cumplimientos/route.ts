import { NextRequest, NextResponse } from 'next/server'
import { listarCumplimientos, crearCumplimiento, obtenerRequisito } from '@/lib/sst/legal'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/sst/legal/requisitos/[id]/cumplimientos'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarCumplimientos(id) })
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/sst/legal/requisitos/[id]/cumplimientos'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  const requisito = await obtenerRequisito(id)
  const record = await crearCumplimiento({ ...body, 'Requisito ID': id, 'Requisito Nombre': requisito.fields.Norma, Responsable: body.Responsable ?? usuario.name as string })
  return NextResponse.json({ record }, { status: 201 })
}
