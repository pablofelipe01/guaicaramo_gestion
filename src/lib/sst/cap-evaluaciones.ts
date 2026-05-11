/**
 * @file cap-evaluaciones.ts
 * @module lib/sst/cap-evaluaciones
 *
 * Capa de acceso a datos para el submódulo de Evaluaciones de Eficacia.
 * Tablas Airtable:
 *   sst_cap_plantillas   → plantillas configurables de preguntas (admin)
 *   sst_cap_evaluaciones → evaluaciones completadas por trabajadores
 *   sst_cap_asistencias  → registro de asistencia (se escribe al evaluar)
 *
 * Lógica de calificación (servidor):
 *   - Pregunta 1 (texto abierto): 2.5 pts si no está vacía
 *   - Preguntas 2, 3, 4 (selección): 2.5 pts si respuesta === correcta
 *   - Total máximo: 10.0 pts · Aprueba con ≥ 6.0 pts
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
  CapAsistenciaRegistroFields,
  CapRegistroFields,
  CapActividadFields,
} from '@/types/sst/cap'

// ─── Nombres de tablas ─────────────────────────────────────────────────────────
const T_PLANTILLAS   = 'sst_cap_plantillas'
const T_EVALUACIONES = 'sst_cap_evaluaciones'
const T_ASISTENCIAS  = 'sst_cap_asistencias'
const T_REGISTROS    = 'sst_cap_registros'
const T_ACTIVIDADES  = 'sst_cap_actividades'

/** Umbral de aprobación (según spec: 6.0; el formulario público muestra 7.5 para GH-FO-14). */
const PUNTAJE_APROBACION = 6.0

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
  id_capacitacion?: string
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
  if (filtros?.id_capacitacion)     conditions.push(`{id_capacitacion}='${esc(filtros.id_capacitacion)}'`)

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

// =============================================================================
// FLUJO INTEGRADO — Contexto desde token + guardado automático de asistencia
// =============================================================================

export interface ContextoCapacitacion {
  fecha: string
  tema: string
  nombre_capacitacion: string
  facilitador: string
  entidad: string
  lugar?: string
  id_capacitacion: string   // = sst_cap_registros.id
  actividad_id?: string
}

/**
 * Obtiene el contexto completo de una capacitación a partir del qr_token de la plantilla.
 * Si la plantilla tiene `id_capacitacion`, consulta sst_cap_registros y sst_cap_actividades
 * para pre-rellenar el formulario del trabajador.
 * Retorna null para el contexto si la plantilla no está vinculada a un registro.
 */
export async function obtenerContextoDesdeToken(
  token: string
): Promise<{ plantilla: import('@/lib/airtable-client').AirtableRecord<CapPlantillaFields>; contexto: ContextoCapacitacion | null }> {
  const plantilla = await obtenerPlantillaPorToken(token)
  if (!plantilla) throw new Error('Token de evaluación inválido o plantilla inactiva')

  const idCap = plantilla.fields.id_capacitacion
  if (!idCap) return { plantilla, contexto: null }

  try {
    const registro = await getRecord<CapRegistroFields>(T_REGISTROS, idCap)
    const f = registro.fields

    // Intentar obtener tema desde la actividad (lookup puede estar vacío)
    let tema = f.actividad_tema ?? ''
    if (!tema && f.actividad_id) {
      try {
        const act = await getRecord<CapActividadFields>(T_ACTIVIDADES, f.actividad_id)
        tema = act.fields.tema ?? ''
      } catch { /* continuar con tema vacío */ }
    }

    const contexto: ContextoCapacitacion = {
      fecha:               f.fecha_ejecucion ?? new Date().toISOString().split('T')[0],
      tema:                tema || plantilla.fields.nombre_capacitacion,
      nombre_capacitacion: plantilla.fields.nombre_capacitacion,
      facilitador:         f.facilitador ?? '',
      entidad:             'Guaicaramo',
      lugar:               f.lugar,
      id_capacitacion:     idCap,
      actividad_id:        f.actividad_id,
    }
    return { plantilla, contexto }
  } catch {
    // Si el registro no existe, retornar sin contexto (no bloquear el flujo)
    return { plantilla, contexto: null }
  }
}

