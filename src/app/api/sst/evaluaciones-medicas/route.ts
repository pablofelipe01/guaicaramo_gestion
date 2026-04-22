import { NextRequest, NextResponse } from 'next/server'
import { listarEvaluaciones, crearEvaluacion, alertasEvaluaciones } from '@/lib/sst/med'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const trabajadorId = searchParams.get('trabajadorId') ?? undefined
  const alertas = searchParams.get('alertas')
  if (alertas) return NextResponse.json({ records: await alertasEvaluaciones() })
  return NextResponse.json({ records: await listarEvaluaciones(trabajadorId) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Trabajador ID'] || !body.Tipo || !body.Fecha || !body.Aptitud)
    return NextResponse.json({ message: 'Trabajador ID, Tipo, Fecha y Aptitud son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearEvaluacion(body) }, { status: 201 })
}
