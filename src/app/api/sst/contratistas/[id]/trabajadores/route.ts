import { NextRequest, NextResponse } from 'next/server'
import { listarTrabajadores, crearTrabajador } from '@/lib/sst/cont'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarTrabajadores(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body['Nombre Completo'])
    return NextResponse.json({ message: 'Nombre Completo es requerido' }, { status: 400 })
  return NextResponse.json({
    record: await crearTrabajador({ ...body, 'Contratista ID': id, Estado: 'activo', 'Induccion Realizada': false }),
  }, { status: 201 })
}
