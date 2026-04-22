import { NextRequest, NextResponse } from 'next/server'
import { actualizarIncidente } from '@/lib/sst/inc'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarIncidente(id, body) })
}
