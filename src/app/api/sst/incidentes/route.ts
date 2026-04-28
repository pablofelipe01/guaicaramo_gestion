import { NextRequest, NextResponse } from 'next/server'
import { listarIncidentes, crearIncidente, estadisticasIncidentes } from '@/lib/sst/inc'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') ?? undefined
    const anio = searchParams.get('anio')
    if (anio) return NextResponse.json(await estadisticasIncidentes(parseInt(anio)))
    return NextResponse.json(await listarIncidentes(tipo))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('[GET /api/sst/incidentes]', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    if (!body['Trabajador ID'] || !body.Tipo || !body['Fecha Ocurrencia'] || !body.Descripcion)
      return NextResponse.json({ message: 'Trabajador ID, Tipo, Fecha Ocurrencia y Descripcion son requeridos' }, { status: 400 })
    return NextResponse.json({ record: await crearIncidente(body) }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('[POST /api/sst/incidentes]', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
