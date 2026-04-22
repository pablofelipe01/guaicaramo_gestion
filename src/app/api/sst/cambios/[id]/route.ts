import { NextRequest, NextResponse } from 'next/server'
import { obtenerCambio, actualizarCambio } from '@/lib/sst/cambio'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const cambio = await obtenerCambio(id)
  if (!cambio) return NextResponse.json({ message: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ record: cambio })
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarCambio(id, body) })
}
