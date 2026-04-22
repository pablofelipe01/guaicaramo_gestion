import { NextRequest, NextResponse } from 'next/server'
import { listarDocumentos, crearDocumento } from '@/lib/sst/cont'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  return NextResponse.json({ records: await listarDocumentos(id) })
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Tipo || !body['Fecha Vencimiento'])
    return NextResponse.json({ message: 'Tipo y Fecha Vencimiento son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearDocumento({ ...body, 'Contratista ID': id, 'Fecha Carga': new Date().toISOString().split('T')[0] }),
  }, { status: 201 })
}
