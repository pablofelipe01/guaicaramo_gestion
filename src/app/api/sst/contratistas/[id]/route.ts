import { NextRequest, NextResponse } from 'next/server'
import { actualizarContratista } from '@/lib/sst/cont'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  try {
    const record = await actualizarContratista(id, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error actualizando contratista:', error)
    return NextResponse.json({ error: 'Error al actualizar contratista' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await deleteRecord('sst_cont_contratistas', id)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error eliminando contratista:', error)
    return NextResponse.json({ error: 'Error al eliminar contratista' }, { status: 500 })
  }
}
