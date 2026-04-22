import { NextRequest, NextResponse } from 'next/server'
import { listarCompromisos, actualizarReunion } from '@/lib/sst/ccl'
import { getRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  
  const { id } = await ctx.params
  try {
    const reunion = await getRecord('sst_ccl_reuniones', id)
    if (!reunion) return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 })
    
    const compromisos = await listarCompromisos(id)
    return NextResponse.json({ reunion, compromisos })
  } catch (error) {
    console.error('Error obteniendo reunión:', error)
    return NextResponse.json({ error: 'Error al obtener reunión' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  
  const { id } = await ctx.params
  const body = await request.json()
  
  try {
    const reunion = await actualizarReunion(id, body)
    return NextResponse.json(reunion)
  } catch (error) {
    console.error('Error actualizando reunión:', error)
    return NextResponse.json({ error: 'Error al actualizar reunión' }, { status: 500 })
  }
}
