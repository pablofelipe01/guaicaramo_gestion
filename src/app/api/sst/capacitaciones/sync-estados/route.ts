/**
 * @file route.ts
 * Ruta: POST /api/sst/capacitaciones/sync-estados
 *
 * Recalcula `estado_general` y `alerta_cobertura` en Airtable para una
 * actividad puntual o para todas. Idempotente: solo escribe cuando los
 * valores derivados difieren de los persistidos.
 *
 * Body JSON: `{ actividadId?: string }`
 *   - Si se omite `actividadId`, se sincronizan todas las actividades.
 *
 * Respuesta:
 *   - Para una actividad: `{ actividadId, estado_general, alerta_cobertura, changed }`
 *   - Para todas:         `{ total, sincronizadas, cambios }` con detalle por id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { listarActividades, recalcularEstadoActividad } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  let body: { actividadId?: string } = {}
  try {
    body = await request.json()
  } catch { /* body opcional */ }

  if (body.actividadId) {
    const r = await recalcularEstadoActividad(body.actividadId)
    return NextResponse.json({
      actividadId: body.actividadId,
      estado_general: r.estado,
      alerta_cobertura: r.alerta,
      changed: r.changed,
    })
  }

  // Sincronizar todas las actividades
  const actividades = await listarActividades()
  const cambios: Array<{
    actividadId: string
    estado_general: string
    alerta_cobertura: string
    changed: boolean
  }> = []

  for (const act of actividades) {
    const r = await recalcularEstadoActividad(act.id)
    cambios.push({
      actividadId: act.id,
      estado_general: r.estado,
      alerta_cobertura: r.alerta,
      changed: r.changed,
    })
  }

  return NextResponse.json({
    total: cambios.length,
    sincronizadas: cambios.filter(c => c.changed).length,
    cambios,
  })
}