// Input para el guardado integrado de evaluación
export interface EvaluacionInput {
  qr_token: string
  nombre_trabajador: string
  area: string
  respuesta_1: string
  respuesta_2: string
  respuesta_3: string
  respuesta_4: string
  firma_base64: string
  // Campos opcionales que el trabajador puede editar si no hay contexto preloaded
  fecha?: string
  tema?: string
  nombre_capacitacion?: string
  nombre_capacitador?: string
  entidad?: string
}

/**
 * Flujo integrado:
 * 1. Obtiene plantilla + contexto de capacitación por token
 * 2. Auto-completa campos desde el registro de ejecución
 * 3. Calcula el puntaje en el servidor
 * 4. Guarda la evaluación en sst_cap_evaluaciones
 * 5. Registra la asistencia en sst_cap_asistencias (si hay id_capacitacion)
 * 6. Retorna { record, puntaje, aprobado }
 */
export async function guardarEvaluacionIntegrada(
  data: EvaluacionInput
): Promise<{ record: import('@/lib/airtable-client').AirtableRecord<CapEvaluacionFields>; puntaje: number; aprobado: boolean }> {
  const { plantilla, contexto } = await obtenerContextoDesdeToken(data.qr_token)
  const puntaje = calcularPuntaje(data, plantilla.fields)
  const aprobado = puntaje >= PUNTAJE_APROBACION
  const estado: CapEvaluacionFields['estado'] = aprobado ? 'aprobado' : 'completado'

  const evaluacionFields: CapEvaluacionFields = {
    fecha:               contexto?.fecha               ?? data.fecha ?? new Date().toISOString().split('T')[0],
    tema:                contexto?.tema                ?? data.tema ?? '',
    nombre_capacitacion: contexto?.nombre_capacitacion ?? data.nombre_capacitacion ?? '',
    nombre_trabajador:   data.nombre_trabajador,
    area:                data.area,
    nombre_capacitador:  contexto?.facilitador         ?? data.nombre_capacitador ?? '',
    entidad:             contexto?.entidad             ?? data.entidad ?? 'Guaicaramo',
    respuesta_1:         data.respuesta_1,
    respuesta_2:         data.respuesta_2,
    respuesta_3:         data.respuesta_3,
    respuesta_4:         data.respuesta_4,
    puntaje,
    firma_base64:        data.firma_base64,
    qr_token:            data.qr_token,
    id_plantilla:        plantilla.id,
    estado,
    ...(contexto?.id_capacitacion ? { id_capacitacion: contexto.id_capacitacion } : {}),
  }

  const [record] = await createRecords<CapEvaluacionFields>(T_EVALUACIONES, [{ fields: evaluacionFields }])

  // Registrar asistencia automáticamente si la plantilla está vinculada a un registro
  if (contexto?.id_capacitacion) {
    await registrarAsistenciaDesdeEvaluacion({
      registro_id:       contexto.id_capacitacion,
      nombre_trabajador: data.nombre_trabajador,
      nota_evaluacion:   puntaje,
      fecha_firma:       evaluacionFields.fecha,
    })
  }

  return { record, puntaje, aprobado }
}

/**
 * Crea o actualiza un registro de asistencia en sst_cap_asistencias
 * a partir de una evaluación completada.
 * Si ya existe un registro para el mismo registro_id + nombre_trabajador, no lo duplica.
 */
async function registrarAsistenciaDesdeEvaluacion(data: {
  registro_id: string
  nombre_trabajador: string
  nota_evaluacion: number
  fecha_firma: string
}): Promise<void> {
  const { esc: e } = escUtils()
  // Verificar si ya existe asistencia para evitar duplicados
  const { records: existentes } = await listRecords<CapAsistenciaRegistroFields>(T_ASISTENCIAS, {
    filterByFormula: `AND({registro_id}='${e(data.registro_id)}',{nombre_trabajador}='${e(data.nombre_trabajador)}')`,
    maxRecords: 1,
  })
  if (existentes.length > 0) return  // ya registrado, no duplicar

  await createRecords<CapAsistenciaRegistroFields>(T_ASISTENCIAS, [{
    fields: {
      registro_id:       data.registro_id,
      nombre_trabajador: data.nombre_trabajador,
      asistio:           true,
      nota_evaluacion:   data.nota_evaluacion,
      fecha_firma:       data.fecha_firma,
    },
  }])
}

