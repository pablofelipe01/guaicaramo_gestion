import { NextRequest, NextResponse } from 'next/server'
import { listarRegistros, crearRegistro, obtenerActividad } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/sst/capacitaciones/[id]/asistencias — lista registros de ejecución de la actividad */
  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const records = await listarRegistros({ actividadId: id })
  return NextResponse.json({ records })
}

/** POST /api/sst/capacitaciones/[id]/asistencias — crea registro de ejecución */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const { id } = await ctx.params
  const body = await request.json()
  let actividad_tema: string | undefined
  try {
    const act = await obtenerActividad(id)
    actividad_tema = act.fields.tema
  } catch { /* continuar sin tema */ }
  const record = await crearRegistro({
    ...body,
    actividad_id:    id,
    actividad_tema,
    registrado_por:  usuario.name,
    fecha_ejecucion: body.fecha_ejecucion ?? new Date().toISOString().split('T')[0],
  })
  return NextResponse.json({ record }, { status: 201 })
}
