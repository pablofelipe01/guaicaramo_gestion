import { NextRequest, NextResponse } from 'next/server'
import { actualizarRubro } from '@/lib/sst/ppto'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_RUBROS = 'sst_ppto_rubros'

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  
  // Validaciones
  if (body['Nombre Rubro'] && !body['Nombre Rubro'].toString().trim()) 
    return NextResponse.json({ message: 'Nombre del rubro no puede estar vacío' }, { status: 400 })
  if (body['Valor Presupuestado'] !== undefined && (typeof body['Valor Presupuestado'] !== 'number' || body['Valor Presupuestado'] < 0))
    return NextResponse.json({ message: 'Valor presupuestado debe ser un número positivo' }, { status: 400 })
  
  try {
    const updated = await actualizarRubro(id, body)
    return NextResponse.json({ record: updated })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al actualizar rubro' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    await deleteRecord(T_RUBROS, id)
    return NextResponse.json({ message: 'Rubro eliminado' })
  } catch (error) {
    console.error('Error eliminando rubro:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
