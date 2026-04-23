import { NextRequest, NextResponse } from 'next/server'
import { listarAcciones, crearAccion, alertasAcciones, estadisticasAcciones } from '@/lib/sst/ac'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const vista = searchParams.get('vista')
  if (vista === 'alertas') return NextResponse.json(await alertasAcciones())
  if (vista === 'estadisticas') return NextResponse.json(await estadisticasAcciones())
  const estado = searchParams.get('estado') ?? undefined
  const origen = searchParams.get('origen') ?? undefined
  return NextResponse.json({ records: await listarAcciones(estado, origen) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Titulo || !body.Tipo || !body.Origen || !body.Prioridad || !body['Fecha Limite'])
    return NextResponse.json({ message: 'Titulo, Tipo, Origen, Prioridad y Fecha Limite son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearAccion(body) }, { status: 201 })
}
