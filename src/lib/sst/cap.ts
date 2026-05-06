/**
 * @file cap.ts
 * @module lib/sst/cap
 *
 * Capa de acceso a datos del módulo Capacitaciones.
 * Todas las funciones son server-only — no pueden importarse desde Client Components.
 *
 * Tablas Airtable manejadas:
 *   sst_cap_actividades   → catálogo anual de temas
 *   sst_cap_programacion  → calendarización semanal
 *   sst_cap_registros     → ejecución real de cada sesión
 *   sst_cap_asistencias   → firma individual por asistente
 *   sst_cap_indicadores   → KPIs trimestrales calculados
 *
 * Regla de integridad: ninguna función de este módulo escribe directamente
 * en tablas de otros módulos (sst_inc_, sst_ac_, etc.).
 */
import 'server-only'
import { listRecords, createRecords, updateRecord, getRecord, deleteRecord, deleteRecords } from '@/lib/airtable-client'
import type {
  CapActividadFields,
  CapProgramacionFields,
  CapRegistroFields,
  CapIndicadorFields,
  CapAsistenciaRegistroFields,
  CapProgramaFields,
  CapCapacitacionFields,
  CapPoblacionFields,
  CapAsistenciaFields,
} from '@/types/sst/cap'

// ─── Nombres de tablas Airtable ───────────────────────────────────────────────
const T_ACTIVIDADES    = 'sst_cap_actividades'
const T_PROGRAMACION   = 'sst_cap_programacion'
const T_REGISTROS      = 'sst_cap_registros'
const T_INDICADORES    = 'sst_cap_indicadores'

// ─── Tablas legacy (mantener para compatibilidad con rutas antiguas) ──────────
/** @deprecated Usar T_ACTIVIDADES. Se eliminará cuando se migren las rutas legacy. */
const T_PROGRAMAS      = 'sst_cap_programas'
/** @deprecated Usar T_REGISTROS. */
const T_CAPACITACIONES = 'sst_cap_capacitaciones'
/** @deprecated Sin reemplazo directo. */
const T_POBLACION      = 'sst_cap_poblacion'
const T_ASISTENCIAS    = 'sst_cap_asistencias'

// ─── Umbral para el cálculo de estado de meta (Resolución 0312 de 2019) ───────
const META_CUMPLIMIENTO_MINIMA = 80   // %
const UMBRAL_EN_RIESGO_FACTOR  = 0.75 // 75% de la meta = zona de riesgo

// =============================================================================
// ACTIVIDADES — Catálogo del plan anual
// =============================================================================

/**
 * Lista las actividades del plan anual con filtros opcionales.
 * Los resultados se ordenan por `item_numero` ascendente.
 *
 * @async
 * @param filtros - Filtros opcionales para acotar los resultados.
 * @param filtros.categoria - Filtrar por categoría SST exacta.
 * @param filtros.estado - Filtrar por estado general (ej. 'Sin programar').
 * @param filtros.responsable - Filtrar por nombre exacto del responsable.
 * @returns Array de registros Airtable con campos `CapActividadFields`.
 */
export async function listarActividades(filtros?: {
  categoria?: string
  estado?: string
  responsable?: string
}) {
  const conditions: string[] = []
  if (filtros?.categoria)   conditions.push(`{categoria}='${filtros.categoria}'`)
  if (filtros?.estado)      conditions.push(`{estado_general}='${filtros.estado}'`)
  if (filtros?.responsable) conditions.push(`{responsable}='${filtros.responsable}'`)
  const formula =
    conditions.length === 1 ? conditions[0]
    : conditions.length > 1 ? `AND(${conditions.join(',')})`
    : undefined

  const { records } = await listRecords<CapActividadFields>(T_ACTIVIDADES, {
    filterByFormula: formula,
    sort: [{ field: 'item_numero', direction: 'asc' }],
  })
  return records
}

/**
 * Obtiene una actividad por su ID de Airtable.
 *
 * @async
 * @param id - ID del registro en `sst_cap_actividades`.
 * @returns Registro completo de la actividad.
 * @throws {Error} Si el registro no existe en Airtable.
 */
export async function obtenerActividad(id: string) {
  return getRecord<CapActividadFields>(T_ACTIVIDADES, id)
}

/**
 * Crea una nueva actividad en el plan anual.
 * Aplica valores por defecto para campos obligatorios no provistos.
 *
 * @async
 * @param fields - Campos de la actividad. `tema` y `categoria` son requeridos en la API.
 * @returns Registro Airtable recién creado.
 */
