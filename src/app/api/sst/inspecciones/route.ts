import { NextRequest, NextResponse } from 'next/server'
import { listarInspecciones, crearInspeccion } from '@/lib/sst/insp'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? undefined
  return NextResponse.json({ records: await listarInspecciones(estado) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Tipo ID'] || !body.Area || !body['Fecha Programada'])
    return NextResponse.json({ message: 'Tipo ID, Area y Fecha Programada son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearInspeccion(body) }, { status: 201 })
}
