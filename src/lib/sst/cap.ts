import 'server-only'
import { listRecords, createRecords, updateRecord, getRecord } from '@/lib/airtable-client'
import type {
  CapActividadFields,
  CapProgramacionFields,
  CapRegistroFields,
  CapIndicadorFields,
  CapProgramaFields,
  CapCapacitacionFields,
  CapPoblacionFields,
  CapAsistenciaFields,
} from '@/types/sst/cap'

// ─── Tablas nuevas ────────────────────────────────────────────────────────────
const T_ACTIVIDADES    = 'sst_cap_actividades'
const T_PROGRAMACION   = 'sst_cap_programacion'
const T_REGISTROS      = 'sst_cap_registros'
const T_INDICADORES    = 'sst_cap_indicadores'

// ─── Tablas legacy (mantener para compatibilidad con rutas antiguas) ──────────
const T_PROGRAMAS      = 'sst_cap_programas'
const T_CAPACITACIONES = 'sst_cap_capacitaciones'
const T_POBLACION      = 'sst_cap_poblacion'
const T_ASISTENCIAS    = 'sst_cap_asistencias'

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVIDADES — Catálogo del plan anual
// ═══════════════════════════════════════════════════════════════════════════════

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

export async function obtenerActividad(id: string) {
  return getRecord<CapActividadFields>(T_ACTIVIDADES, id)
}

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

