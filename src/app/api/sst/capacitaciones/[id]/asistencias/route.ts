import { NextRequest, NextResponse } from 'next/server'
import { listarAsistencias, registrarAsistencia, obtenerCapacitacion } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarAsistencias(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  const cap = await obtenerCapacitacion(id)
  return NextResponse.json({
    record: await registrarAsistencia({
      ...body,
      'Capacitacion ID': id,
      'Capacitacion Tema': cap?.fields.Tema,
      'Fecha Registro': new Date().toISOString().split('T')[0],
    }),
  }, { status: 201 })
}