export async function crearActividad(fields: Partial<CapActividadFields>) {
  const payload: CapActividadFields = {
    item_numero: fields.item_numero ?? 0,
    tema: fields.tema ?? '',
    categoria: fields.categoria ?? 'Ergonomía, mecánica y EPI',
    proveedor: fields.proveedor ?? 'SST',
    responsable: fields.responsable ?? '',
    anio: fields.anio ?? 2026,
    requiere_certificacion: fields.requiere_certificacion ?? false,
    estado_general: fields.estado_general ?? 'Sin programar',
    ...fields,
  }
  const [record] = await createRecords<CapActividadFields>(T_ACTIVIDADES, [{ fields: payload }])
  return record
}

/**
 * Actualiza parcialmente los campos de una actividad.
 *
 * @async
 * @param id - ID del registro en `sst_cap_actividades`.
 * @param fields - Campos a actualizar (patch, no reemplaza campos no incluidos).
 * @returns Registro Airtable actualizado.
 */
export async function actualizarActividad(id: string, fields: Partial<CapActividadFields>) {
  return updateRecord<CapActividadFields>(T_ACTIVIDADES, id, fields)
}

/**
 * Elimina una actividad y todas sus programaciones asociadas (cascada).
 * No elimina los registros de ejecución existentes para preservar el historial.
 *
 * @async
 * @param id - ID del registro en `sst_cap_actividades`.
 * @returns Resultado de la eliminación de Airtable.
 */
export async function eliminarActividad(id: string) {
  // Eliminar programaciones primero para mantener la integridad referencial
  const { records: progs } = await listRecords<CapProgramacionFields>(T_PROGRAMACION, {
    filterByFormula: `{actividad_id}='${id}'`,
  })
  if (progs.length > 0) {
    await deleteRecords(T_PROGRAMACION, progs.map(p => p.id))
  }
  return deleteRecord(T_ACTIVIDADES, id)
}

// =============================================================================
// PROGRAMACIÓN — Calendarización semanal
// =============================================================================

/**
 * Lista las sesiones programadas del cronograma anual.
 * Ordenadas por `fecha_programada` ascendente.
 *
 * @async
 * @param filtros - Filtros opcionales.
 * @param filtros.actividadId - Filtrar por ID de actividad.
 * @param filtros.mes - Filtrar por mes calendario (ej. 'Junio').
 * @returns Array de registros de programación.
 */
export async function listarProgramacion(filtros?: {
  actividadId?: string
  mes?: string
}) {
  const conditions: string[] = []
  if (filtros?.actividadId) conditions.push(`{actividad_id}='${filtros.actividadId}'`)
  if (filtros?.mes)         conditions.push(`{mes}='${filtros.mes}'`)
  const formula =
    conditions.length === 1 ? conditions[0]
    : conditions.length > 1 ? `AND(${conditions.join(',')})`
    : undefined

  const { records } = await listRecords<CapProgramacionFields>(T_PROGRAMACION, {
    filterByFormula: formula,
    sort: [{ field: 'fecha_programada', direction: 'asc' }],
  })
  return records
}

/**
 * Crea una nueva sesión en el cronograma y recalcula el estado de la actividad.
 * Al crear la primera programación, la actividad pasa de 'Sin programar' a 'Programado'.
 *
 * @async
 * @param fields - Campos de la programación. `actividad_id`, `mes` y `semana` son requeridos.
 * @returns Registro Airtable recién creado.
 */
export async function crearProgramacion(fields: Partial<CapProgramacionFields>) {
  const payload: CapProgramacionFields = {
    actividad_id: fields.actividad_id ?? '',
    mes: fields.mes ?? 'Enero',
    semana: fields.semana ?? 1,
    estado: fields.estado ?? 'Programado',
    ...fields,
  }
  const [record] = await createRecords<CapProgramacionFields>(T_PROGRAMACION, [{ fields: payload }])

  // Recalcular el estado de la actividad basado en todas sus programaciones
  if (fields.actividad_id) {
    await recalcularEstadoActividad(fields.actividad_id)
  }
  return record
}

/**
 * Actualiza una sesión del cronograma y recalcula el estado de su actividad.
 * Omite `actividad_tema` porque es un campo lookup de solo lectura en Airtable.
 *
 * @async
 * @param id - ID del registro en `sst_cap_programacion`.
 * @param fields - Campos a actualizar.
 * @returns Registro Airtable actualizado.
 */
