import { NextRequest, NextResponse } from 'next/server'
import { listarInvestigaciones, crearInvestigacion } from '@/lib/sst/inc'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarInvestigaciones(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Metodologia) return NextResponse.json({ message: 'Metodologia es requerida' }, { status: 400 })
  return NextResponse.json({
    record: await crearInvestigacion({ ...body, 'Incidente ID': id }),
  }, { status: 201 })
}
