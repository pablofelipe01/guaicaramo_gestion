import { NextRequest, NextResponse } from 'next/server'
import { actualizarActividad } from '@/lib/sst/plan'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_ACTIVIDADES = 'sst_plan_actividades'

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    const body = await request.json()
    const record = await actualizarActividad(id, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error actualizando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    await deleteRecord(T_ACTIVIDADES, id)
    return NextResponse.json({ message: 'Actividad eliminada' })
  } catch (error) {
    console.error('Error eliminando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