export async function actualizarActividad(id: string, fields: Partial<CapActividadFields>) {
  return updateRecord<CapActividadFields>(T_ACTIVIDADES, id, fields)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRAMACIÓN — Calendarización semanal
// ═══════════════════════════════════════════════════════════════════════════════

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

export async function crearProgramacion(fields: Partial<CapProgramacionFields>) {
  const payload: CapProgramacionFields = {
    actividad_id: fields.actividad_id ?? '',
    mes: fields.mes ?? 'Enero',
    semana: fields.semana ?? 1,
    estado: fields.estado ?? 'Programado',
    ...fields,
  }
  const [record] = await createRecords<CapProgramacionFields>(T_PROGRAMACION, [{ fields: payload }])

  // Si la actividad estaba 'Sin programar', actualizar a 'Programado'
  if (fields.actividad_id) {
    try {
      const act = await getRecord<CapActividadFields>(T_ACTIVIDADES, fields.actividad_id)
      if (act.fields.estado_general === 'Sin programar') {
        await updateRecord<CapActividadFields>(T_ACTIVIDADES, fields.actividad_id, { estado_general: 'Programado' })
      }
    } catch { /* actividad no encontrada, continuar */ }
  }
  return record
}

export async function actualizarProgramacion(id: string, fields: Partial<CapProgramacionFields>) {
  return updateRecord<CapProgramacionFields>(T_PROGRAMACION, id, fields)
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTROS — Ejecución y asistencia
// ═══════════════════════════════════════════════════════════════════════════════

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

export async function crearRegistro(fields: Partial<CapRegistroFields>) {
  const payload: CapRegistroFields = {
    actividad_id: fields.actividad_id ?? '',
    fecha_ejecucion: fields.fecha_ejecucion ?? new Date().toISOString().split('T')[0],
    ...fields,
  }
  const [record] = await createRecords<CapRegistroFields>(T_REGISTROS, [{ fields: payload }])

  // Actualizar estado de programación a 'Ejecutado'
  if (fields.programacion_id) {
    await updateRecord<CapProgramacionFields>(T_PROGRAMACION, fields.programacion_id, {
      estado: 'Ejecutado',
      fecha_ejecucion: fields.fecha_ejecucion,
    })
  }

  // Actualizar estado de actividad a 'En ejecución'
  if (fields.actividad_id) {
    await updateRecord<CapActividadFields>(T_ACTIVIDADES, fields.actividad_id, {
      estado_general: 'En ejecución',
    })
  }

  return record
}

export async function actualizarRegistro(id: string, fields: Partial<CapRegistroFields>) {
  return updateRecord<CapRegistroFields>(T_REGISTROS, id, fields)
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDICADORES — KPIs trimestrales
// ═══════════════════════════════════════════════════════════════════════════════

export async function listarIndicadores() {
  const { records } = await listRecords<CapIndicadorFields>(T_INDICADORES, {
    sort: [{ field: 'trimestre', direction: 'asc' }],
  })
  return records
}

export async function obtenerIndicadorPorTrimestre(trimestre: string) {
  const { records } = await listRecords<CapIndicadorFields>(T_INDICADORES, {
    filterByFormula: `{trimestre}='${trimestre}'`,
    maxRecords: 1,
  })
  return records[0] ?? null
}

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

  for (const actId of actividadesIds) {
    const registros = await listarRegistros({ actividadId: actId })
    for (const reg of registros) {
      totalConvocados += reg.fields.asistentes_convocados  ?? 0
      totalPresentes  += reg.fields.asistentes_presentes   ?? 0
      evalRealizadas  += reg.fields.evaluaciones_realizadas ?? 0
      evalAprobadas   += reg.fields.evaluaciones_aprobadas  ?? 0
    }
  }

  const pct_cumplimiento = calcularPct(ejecutadas, programadas)
  const pct_cobertura    = calcularPct(totalPresentes, totalConvocados)
  const pct_eficacia     = calcularPct(evalAprobadas, evalRealizadas)

  const estado_meta_cumplimiento: CapIndicadorFields['estado_meta_cumplimiento'] =
    pct_cumplimiento >= 80 ? 'Cumple' : pct_cumplimiento >= 60 ? 'En riesgo' : 'No cumple'

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

export async function actualizarIndicador(id: string, fields: Partial<CapIndicadorFields>) {
  return updateRecord<CapIndicadorFields>(T_INDICADORES, id, fields)
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function calcularPct(numerador: number, denominador: number): number {
  if (denominador === 0) return 0
  return Math.round((numerador / denominador) * 100)
}

export function getColorEstadoMeta(
  porcentaje: number,
  meta = 80
): 'success' | 'warning' | 'danger' {
  if (porcentaje >= meta) return 'success'
  if (porcentaje >= meta * 0.75) return 'warning'
  return 'danger'
}

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

export const PROVEEDORES_CAP = [
  'Proveedor externo', 'ARL SURA', 'SENA', 'SST', 'Enfermería', 'Bienestar Social', 'SURA',
] as const

export const MESES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export const TRIMESTRES_CAP: CapIndicadorFields['trimestre'][] = [
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
]

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY — funciones para rutas antiguas (sst_cap_programas / sst_cap_capacitaciones)
// ═══════════════════════════════════════════════════════════════════════════════

export async function listarProgramas() {
  const { records } = await listRecords<CapProgramaFields>(T_PROGRAMAS, {
    sort: [{ field: 'Año', direction: 'desc' }],
  })
  return records
}

export async function crearPrograma(fields: Partial<CapProgramaFields>) {
  const [record] = await createRecords<CapProgramaFields>(T_PROGRAMAS, [{ fields }])
  return record
}

export async function listarCapacitaciones(programaId?: string) {
  const { records } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES, {
    filterByFormula: programaId ? `{Programa ID}="${programaId}"` : undefined,
    sort: [{ field: 'Fecha Programada', direction: 'asc' }],
  })
  return records
}

export async function obtenerCapacitacion(id: string) {
  const { records } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES, {
    filterByFormula: `RECORD_ID()="${id}"`,
    maxRecords: 1,
  })
  return records[0]
}

export async function crearCapacitacion(fields: Partial<CapCapacitacionFields>) {
  const [record] = await createRecords<CapCapacitacionFields>(T_CAPACITACIONES, [{ fields }])
  return record
}

export async function actualizarCapacitacion(id: string, fields: Partial<CapCapacitacionFields>) {
  return updateRecord<CapCapacitacionFields>(T_CAPACITACIONES, id, fields)
}

export async function listarPoblacion(capacitacionId: string) {
  const { records } = await listRecords<CapPoblacionFields>(T_POBLACION, {
    filterByFormula: `{Capacitacion ID}="${capacitacionId}"`,
  })
  return records
}

export async function crearPoblacion(fields: Partial<CapPoblacionFields>) {
  const [record] = await createRecords<CapPoblacionFields>(T_POBLACION, [{ fields }])
  return record
}

export async function listarAsistencias(capacitacionId: string) {
  const { records } = await listRecords<CapAsistenciaFields>(T_ASISTENCIAS, {
    filterByFormula: `{Capacitacion ID}="${capacitacionId}"`,
  })
  return records
}

export async function registrarAsistencia(fields: Partial<CapAsistenciaFields>) {
  const [record] = await createRecords<CapAsistenciaFields>(T_ASISTENCIAS, [{ fields }])
  return record
}

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
