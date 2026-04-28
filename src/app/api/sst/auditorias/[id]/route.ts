import { NextRequest, NextResponse } from 'next/server'
import { actualizarAuditoria } from '@/lib/sst/aud'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_AUDITORIAS = 'sst_aud_auditorias'

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await ctx.params
    const body = await request.json()
    return NextResponse.json({ record: await actualizarAuditoria(id, body) })
  } catch (error) {
    console.error('Error actualizando auditoría:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await deleteRecord(T_AUDITORIAS, id)
    return NextResponse.json({ message: 'Auditoría eliminada' })
  } catch (error) {
    console.error('Error eliminando auditoría:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
