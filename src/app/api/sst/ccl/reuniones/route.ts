import { NextRequest, NextResponse } from 'next/server'
import { listarReuniones, crearReunion } from '@/lib/sst/ccl'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const comiteId = request.nextUrl.searchParams.get('comiteId') ?? undefined
  return NextResponse.json({ records: await listarReuniones(comiteId) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Comite ID'] || !body.Fecha || !body.Tipo)
    return NextResponse.json({ message: 'Comite ID, Fecha y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearReunion({ ...body, Estado: 'programada', 'Creado Por': usuario.name }),
  }, { status: 201 })
}
