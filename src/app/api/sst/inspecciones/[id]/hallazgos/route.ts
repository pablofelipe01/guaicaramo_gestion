import { NextRequest, NextResponse } from 'next/server'
import { listarHallazgos, crearHallazgo, crearAccionPorHallazgo } from '@/lib/sst/insp'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json(await listarHallazgos(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Descripcion || !body.Criticidad)
    return NextResponse.json({ message: 'Descripcion y Criticidad son requeridos' }, { status: 400 })
  const record = await crearHallazgo({ ...body, 'Inspeccion ID': id })
  // Trigger: si es alta/crítica, crear acción correctiva automáticamente
  crearAccionPorHallazgo(record.id, record.fields).catch(err =>
    console.error('Error creando acción correctiva por hallazgo:', err)
  )
  return NextResponse.json({ record }, { status: 201 })
}
