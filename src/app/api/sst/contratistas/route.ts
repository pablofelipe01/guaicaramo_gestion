import { NextRequest, NextResponse } from 'next/server'
import { listarContratistas, crearContratista, alertasContratistas } from '@/lib/sst/cont'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  if (request.nextUrl.searchParams.get('alertas') === 'true')
    return NextResponse.json({ alertas: await alertasContratistas() })
  return NextResponse.json({ records: await listarContratistas() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Nombre Empresa'] || !body.NIT)
    return NextResponse.json({ message: 'Nombre Empresa y NIT son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearContratista({
      ...body,
      Estado: 'activo',
      'Fecha Registro': new Date().toISOString().split('T')[0],
    }),
  }, { status: 201 })
}
