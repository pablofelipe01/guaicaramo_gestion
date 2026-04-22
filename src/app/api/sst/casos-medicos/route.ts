import { NextRequest, NextResponse } from 'next/server'
import { listarCasos, crearCaso } from '@/lib/sst/caso'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? undefined
  return NextResponse.json({ records: await listarCasos(estado) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Trabajador ID'] || !body.Tipo)
    return NextResponse.json({ message: 'Trabajador ID y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearCaso({ ...body, 'Fecha Apertura': body['Fecha Apertura'] ?? new Date().toISOString().split('T')[0] }),
  }, { status: 201 })
}
