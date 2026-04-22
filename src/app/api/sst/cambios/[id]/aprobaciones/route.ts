import { NextRequest, NextResponse } from 'next/server'
import { listarAprobaciones, registrarAprobacion } from '@/lib/sst/cambio'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarAprobaciones(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Decision || !body.Rol)
    return NextResponse.json({ message: 'Decision y Rol son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await registrarAprobacion({ ...body, 'Cambio ID': id, Aprobador: usuario.name }),
  }, { status: 201 })
}
