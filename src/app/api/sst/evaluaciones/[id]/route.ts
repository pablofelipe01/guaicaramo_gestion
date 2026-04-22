import { NextRequest, NextResponse } from 'next/server'
import { obtenerEvaluacion, cerrarEvaluacion } from '@/lib/sst/eval'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

const T_EVALUACIONES = 'sst_eval_evaluaciones'

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    await deleteRecord(T_EVALUACIONES, id)
    return NextResponse.json({ message: 'Evaluación eliminada' })
  } catch (error) {
    console.error('Error eliminando evaluación:', error)
    return NextResponse.json({ message: 'Error al eliminar evaluación' }, { status: 500 })
  }
}
