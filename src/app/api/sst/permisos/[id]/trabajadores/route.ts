import { NextRequest, NextResponse } from 'next/server'
import { listarTrabajadoresPermiso, agregarTrabajadorPermiso } from '@/lib/sst/perm'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarTrabajadoresPermiso(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body['Trabajador ID'])
    return NextResponse.json({ message: 'Trabajador ID es requerido' }, { status: 400 })
  return NextResponse.json({
    record: await agregarTrabajadorPermiso({ ...body, 'Permiso ID': id }),
  }, { status: 201 })
}
