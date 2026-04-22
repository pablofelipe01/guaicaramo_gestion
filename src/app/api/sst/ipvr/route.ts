import { NextRequest, NextResponse } from 'next/server'
import { listarRegistros, crearRegistro, registrosNivelI } from '@/lib/sst/ipvr'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const area = searchParams.get('area') ?? undefined
  const nivelI = searchParams.get('nivelI')
  if (nivelI) return NextResponse.json({ records: await registrosNivelI() })
  return NextResponse.json({ records: await listarRegistros(area) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Area || !body['Proceso Actividad'] || !body['Descripcion Peligro'] || body.ND == null || body.NE == null || body.NC == null)
    return NextResponse.json({ message: 'Faltan campos requeridos: Area, Proceso Actividad, Descripcion Peligro, ND, NE, NC' }, { status: 400 })
  return NextResponse.json({ record: await crearRegistro(body) }, { status: 201 })
}
