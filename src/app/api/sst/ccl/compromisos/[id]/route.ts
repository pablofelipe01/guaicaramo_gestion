import { NextRequest, NextResponse } from 'next/server'
import { deleteRecord, updateRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'
import type { CclCompromisoFields } from '@/types/sst/ccl'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  try {
    const record = await updateRecord<CclCompromisoFields>('sst_ccl_compromisos', id, body)
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error actualizando compromiso:', error)
    return NextResponse.json({ error: 'Error al actualizar compromiso' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await deleteRecord('sst_ccl_compromisos', id)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error eliminando compromiso:', error)
    return NextResponse.json({ error: 'Error al eliminar compromiso' }, { status: 500 })
  }
}