export async function actualizarProgramacion(id: string, fields: Partial<CapProgramacionFields>) {
  // actividad_tema es lookup de Airtable — no puede escribirse
  const { actividad_tema: _at, ...writableFields } = fields

  const record = await updateRecord<CapProgramacionFields>(T_PROGRAMACION, id, writableFields)

  const actividadId = record.fields?.actividad_id
  if (actividadId) await recalcularEstadoActividad(actividadId)
  return record
}

/**
 * Recalcula y persiste el estado_general de una actividad según el conjunto
 * actual de sus programaciones:
 *
 *  - Sin programaciones          → "Sin programar"
 *  - Todas Cancelado             → "Cancelado"
 *  - Todas Ejecutado             → "Completado"
 *  - Al menos una Ejecutado      → "En ejecución"
 *  - Al menos una Programado/Reprogramado, ninguna Ejecutado → "Programado"
 */
async function recalcularEstadoActividad(actividadId: string): Promise<void> {
  const programaciones = await listarProgramacion({ actividadId })

  let nuevoEstado: import('@/types/sst/cap').CapEstadoGeneral

  if (programaciones.length === 0) {
    nuevoEstado = 'Sin programar'
  } else {
    const estados = programaciones.map(p => p.fields.estado)
    const todasCancelado   = estados.every(e => e === 'Cancelado')
    const todasEjecutado   = estados.every(e => e === 'Ejecutado')
    const algunaEjecutado  = estados.some(e => e === 'Ejecutado')

    if (todasCancelado)  nuevoEstado = 'Cancelado'
    else if (todasEjecutado)  nuevoEstado = 'Completado'
    else if (algunaEjecutado) nuevoEstado = 'En ejecución'
    else                      nuevoEstado = 'Programado'
  }

  // Solo actualizar si cambió, para evitar escrituras innecesarias
  try {
    const act = await getRecord<CapActividadFields>(T_ACTIVIDADES, actividadId)
    if (act.fields.estado_general !== nuevoEstado) {
      await updateRecord<CapActividadFields>(T_ACTIVIDADES, actividadId, { estado_general: nuevoEstado })
    }
  } catch { /* actividad no encontrada, continuar */ }
}

/**
 * Elimina una sesión del cronograma y recalcula el estado de su actividad.
 * Si era la única sesión programada, la actividad vuelve a 'Sin programar'.
 *
 * @async
 * @param id - ID del registro en `sst_cap_programacion`.
 */
export async function eliminarProgramacion(id: string): Promise<void> {
  // Capturar el actividad_id antes de eliminar para poder recalcular el estado
  let actividadId: string | undefined
  try {
    const prog = await getRecord<CapProgramacionFields>(T_PROGRAMACION, id)
    actividadId = prog.fields.actividad_id
  } catch { /* no encontrado */ }

  await deleteRecord(T_PROGRAMACION, id)

  if (actividadId) await recalcularEstadoActividad(actividadId)
}

// =============================================================================
// REGISTROS — Ejecución real de sesiones
// =============================================================================

/**
 * Lista los registros de ejecución de sesiones.
 * Ordenados por `fecha_ejecucion` descendente (más recientes primero).
 *
 * @async
 * @param filtros - Filtros opcionales.
 * @param filtros.actividadId - Filtrar por ID de actividad.
 * @param filtros.programacionId - Filtrar por ID de programación.
 * @returns Array de registros de ejecución.
 */
export async function listarRegistros(filtros?: {
  actividadId?: string
  programacionId?: string
}) {
  const conditions: string[] = []
  if (filtros?.actividadId)    conditions.push(`{actividad_id}='${filtros.actividadId}'`)
  if (filtros?.programacionId) conditions.push(`{programacion_id}='${filtros.programacionId}'`)
  const formula =
    conditions.length === 1 ? conditions[0]
    : conditions.length > 1 ? `AND(${conditions.join(',')})`
    : undefined

  const { records } = await listRecords<CapRegistroFields>(T_REGISTROS, {
    filterByFormula: formula,
    sort: [{ field: 'fecha_ejecucion', direction: 'desc' }],
  })
  return records
}

/**
 * Registra la ejecución de una sesión de capacitación.
 *
 * Efectos secundarios automáticos:
 *  1. Marca la programación asociada como 'Ejecutado' (si `programacion_id` fue provisto).
 *  2. Recalcula el `estado_general` de la actividad padre.
 *
 * @async
 * @param fields - Datos de la ejecución. `actividad_id` y `fecha_ejecucion` son requeridos.
 * @returns Registro Airtable recién creado.
 * @throws {Error} Si la llamada a Airtable falla.
 */