function escUtils() {
  return {
    esc: (v: string) => v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n]/g, ' '),
  }
}

// =============================================================================
// LISTADO CONSOLIDADO — Evaluaciones + asistentes por registro de ejecución
// =============================================================================

/**
 * Lista evaluaciones filtradas por id_capacitacion (sst_cap_registros.id).
 * Requiere que el campo `id_capacitacion` exista en sst_cap_evaluaciones en Airtable.
 */
export async function listarEvaluacionesPorCapacitacion(registroId: string) {
  const { esc } = escUtils()
  const { records } = await listRecords<CapEvaluacionFields>(T_EVALUACIONES, {
    filterByFormula: `{id_capacitacion}='${esc(registroId)}'`,
    sort: [{ field: 'fecha', direction: 'desc' }],
  })
  return records
}

/**
 * Lista asistencias de un registro de ejecución y enriquece con datos de evaluación.
 * Retorna array con { asistencia, evaluacion? } para mostrar en la vista admin.
 */
export async function listarAsistentesConEvaluacion(registroId: string) {
  const { esc } = escUtils()
  const [{ records: asistencias }, evaluaciones] = await Promise.all([
    listRecords<CapAsistenciaRegistroFields>(T_ASISTENCIAS, {
      filterByFormula: `{registro_id}='${esc(registroId)}'`,
      sort: [{ field: 'nombre_trabajador', direction: 'asc' }],
    }),
    listarEvaluacionesPorCapacitacion(registroId),
  ])

  return asistencias.map(a => {
    const evaluacion = evaluaciones.find(
      ev => ev.fields.nombre_trabajador?.toLowerCase().trim() === a.fields.nombre_trabajador?.toLowerCase().trim()
    ) ?? null
    return { asistencia: a, evaluacion }
  })
}

// =============================================================================
// COBERTURA — Consumido por módulo de Indicadores SST
// =============================================================================

export interface ResultadoCobertura {
  total_asistentes: number
  evaluaron: number
  pct_cobertura: number
  pct_aprobacion: number
  aprobaron: number
}

/**
 * Calcula métricas de cobertura y aprobación de evaluaciones.
 * Si se proporciona `id_capacitacion`, filtra por ese registro específico.
 * Sin filtro, calcula sobre todas las evaluaciones.
 */
export async function obtenerCobertura(filtros?: {
  id_capacitacion?: string
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<ResultadoCobertura> {
  const conditions: string[] = []
  const { esc } = escUtils()
  if (filtros?.id_capacitacion) conditions.push(`{id_capacitacion}='${esc(filtros.id_capacitacion)}'`)
  if (filtros?.fecha_desde)     conditions.push(`{fecha}>='${esc(filtros.fecha_desde)}'`)
  if (filtros?.fecha_hasta)     conditions.push(`{fecha}<='${esc(filtros.fecha_hasta)}'`)

  const formula = conditions.length === 0 ? undefined
    : conditions.length === 1 ? conditions[0]
    : `AND(${conditions.join(',')})`

  const [{ records: evalRecs }, asistRes] = await Promise.all([
    listRecords<CapEvaluacionFields>(T_EVALUACIONES, { filterByFormula: formula }),
    filtros?.id_capacitacion
      ? listRecords<CapAsistenciaRegistroFields>(T_ASISTENCIAS, {
          filterByFormula: `{registro_id}='${esc(filtros.id_capacitacion)}'`,
        })
      : Promise.resolve({ records: [] as import('@/lib/airtable-client').AirtableRecord<CapAsistenciaRegistroFields>[] }),
  ])

  const total_asistentes = asistRes.records.length || evalRecs.length
  const evaluaron = evalRecs.length
  const aprobaron = evalRecs.filter(e => (e.fields.puntaje ?? 0) >= PUNTAJE_APROBACION).length
  const pct_cobertura = total_asistentes > 0 ? Math.round((evaluaron / total_asistentes) * 100) : 0
  const pct_aprobacion = evaluaron > 0 ? Math.round((aprobaron / evaluaron) * 100) : 0

  return { total_asistentes, evaluaron, pct_cobertura, pct_aprobacion, aprobaron }
}
