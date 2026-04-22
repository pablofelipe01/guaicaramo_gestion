import { NextRequest, NextResponse } from 'next/server'
import { actualizarPresupuesto } from '@/lib/sst/ppto'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  borrador: ['aprobado', 'cancelado'],
  aprobado: ['ejecutando', 'borrador'],
  ejecutando: ['cerrado', 'aprobado'],
  cerrado: [],
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const { estadoActual, estadoNuevo } = await request.json()
  
  // Validar transición
  if (!estadoActual || !estadoNuevo) 
    return NextResponse.json({ message: 'Estado actual y nuevo son requeridos' }, { status: 400 })
  
  const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual] ?? []
  if (!transicionesPermitidas.includes(estadoNuevo))
    return NextResponse.json({ message: `No se puede transicionar de ${estadoActual} a ${estadoNuevo}` }, { status: 400 })
  
  try {
    const updated = await actualizarPresupuesto(id, { Estado: estadoNuevo })
    return NextResponse.json({ record: updated })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al cambiar estado' }, { status: 500 })
  }
}
