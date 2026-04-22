import { NextRequest, NextResponse } from 'next/server'
import { listarComites, crearComite, alertasComite } from '@/lib/sst/ccl'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  if (request.nextUrl.searchParams.get('alertas') === 'true')
    return NextResponse.json({ alertas: await alertasComite() })
  return NextResponse.json({ records: await listarComites() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Nombre || !body['Fecha Inicio'] || !body['Fecha Fin'])
    return NextResponse.json({ message: 'Nombre, Fecha Inicio y Fecha Fin son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearComite({ ...body, Estado: 'activo' }) }, { status: 201 })
}
