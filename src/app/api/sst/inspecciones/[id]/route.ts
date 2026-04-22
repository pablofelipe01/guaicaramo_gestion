import { NextRequest, NextResponse } from 'next/server'
import { actualizarInspeccion } from '@/lib/sst/insp'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_INSPECCIONES = 'sst_insp_inspecciones'

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarInspeccion(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await deleteRecord(T_INSPECCIONES, id)
    return NextResponse.json({ message: 'Inspección eliminada' })
  } catch (error) {
    console.error('Error eliminando inspección:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
