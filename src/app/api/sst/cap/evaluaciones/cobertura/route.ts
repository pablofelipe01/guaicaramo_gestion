/**
 * @file route.ts
 * Ruta: GET /api/sst/cap/evaluaciones/cobertura
 *
 * Devuelve métricas de cobertura y aprobación de evaluaciones.
 * Consumido por el módulo de Indicadores SST para calcular:
 *   "Cobertura de capacitaciones = (evaluaron / total) × 100"
 *
 * Query params opcionales:
 *   id_capacitacion: string  → filtra por registro de ejecución específico
 *   fecha_desde: ISO date
 *   fecha_hasta: ISO date
 *
 * Requiere autenticación.
 */
import { NextRequest, NextResponse } from 'next/server'
import { obtenerCobertura } from '@/lib/sst/cap-evaluaciones'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const sp = request.nextUrl.searchParams
  try {
    const resultado = await obtenerCobertura({
      id_capacitacion: sp.get('id_capacitacion') ?? undefined,
      fecha_desde:     sp.get('fecha_desde')     ?? undefined,
      fecha_hasta:     sp.get('fecha_hasta')     ?? undefined,
    })
    return NextResponse.json(resultado)
  } catch (e) {
    console.error('[GET /api/sst/cap/evaluaciones/cobertura]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
