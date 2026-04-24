import { NextRequest, NextResponse } from 'next/server'
import { cambiarEstado } from '@/lib/usuarios'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const { activo } = await request.json()
  if (typeof activo !== 'boolean') return NextResponse.json({ message: 'activo (boolean) es requerido' }, { status: 400 })
  return NextResponse.json({ record: await cambiarEstado(id, activo) })
}
