import { NextRequest, NextResponse } from 'next/server'
import { actualizarAccion } from '@/lib/sst/ac'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_ACCIONES = 'sst_ac_acciones'

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarAccion(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await deleteRecord(T_ACCIONES, id)
    return NextResponse.json({ message: 'Acción eliminada' })
  } catch (error) {
    console.error('Error eliminando acción:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
