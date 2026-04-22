import { NextRequest, NextResponse } from 'next/server'
import { obtenerComiteActivo, listarIntegrantes } from '@/lib/sst/ccl'
import { getRecord, deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const T_COMITES = 'sst_ccl_comites'

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  
  const { id } = await ctx.params
  try {
    const comite = await getRecord('sst_ccl_comites', id)
    if (!comite) return NextResponse.json({ error: 'Comité no encontrado' }, { status: 404 })
    
    const integrantes = await listarIntegrantes(id)
    return NextResponse.json({ comite, integrantes })
  } catch (error) {
    console.error('Error obteniendo comité:', error)
    return NextResponse.json({ error: 'Error al obtener comité' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const { id } = await params
    await deleteRecord(T_COMITES, id)
    return NextResponse.json({ message: 'Comité eliminado' })
  } catch (error) {
    console.error('Error eliminando comité:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
