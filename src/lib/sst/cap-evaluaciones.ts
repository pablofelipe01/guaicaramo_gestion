/**
 * @file cap-evaluaciones.ts
 * @module lib/sst/cap-evaluaciones
 *
 * Capa de acceso a datos para el submódulo de Evaluaciones de Eficacia.
 * Tablas Airtable:
 *   sst_cap_plantillas   → plantillas configurables de preguntas (admin)
 *   sst_cap_evaluaciones → evaluaciones completadas por trabajadores
 *
 * Lógica de calificación (servidor):
 *   - Pregunta 1 (texto abierto): 2.5 pts si no está vacía
 *   - Preguntas 2, 3, 4 (selección): 2.5 pts si respuesta === correcta
 *   - Total máximo: 10.0 pts · Aprueba con ≥ 7.5 pts
 *
 * Normativa: Decreto 1072/2015 · Resolución 0312/2019 · Formato GH-FO-14
 */
import 'server-only'
import {
  listRecords,
  createRecords,
  getRecord,
} from '@/lib/airtable-client'
import type {
  CapPlantillaFields,
  CapEvaluacionFields,
} from '@/types/sst/cap'

// ─── Nombres de tablas ─────────────────────────────────────────────────────────
const T_PLANTILLAS   = 'sst_cap_plantillas'
const T_EVALUACIONES = 'sst_cap_evaluaciones'

// =============================================================================
// PLANTILLAS
// =============================================================================

/** Devuelve todas las plantillas activas, ordenadas por nombre. */
export async function listarPlantillas(soloActivas = false) {
  const formula = soloActivas ? `{activo}=TRUE()` : undefined
  const { records } = await listRecords<CapPlantillaFields>(T_PLANTILLAS, {
    filterByFormula: formula,
    sort: [{ field: 'nombre_capacitacion', direction: 'asc' }],
  })
  return records
}

/** Obtiene una plantilla por su Record ID de Airtable. */
export async function obtenerPlantilla(id: string) {
  return getRecord<CapPlantillaFields>(T_PLANTILLAS, id)
}

/** Escapa caracteres que romperían una fórmula Airtable. */
function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n]/g, ' ')
}

/** Obtiene una plantilla activa por su qr_token (acceso público). */
export async function obtenerPlantillaPorToken(token: string) {
  const { records } = await listRecords<CapPlantillaFields>(T_PLANTILLAS, {
    filterByFormula: `AND({qr_token}='${esc(token)}',{activo}=TRUE())`,
    maxRecords: 1,
  })
  return records[0] ?? null
}

/** Crea una nueva plantilla. Genera el qr_token en el servidor. */
export async function crearPlantilla(
  data: Omit<CapPlantillaFields, 'qr_token'>
) {
  const token = crypto.randomUUID()
  const [record] = await createRecords<CapPlantillaFields>(T_PLANTILLAS, [
    { fields: { ...data, qr_token: token, activo: data.activo ?? true } },
  ])
  return record
}

// =============================================================================
// EVALUACIONES
// =============================================================================

export interface FiltrosEvaluacion {
  fecha_desde?: string
  fecha_hasta?: string
  area?: string
  nombre_capacitacion?: string
  puntaje_minimo?: number
  qr_token?: string
}

/** Lista evaluaciones con filtros opcionales, ordenadas por fecha descendente. */
export async function listarEvaluaciones(filtros?: FiltrosEvaluacion) {
  const conditions: string[] = []
  if (filtros?.fecha_desde)         conditions.push(`{fecha}>='${esc(filtros.fecha_desde)}'`)
  if (filtros?.fecha_hasta)         conditions.push(`{fecha}<='${esc(filtros.fecha_hasta)}'`)
  if (filtros?.area)                conditions.push(`{area}='${esc(filtros.area)}'`)
  if (filtros?.nombre_capacitacion) conditions.push(`{nombre_capacitacion}='${esc(filtros.nombre_capacitacion)}'`)
  if (filtros?.puntaje_minimo != null)
    conditions.push(`{puntaje}>=${Number(filtros.puntaje_minimo)}`)
  if (filtros?.qr_token)            conditions.push(`{qr_token}='${esc(filtros.qr_token)}'`)

  const formula =
    conditions.length === 0 ? undefined
    : conditions.length === 1 ? conditions[0]
    : `AND(${conditions.join(',')})`

  const { records } = await listRecords<CapEvaluacionFields>(T_EVALUACIONES, {
    filterByFormula: formula,
    sort: [{ field: 'fecha', direction: 'desc' }],
  })
  return records
}

/** Obtiene una evaluación por su Record ID. */
export async function obtenerEvaluacion(id: string) {
  return getRecord<CapEvaluacionFields>(T_EVALUACIONES, id)
}

/**
 * Calcula el puntaje automáticamente y persiste la evaluación.
 * Lógica: 2.5 por pregunta correcta (4 preguntas = 10 pts máx).
 * Pregunta 1 siempre suma 2.5 si el texto no está vacío.
 */
export async function guardarEvaluacion(
  data: Omit<CapEvaluacionFields, 'puntaje' | 'estado'>,
  plantilla: CapPlantillaFields
): Promise<import('@/lib/airtable-client').AirtableRecord<CapEvaluacionFields>> {
  const puntaje = calcularPuntaje(data, plantilla)
  const estado: CapEvaluacionFields['estado'] =
    puntaje >= 7.5 ? 'aprobado' : 'completado'

  const [record] = await createRecords<CapEvaluacionFields>(T_EVALUACIONES, [
    { fields: { ...data, puntaje, estado } },
  ])
  return record
}

// =============================================================================
// LÓGICA DE CALIFICACIÓN
// =============================================================================

/** Calcula el puntaje de una evaluación contra la plantilla. */
export function calcularPuntaje(
  data: Pick<CapEvaluacionFields, 'respuesta_1' | 'respuesta_2' | 'respuesta_3' | 'respuesta_4'>,
  plantilla: Pick<CapPlantillaFields, 'pregunta_2_correcta' | 'pregunta_3_correcta' | 'pregunta_4_correcta'>
): number {
  let pts = 0
  if (data.respuesta_1?.trim()) pts += 2.5
  if (data.respuesta_2 === plantilla.pregunta_2_correcta) pts += 2.5
  if (data.respuesta_3 === plantilla.pregunta_3_correcta) pts += 2.5
  if (data.respuesta_4 === plantilla.pregunta_4_correcta) pts += 2.5
  return pts
}
