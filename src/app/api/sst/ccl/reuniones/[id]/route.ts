import { NextRequest, NextResponse } from 'next/server'
import { listarCompromisos, actualizarReunion } from '@/lib/sst/ccl'
import { getRecord, deleteRecord } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  
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
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  
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

export async function DELETE(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  try {
    await deleteRecord('sst_ccl_reuniones', id)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error eliminando reunión:', error)
    return NextResponse.json({ error: 'Error al eliminar reunión' }, { status: 500 })
  }
}