export async function crearRegistro(fields: Partial<CapRegistroFields>) {
  // Solo enviar campos escribibles — actividad_tema es lookup de solo lectura en Airtable.
  const writableFields: Record<string, unknown> = {}
  const writable = [
    'actividad_id', 'programacion_id', 'duracion_horas', 'lugar',
    'facilitador', 'convocados', 'presentes',
    'evaluaciones_realizadas', 'evaluaciones_aprobadas', 'observaciones',
  ] as const

  for (const key of writable) {
    const val = fields[key as keyof CapRegistroFields]
    if (val !== undefined && val !== null && val !== '') writableFields[key] = val
  }
  if (!writableFields.actividad_id) writableFields.actividad_id = ''

  const [record] = await createRecords<CapRegistroFields>(T_REGISTROS, [{ fields: writableFields as unknown as CapRegistroFields }])

  // Actualizar estado de programación a 'Ejecutado'
  if (fields.programacion_id) {
    try {
      await updateRecord<CapProgramacionFields>(T_PROGRAMACION, fields.programacion_id, {
        estado: 'Ejecutado',
      })
    } catch (e) {
      console.error('[crearRegistro] update programacion failed:', e)
    }
  }

  // Fix 3: no sobreescribir estado si la actividad ya está Completado
  if (fields.actividad_id) {
    try {
      const act = await getRecord<CapActividadFields>(T_ACTIVIDADES, fields.actividad_id)
      if (act.fields.estado_general !== 'Completado') {
        await updateRecord<CapActividadFields>(T_ACTIVIDADES, fields.actividad_id, {
          estado_general: 'En ejecución',
        })
      }
    } catch { /* actividad no encontrada, continuar */ }

    // Recalcular estado basado en todas las programaciones
    await recalcularEstadoActividad(fields.actividad_id)
  }

  return record
}

/**
 * Actualiza parcialmente un registro de ejecución.
 *
 * @async
 * @param id - ID del registro en `sst_cap_registros`.
 * @param fields - Campos a actualizar.
 * @returns Registro Airtable actualizado.
 */
export async function actualizarRegistro(id: string, fields: Partial<CapRegistroFields>) {
  return updateRecord<CapRegistroFields>(T_REGISTROS, id, fields)
}

/**
 * Elimina un registro de ejecución.
 * No recalcula el estado de la actividad — usar con precaución.
 *
 * @async
 * @param id - ID del registro en `sst_cap_registros`.
 */
export async function eliminarRegistro(id: string) {
  return deleteRecord(T_REGISTROS, id)
}

// =============================================================================
// INDICADORES — KPIs trimestrales
// =============================================================================

/**
 * Lista todos los registros de indicadores trimestrales.
 * Ordenados por trimestre ascendente (Q1 → Q4).
 *
 * @async
 * @returns Array de todos los indicadores calculados.
 */
export async function listarIndicadores() {
  const { records } = await listRecords<CapIndicadorFields>(T_INDICADORES, {
    sort: [{ field: 'trimestre', direction: 'asc' }],
  })
  return records
}

/**
 * Obtiene el registro de indicadores de un trimestre específico.
 *
 * @async
 * @param trimestre - Identificador del trimestre (ej. 'Q2 2026').
 * @returns Registro de indicadores, o null si aún no existe para ese trimestre.
 */
export async function obtenerIndicadorPorTrimestre(trimestre: string) {
  const { records } = await listRecords<CapIndicadorFields>(T_INDICADORES, {
    filterByFormula: `{trimestre}='${trimestre}'`,
    maxRecords: 1,
  })
  return records[0] ?? null
}

/**
 * Calcula y persiste los KPIs de un trimestre a partir de los datos reales.
 *
 * Proceso:
 *  1. Filtra las programaciones del trimestre por sus meses correspondientes.
 *  2. Agrega los totales de convocados, presentes y evaluaciones desde los registros
 *     de ejecución dentro del rango de fechas del trimestre.
 *  3. Calcula los tres indicadores principales (cumplimiento, cobertura, eficacia).
 *  4. Crea o actualiza el registro en `sst_cap_indicadores`.
 *
 * Indicadores calculados (Res. 0312 de 2019):
 *  - pct_cumplimiento = (ejecutadas / programadas) × 100
 *  - pct_cobertura    = (presentes / convocados) × 100
 *  - pct_eficacia     = (evaluaciones_aprobadas / evaluaciones_realizadas) × 100
 *
 * @async
 * @param trimestre - Identificador del trimestre a calcular (ej. 'Q1 2026').
 * @returns Registro Airtable creado o actualizado con los KPIs del trimestre.
 */
