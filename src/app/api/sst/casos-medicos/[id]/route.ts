import { NextRequest, NextResponse } from 'next/server'
import { actualizarCaso } from '@/lib/sst/caso'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_CASOS = 'sst_caso_casos'

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  return NextResponse.json({ record: await actualizarCaso(id, body) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await params
    await deleteRecord(T_CASOS, id)
    return NextResponse.json({ message: 'Caso eliminado' })
  } catch (error) {
    console.error('Error eliminando caso:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
