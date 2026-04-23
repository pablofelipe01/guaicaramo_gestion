import { NextRequest, NextResponse } from 'next/server'
import { listarSeguimientos, crearSeguimiento } from '@/lib/sst/ac'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarSeguimientos(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Nota) return NextResponse.json({ message: 'Nota es requerida' }, { status: 400 })
  return NextResponse.json({ record: await crearSeguimiento({ ...body, 'Accion ID': id }) }, { status: 201 })
}