export async function calcularIndicadoresTrimestre(trimestre: string) {
  const mesesPorTrimestre: Record<string, CapProgramacionFields['mes'][]> = {
    'Q1 2026': ['Enero', 'Febrero', 'Marzo'],
    'Q2 2026': ['Abril', 'Mayo', 'Junio'],
    'Q3 2026': ['Julio', 'Agosto', 'Septiembre'],
    'Q4 2026': ['Octubre', 'Noviembre', 'Diciembre'],
  }
  const meses = mesesPorTrimestre[trimestre] ?? []

  const { records: todasProg } = await listRecords<CapProgramacionFields>(T_PROGRAMACION)
  const delTrimestre = todasProg.filter(r => meses.includes(r.fields.mes))

  const programadas = delTrimestre.length
  const ejecutadas  = delTrimestre.filter(r => r.fields.estado === 'Ejecutado').length

  // Acumular totales desde registros de las actividades del trimestre
  const actividadesIds = [...new Set(delTrimestre.map(r => r.fields.actividad_id))]
  let totalConvocados = 0, totalPresentes = 0, evalRealizadas = 0, evalAprobadas = 0

  // Fix 2: rango de fechas por trimestre para no mezclar registros de otros períodos
  const rangoFechas: Record<string, { desde: string; hasta: string }> = {
    'Q1 2026': { desde: '2026-01-01', hasta: '2026-03-31' },
    'Q2 2026': { desde: '2026-04-01', hasta: '2026-06-30' },
    'Q3 2026': { desde: '2026-07-01', hasta: '2026-09-30' },
    'Q4 2026': { desde: '2026-10-01', hasta: '2026-12-31' },
  }
  const rango = rangoFechas[trimestre]

  for (const actId of actividadesIds) {
    const registros = await listarRegistros({ actividadId: actId })
    const delPeriodo = rango
      ? registros.filter(r => {
          const f = r.fields.fecha_ejecucion
          return f != null && f >= rango.desde && f <= rango.hasta
        })
      : registros
    for (const reg of delPeriodo) {
      totalConvocados += reg.fields.convocados  ?? 0
      totalPresentes  += reg.fields.presentes   ?? 0
      evalRealizadas  += reg.fields.evaluaciones_realizadas ?? 0
      evalAprobadas   += reg.fields.evaluaciones_aprobadas  ?? 0
    }
  }

  const pct_cumplimiento = calcularPct(ejecutadas, programadas)
  const pct_cobertura    = calcularPct(totalPresentes, totalConvocados)
  const pct_eficacia     = calcularPct(evalAprobadas, evalRealizadas)

  // Semáforo según umbrales de la Resolución 0312 de 2019 (meta mínima 80%)
  const estado_meta_cumplimiento: CapIndicadorFields['estado_meta_cumplimiento'] =
    pct_cumplimiento >= META_CUMPLIMIENTO_MINIMA
      ? 'Cumple'
      : pct_cumplimiento >= META_CUMPLIMIENTO_MINIMA * UMBRAL_EN_RIESGO_FACTOR
        ? 'En riesgo'
        : 'No cumple'

  const indicadorData: Partial<CapIndicadorFields> = {
    trimestre: trimestre as CapIndicadorFields['trimestre'],
    programadas,
    ejecutadas,
    trabajadores_capacitados: totalPresentes,
    trabajadores_objetivo:    totalConvocados,
    evaluaciones_realizadas:  evalRealizadas,
    evaluaciones_aprobadas:   evalAprobadas,
    inducciones_realizadas:   0,
    ingresos_periodo:         0,
    pct_cumplimiento,
    pct_cobertura,
    pct_eficacia,
    pct_cobertura_induccion:  0,
    estado_meta_cumplimiento,
  }

  const existing = await obtenerIndicadorPorTrimestre(trimestre)
  if (existing) {
    return updateRecord<CapIndicadorFields>(T_INDICADORES, existing.id, indicadorData)
  }
  const [record] = await createRecords<CapIndicadorFields>(T_INDICADORES, [{ fields: indicadorData as CapIndicadorFields }])
  return record
}

