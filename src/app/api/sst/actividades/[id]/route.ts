import { NextRequest, NextResponse } from 'next/server'
import { actualizarActividad } from '@/lib/sst/plan'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/sst/actividades/[id]'>) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  const record = await actualizarActividad(id, body)
  return NextResponse.json({ record })
}
