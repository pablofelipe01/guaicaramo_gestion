import { NextRequest, NextResponse } from 'next/server'
import { obtenerRequisito, actualizarRequisito, listarCumplimientos } from '@/lib/sst/legal'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_REQUISITOS = 'sst_legal_requisitos'

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const [requisito, cumplimientos] = await Promise.all([
      obtenerRequisito(id),
      listarCumplimientos(id),
    ])
    if (!requisito) return NextResponse.json({ message: 'Requisito no encontrado' }, { status: 404 })
    return NextResponse.json({ record: requisito, cumplimientos })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al obtener requisito' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  try {
    const updated = await actualizarRequisito(id, body)
    return NextResponse.json({ record: updated })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al actualizar requisito' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await deleteRecord(T_REQUISITOS, id)
    return NextResponse.json({ message: 'Requisito eliminado' })
  } catch (error) {
    console.error('Error eliminando requisito:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