/**
 * Actualiza parcialmente un registro de indicadores.
 * Usar para análisis narrativos o correcciones manuales de un coordinador SST.
 *
 * @async
 * @param id - ID del registro en `sst_cap_indicadores`.
 * @param fields - Campos a actualizar.
 * @returns Registro Airtable actualizado.
 */
export async function actualizarIndicador(id: string, fields: Partial<CapIndicadorFields>) {
  return updateRecord<CapIndicadorFields>(T_INDICADORES, id, fields)
}

// =============================================================================
// HELPERS — Cálculo y presentación (server-side)
// Nota: estos helpers están duplicados en cap-client.ts para uso en Client
// Components. Mantener sincronizados si se modifican las fórmulas.
// =============================================================================

/**
 * Calcula un porcentaje redondeado al entero más cercano.
 * Retorna 0 si el denominador es 0, evitando NaN o Infinity.
 *
 * @param numerador - Valor parcial.
 * @param denominador - Valor total.
 * @returns Porcentaje entero 0–100.
 */
export function calcularPct(numerador: number, denominador: number): number {
  if (denominador === 0) return 0
  return Math.round((numerador / denominador) * 100)
}

/**
 * Devuelve un token semántico de color para un indicador según su cercanía a la meta.
 *
 * @param porcentaje - Valor actual del indicador (0–100).
 * @param meta - Meta esperada. Por defecto 80 (mínimo Res. 0312).
 * @returns Token de estado: 'success' | 'warning' | 'danger'.
 */
export function getColorEstadoMeta(
  porcentaje: number,
  meta = 80
): 'success' | 'warning' | 'danger' {
  if (porcentaje >= meta) return 'success'
  if (porcentaje >= meta * 0.75) return 'warning'
  return 'danger'
}

/**
 * Devuelve el color hexadecimal asociado a una categoría de capacitación.
 * Usado en cronogramas, tarjetas y badges del módulo.
 *
 * @param categoria - Nombre exacto de la categoría SST.
 * @returns Color hex. Por defecto '#6C757D' (gris) si la categoría no existe.
 */
export function getCategoriaColor(categoria: string): string {
  const colores: Record<string, string> = {
    'Alturas y espacios confinados': '#2C5F8D',
    'Seguridad vial y emergencias':  '#FF8C42',
    'Salud y riesgo biológico':       '#28A745',
    'Riesgos físicos y químicos':    '#DC3545',
    'Psicosocial y bienestar':       '#6C757D',
    'Ergonomía, mecánica y EPI':     '#6f42c1',
  }
  return colores[categoria] ?? '#6C757D'
}

export const CATEGORIAS_CAP = [
  'Alturas y espacios confinados',
  'Seguridad vial y emergencias',
  'Salud y riesgo biológico',
  'Riesgos físicos y químicos',
  'Psicosocial y bienestar',
  'Ergonomía, mecánica y EPI',
] as const

/**
 * Proveedores habilitados para impartir capacitaciones SST.
 * Incluye la ARL (SURA), el SENA y equipos internos de la empresa.
 * @see CATEGORIAS_CAP en cap-client.ts para usar en componentes.
 */
export const PROVEEDORES_CAP = [
  'Proveedor externo', 'ARL SURA', 'SENA', 'SST', 'Enfermería', 'Bienestar Social',
] as const

/** Nombres canónicos de los 12 meses en español, usados como `mes` en programaciones. */
export const MESES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

/**
 * Trimestres del año vigente 2026.
 * Actualizar manualmente para cada año fiscal.
 */
export const TRIMESTRES_CAP: CapIndicadorFields['trimestre'][] = [
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
]

// =============================================================================
// LEGACY — Funciones para rutas antiguas
// @deprecated Usar las funciones de Actividades/Registros en código nuevo.
// Tablas: sst_cap_programas, sst_cap_capacitaciones, sst_cap_poblacion
// =============================================================================

/**
 * Lista los programas anuales de capacitación (tabla legacy).
 *
 * @async
 * @returns Array de programas ordenados por año descendente.
 * @deprecated Usar `listarActividades`. Se mantiene para compatibilidad con rutas antiguas.
 */
export async function listarProgramas() {
  const { records } = await listRecords<CapProgramaFields>(T_PROGRAMAS, {
    sort: [{ field: 'Año', direction: 'desc' }],
  })
  return records
}

/**
 * Crea un programa anual de capacitación (tabla legacy).
 *
 * @async
 * @param fields - Campos del programa.
 * @returns Registro Airtable recién creado.
 * @deprecated Usar `crearActividad`. Se mantiene para compatibilidad con rutas antiguas.
 */
