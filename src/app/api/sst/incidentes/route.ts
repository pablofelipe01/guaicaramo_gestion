import { NextRequest, NextResponse } from 'next/server'
import { listarIncidentes, crearIncidente, estadisticasIncidentes } from '@/lib/sst/inc'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') ?? undefined
  const anio = searchParams.get('anio')
  if (anio) return NextResponse.json(await estadisticasIncidentes(parseInt(anio)))
  return NextResponse.json({ records: await listarIncidentes(tipo) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Trabajador ID'] || !body.Tipo || !body['Fecha Ocurrencia'] || !body.Descripcion)
    return NextResponse.json({ message: 'Trabajador ID, Tipo, Fecha Ocurrencia y Descripcion son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearIncidente(body) }, { status: 201 })
}
