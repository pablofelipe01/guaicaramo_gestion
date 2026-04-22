import { NextRequest, NextResponse } from 'next/server'
import { obtenerEvaluacion, cerrarEvaluacion } from '@/lib/sst/eval'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const record = await obtenerEvaluacion(id)
  return NextResponse.json({ record })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  if (body.accion === 'cerrar') {
    const record = await cerrarEvaluacion(id)
    return NextResponse.json({ record })
  }
  return NextResponse.json({ message: 'Acción no reconocida' }, { status: 400 })
}