export async function crearPrograma(fields: Partial<CapProgramaFields>) {
  const [record] = await createRecords<CapProgramaFields>(T_PROGRAMAS, [{ fields }])
  return record
}

/**
 * Lista las capacitaciones de un programa (tabla legacy).
 *
 * @async
 * @param programaId - ID del programa para filtrar. Sin filtro devuelve todas.
 * @returns Array de capacitaciones ordenadas por fecha programada ascendente.
 * @deprecated Usar `listarProgramacion`. Se mantiene para compatibilidad con rutas antiguas.
 */
export async function listarCapacitaciones(programaId?: string) {
  const { records } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES, {
    filterByFormula: programaId ? `{Programa ID}="${programaId}"` : undefined,
    sort: [{ field: 'Fecha Programada', direction: 'asc' }],
  })
  return records
}

/**
 * Obtiene una capacitación por su ID de registro Airtable (tabla legacy).
 * Usa un filtro `RECORD_ID()` porque la tabla no tiene campo `id` indexado.
 *
 * @async
 * @param id - ID del registro Airtable.
 * @returns Primer registro encontrado, o `undefined` si no existe.
 * @deprecated Usar `obtenerActividad` o `listarProgramacion`. Se mantiene para compatibilidad.
 */
export async function obtenerCapacitacion(id: string) {
  const { records } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES, {
    filterByFormula: `RECORD_ID()="${id}"`,
    maxRecords: 1,
  })
  return records[0]
}

/**
 * Crea una capacitación en el programa (tabla legacy).
 *
 * @async
 * @param fields - Campos de la capacitación.
 * @returns Registro Airtable recién creado.
 * @deprecated Usar `crearProgramacion`. Se mantiene para compatibilidad con rutas antiguas.
 */
export async function crearCapacitacion(fields: Partial<CapCapacitacionFields>) {
  const [record] = await createRecords<CapCapacitacionFields>(T_CAPACITACIONES, [{ fields }])
  return record
}

/**
 * Actualiza una capacitación (tabla legacy).
 *
 * @async
 * @param id - ID del registro.
 * @param fields - Campos a actualizar.
 * @returns Registro Airtable actualizado.
 * @deprecated Usar `actualizarProgramacion`. Se mantiene para compatibilidad con rutas antiguas.
 */
export async function actualizarCapacitacion(id: string, fields: Partial<CapCapacitacionFields>) {
  return updateRecord<CapCapacitacionFields>(T_CAPACITACIONES, id, fields)
}

/**
 * Lista la población objetivo de una capacitación (tabla legacy).
 *
 * @async
 * @param capacitacionId - ID de la capacitación padre.
 * @returns Array de segmentaciones de población.
 * @deprecated Tabla `sst_cap_poblacion` sin reemplazo directo en el nuevo modelo.
 */
export async function listarPoblacion(capacitacionId: string) {
  const { records } = await listRecords<CapPoblacionFields>(T_POBLACION, {
    filterByFormula: `{Capacitacion ID}="${capacitacionId}"`,
  })
  return records
}

/**
 * Crea una entrada de población objetivo (tabla legacy).
 *
 * @async
 * @param fields - Campos de la población.
 * @returns Registro Airtable recién creado.
 * @deprecated Tabla `sst_cap_poblacion` sin reemplazo directo en el nuevo modelo.
 */
export async function crearPoblacion(fields: Partial<CapPoblacionFields>) {
  const [record] = await createRecords<CapPoblacionFields>(T_POBLACION, [{ fields }])
  return record
}

/**
 * Lista los registros de asistencia de una capacitación (tabla legacy).
 *
 * @async
 * @param capacitacionId - ID de la capacitación padre.
 * @returns Array de asistencias de la tabla `sst_cap_asistencias` legacy.
 * @deprecated Usar `listarAsistenciasRegistro` que trabaja con la tabla actual.
 */
export async function listarAsistencias(capacitacionId: string) {
  const { records } = await listRecords<CapAsistenciaFields>(T_ASISTENCIAS, {
    filterByFormula: `{Capacitacion ID}="${capacitacionId}"`,
  })
  return records
}

/**
 * Registra una asistencia individual (tabla legacy).
 *
 * @async
 * @param fields - Campos de la asistencia.
 * @returns Registro Airtable recién creado.
 * @deprecated Usar `crearAsistenciaRegistro` que incluye soporte de firma digital.
 */
