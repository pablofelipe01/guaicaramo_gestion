import { NextRequest, NextResponse } from 'next/server'
import { verificarEficacia } from '@/lib/sst/ac'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (typeof body.confirmada !== 'boolean')
    return NextResponse.json({ message: 'confirmada (boolean) es requerido' }, { status: 400 })
  return NextResponse.json({ record: await verificarEficacia(id, body.confirmada, body.verificadoPorNombre) })
}
