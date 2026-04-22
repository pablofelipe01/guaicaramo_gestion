import { NextRequest, NextResponse } from 'next/server'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_CAPACITACIONES = 'sst_cap_capacitaciones'

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    await deleteRecord(T_CAPACITACIONES, id)
    return NextResponse.json({ message: 'Capacitación eliminada' })
  } catch (error) {
    console.error('Error eliminando capacitación:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
