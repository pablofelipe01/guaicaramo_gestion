import { NextRequest, NextResponse } from 'next/server'
import { listarCatalogo, crearCatalogo, alertasVencimiento } from '@/lib/sst/epp'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const alertas = searchParams.get('alertas')
  if (alertas) return NextResponse.json({ records: await alertasVencimiento() })
  return NextResponse.json({ records: await listarCatalogo() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Nombre || !body.Tipo)
    return NextResponse.json({ message: 'Nombre y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearCatalogo({ ...body, Estado: 'activo' }) }, { status: 201 })
}
