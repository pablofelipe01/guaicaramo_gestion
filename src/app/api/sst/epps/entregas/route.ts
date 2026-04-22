import { NextRequest, NextResponse } from 'next/server'
import { listarEntregas, registrarEntrega } from '@/lib/sst/epp'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const trabajadorId = searchParams.get('trabajadorId') ?? undefined
  return NextResponse.json({ records: await listarEntregas(trabajadorId) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Trabajador ID'] || !body['Catalogo ID'] || !body.Motivo || !body['Fecha Entrega'])
    return NextResponse.json({ message: 'Trabajador ID, Catalogo ID, Motivo y Fecha Entrega son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await registrarEntrega(body) }, { status: 201 })
}