export async function registrarAsistencia(fields: Partial<CapAsistenciaFields>) {
  const [record] = await createRecords<CapAsistenciaFields>(T_ASISTENCIAS, [{ fields }])
  return record
}

/**
 * Calcula la cobertura global de capacitaciones a partir de la tabla de asistencias legacy.
 *
 * Retorna:
 *  - `cobertura` — % de asistentes que efectivamente asistieron.
 *  - `porCargo` — desglose por cargo del trabajador.
 *
 * @async
 * @returns Objeto con totales agrupados y porcentaje de cobertura global.
 * @deprecated Usar `calcularIndicadoresTrimestre` que calcula indicadores según Res. 0312.
 */
export async function coberturaCapacitaciones() {
  const { records: asistencias } = await listRecords<CapAsistenciaFields>(T_ASISTENCIAS)
  const { records: caps } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES)

  const total = asistencias.length
  const asistieron = asistencias.filter(a => a.fields.Asistio).length
  const cobertura = total > 0 ? Math.round((asistieron / total) * 100) : 0

  const porCargo: Record<string, { total: number; asistieron: number }> = {}
  for (const a of asistencias) {
    const cargo = a.fields['Cargo Trabajador'] ?? 'Sin cargo'
    if (!porCargo[cargo]) porCargo[cargo] = { total: 0, asistieron: 0 }
    porCargo[cargo].total++
    if (a.fields.Asistio) porCargo[cargo].asistieron++
  }

  return {
    totalAsistencias: total,
    asistieron,
    cobertura,
    totalCapacitaciones: caps.length,
    realizadas: caps.filter(c => c.fields.Estado === 'realizada').length,
    porCargo,
  }
}

// =============================================================================
// ASISTENCIAS — Firma individual de asistentes
// =============================================================================

/**
 * Lista los registros de asistencia de una sesión específica.
 * Ordenados por nombre del trabajador ascendente.
 *
 * IMPORTANTE: Los campos `firma_encriptada` se devuelven tal como están en Airtable.
 * La capa de API (route.ts) es responsable de omitirlos antes de enviarlos al cliente.
 *
 * @async
 * @param registroId - ID del registro en `sst_cap_registros`.
 * @returns Array de asistencias con todos sus campos, incluyendo `firma_encriptada`.
 */
export async function listarAsistenciasRegistro(registroId: string) {
  const { records } = await listRecords<CapAsistenciaRegistroFields>(T_ASISTENCIAS, {
    filterByFormula: `{registro_id}='${registroId}'`,
    sort: [{ field: 'nombre_trabajador', direction: 'asc' }],
  })
  return records
}

/**
 * Obtiene un único registro de capacitación por su ID.
 * @param id - ID del registro en `sst_cap_registros`.
 */
export async function obtenerRegistro(id: string) {
  return getRecord<CapRegistroFields>(T_REGISTROS, id)
}

/**
 * Registra la asistencia individual de un trabajador a una sesión.
 * El campo `asistio` se establece en `true` por defecto.
 *
 * Se invoca desde dos flujos:
 *  1. Coordinador SST agrega asistente manualmente (requiere auth).
 *  2. Trabajador firma desde página pública con token de 72 horas.
 *
 * Si se provee `firma_encriptada`, debe estar cifrada con AES-256-GCM
 * antes de llamar a esta función (responsabilidad del caller).
 *
 * @async
 * @param fields - Datos del asistente. `registro_id` y `nombre_trabajador` son requeridos.
 * @returns Registro Airtable recién creado.
 */
export async function crearAsistenciaRegistro(
  fields: Omit<CapAsistenciaRegistroFields, 'asistio'> & { asistio?: boolean }
) {
  const payload: CapAsistenciaRegistroFields = {
    asistio: true,
    ...fields,
  }
  const [record] = await createRecords<CapAsistenciaRegistroFields>(T_ASISTENCIAS, [{ fields: payload }])
  return record
}

/**
 * Actualiza parcialmente un registro de asistencia individual.
 * Principalmente usado para agregar nota de evaluación o corregir datos.
 *
 * @async
 * @param id - ID del registro en `sst_cap_asistencias`.
 * @param fields - Campos a actualizar.
 * @returns Registro Airtable actualizado.
 */
export async function actualizarAsistenciaRegistro(
  id: string,
  fields: Partial<CapAsistenciaRegistroFields>
) {
  return updateRecord<CapAsistenciaRegistroFields>(T_ASISTENCIAS, id, fields)
}
