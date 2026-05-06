import { NextRequest, NextResponse } from 'next/server'
import { actualizarPresupuesto } from '@/lib/sst/ppto'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  borrador: ['aprobado', 'cancelado'],
  aprobado: ['ejecutando', 'borrador'],
  ejecutando: ['cerrado', 'aprobado'],
  cerrado: [],
}

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
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
