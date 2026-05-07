// =============================================================================
// MÓDULO CAPACITACIONES — Tipos TypeScript
// Tabla Airtable principal: sst_cap_*
//
// Arquitectura de datos:
//   CapActividadFields    → sst_cap_actividades   (catálogo anual de temas)
//   CapProgramacionFields → sst_cap_programacion  (calendarización semanal)
//   CapRegistroFields     → sst_cap_registros     (ejecución real de cada sesión)
//   CapAsistenciaRegistroFields → sst_cap_asistencias (firma individual por asistente)
//   CapIndicadorFields    → sst_cap_indicadores   (KPIs trimestrales calculados)
// =============================================================================

// ─── Enumeraciones de dominio ─────────────────────────────────────────────────

/**
 * Categorías temáticas del programa de capacitaciones SST.
 * Determinan el color visual en el cronograma y en las tarjetas.
 */
export type CapCategoria =
  | 'Alturas y espacios confinados'
  | 'Seguridad vial y emergencias'
  | 'Salud y riesgo biológico'
  | 'Riesgos físicos y químicos'
  | 'Psicosocial y bienestar'
  | 'Ergonomía, mecánica y EPI'

/**
 * Proveedor responsable de dictar la capacitación.
 * SST = equipo interno de Seguridad y Salud en el Trabajo de Guaicaramo.
 */
export type CapProveedor =
  | 'Proveedor externo'
  | 'ARL SURA'
  | 'SENA'
  | 'SST'
  | 'Enfermería'
  | 'Bienestar Social'

/**
 * Estado general de una actividad del plan anual.
 * Calculado automáticamente en base al conjunto de sus programaciones
 * (ver `recalcularEstadoActividad` en lib/sst/cap.ts).
 *
 * Transiciones válidas:
 *   Sin programar → Programado → En ejecución → Completado
 *                               ↘ Cancelado
 */
export type CapEstadoGeneral =
  | 'Sin programar'
  | 'Programado'
  | 'En ejecución'
  | 'Completado'
  | 'Cancelado'

/** Meses del año en español, tal como se almacenan en Airtable. */
export type CapMes =
  | 'Enero' | 'Febrero' | 'Marzo' | 'Abril' | 'Mayo' | 'Junio'
  | 'Julio' | 'Agosto' | 'Septiembre' | 'Octubre' | 'Noviembre' | 'Diciembre'

/**
 * Estado de una sesión programada en el cronograma.
 * Ejecutado: la sesión se realizó y existe al menos un CapRegistroFields asociado.
 * Reprogramado: se cambió de fecha pero no se canceló.
 */
export type CapEstadoProgramacion = 'Programado' | 'Ejecutado' | 'Reprogramado' | 'Cancelado'

/** Identificadores de los cuatro trimestres del año operativo 2026. */
export type CapTrimestre = 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026'

// ─── Entidades principales ────────────────────────────────────────────────────

/**
 * Actividad del plan anual de capacitaciones.
 * Tabla: `sst_cap_actividades`
 *
 * Una actividad representa un tema que debe dictarse al menos una vez en el año.
 * El campo `estado_general` es calculado automáticamente — no se edita directamente.
 */
export interface CapActividadFields {
  /** Número secuencial dentro del plan anual. Usado para ordenar y referenciar. */
  item_numero: number
  /** Nombre del tema de la capacitación. */
  tema: string
  /** Descripción del objetivo de aprendizaje. */
  objetivo?: string
  /** Categoría de riesgo SST a la que pertenece el tema. */
  categoria: CapCategoria
  /** Entidad o equipo responsable de dictar la capacitación. */
  proveedor: CapProveedor
  /** Persona responsable de coordinar la actividad dentro de Guaicaramo. */
  responsable: string
  /** Población objetivo: cargo, área o descripción libre. */
  dirigido_a?: string
  /** Año del plan. Por defecto 2026. */
  anio: number
  /** Norma o resolución colombiana que exige esta capacitación (ej. Res. 0312). */
  normativa_aplicable?: string
  /** Indica si el asistente debe recibir un certificado de competencia al finalizar. */
  requiere_certificacion: boolean
  /**
   * Estado calculado automáticamente a partir de las programaciones asociadas.
   * No debe modificarse directamente; usar `recalcularEstadoActividad()`.
   */
  estado_general: CapEstadoGeneral
}

/**
 * Sesión programada en el cronograma para una actividad.
 * Tabla: `sst_cap_programacion`
 *
 * Una actividad puede tener múltiples programaciones (sesiones en distintos meses/semanas).
 * El campo `actividad_tema` es un lookup de Airtable y no puede escribirse directamente.
 */
export interface CapProgramacionFields {
  /** FK → sst_cap_actividades.id */
  actividad_id: string
  /** Lookup de solo lectura: tema de la actividad vinculada. */
  actividad_tema?: string
  /** Mes calendario en que está programada la sesión. */
  mes: CapMes
  /** Semana del mes (1–4 o 1–5 dependiendo del mes). */
  semana: number
  /** Fecha exacta programada (ISO 8601: YYYY-MM-DD). */
  fecha_programada?: string
  /** Fecha real de ejecución. Se llena al crear un CapRegistroFields. */
  fecha_ejecucion?: string
  /** Estado actual de esta sesión en el cronograma. */
  estado: CapEstadoProgramacion
  observaciones?: string
}

/**
 * Registro de ejecución de una sesión de capacitación.
 * Tabla: `sst_cap_registros`
 *
 * Se crea cuando la capacitación se dicta efectivamente.
 * Al crear un registro, el estado de la programación asociada cambia a 'Ejecutado'
 * y el estado de la actividad se recalcula automáticamente.
 *
 * Los campos `actividad_tema` y `fecha_ejecucion` son lookup/computed en Airtable
 * y no pueden escribirse vía API.
 */
export interface CapRegistroFields {
  /** FK opcional → sst_cap_programacion.id. Puede ser null si no estaba programada. */
  programacion_id?: string
  /** FK → sst_cap_actividades.id */
  actividad_id: string
  /** Lookup de solo lectura: tema de la actividad. */
  actividad_tema?: string
  /** Fecha real de ejecución (ISO 8601). No puede ser futura. */
  fecha_ejecucion: string
  /** Duración total de la sesión en horas (puede ser decimal, ej. 1.5). */
  duracion_horas?: number
  /** Lugar físico o virtual donde se realizó. */
  lugar?: string
  /** Nombre del instructor o facilitador de la sesión. */
  facilitador?: string
  /** Total de personas citadas. Se usa como denominador de cobertura. */
  convocados?: number
  /** Total de personas que efectivamente asistieron. No puede superar `convocados`. */
  presentes?: number
  /** Número de evaluaciones de conocimiento aplicadas al finalizar. */
  evaluaciones_realizadas?: number
  /** Número de evaluaciones con nota aprobatoria. No puede superar `evaluaciones_realizadas`. */
  evaluaciones_aprobadas?: number
  observaciones?: string
  /** ID del usuario autenticado que creó el registro. Solo lectura. */
  registrado_por?: string
}

/**
 * KPIs trimestrales del programa de capacitaciones.
 * Tabla: `sst_cap_indicadores`
 *
 * Se calculan y persisten mediante `calcularIndicadoresTrimestre()`.
 * Los porcentajes (pct_*) ya están expresados en enteros 0–100.
 *
 * Indicadores mínimos exigidos por la Resolución 0312 de 2019:
 *   - pct_cumplimiento: (ejecutadas / programadas) × 100
 *   - pct_cobertura:    (presentes / convocados) × 100
 *   - pct_eficacia:     (evaluaciones_aprobadas / evaluaciones_realizadas) × 100
 */
export interface CapIndicadorFields {
  /** Identificador del trimestre al que corresponden los indicadores. */
  trimestre: CapTrimestre
  /** Total de sesiones programadas en el trimestre. */
  programadas: number
  /** Total de sesiones efectivamente ejecutadas. */
  ejecutadas: number
  /** Total de asistentes distintos capacitados (suma de `presentes` de los registros). */
  trabajadores_capacitados: number
  /** Total de asistentes convocados (suma de `convocados`). */
  trabajadores_objetivo: number
  evaluaciones_realizadas: number
  evaluaciones_aprobadas: number
  /** Inducciones a nuevos ingresos realizadas en el período. */
  inducciones_realizadas: number
  /** Número de ingresos de personal en el período (para calcular cobertura de inducción). */
  ingresos_periodo: number
  /** % cumplimiento del cronograma: (ejecutadas / programadas) × 100. */
  pct_cumplimiento: number
  /** % cobertura de asistencia: (presentes / convocados) × 100. */
  pct_cobertura: number
  /** % eficacia de evaluaciones: (aprobadas / realizadas) × 100. */
  pct_eficacia: number
  /** % cobertura de inducción a nuevos ingresos. */
  pct_cobertura_induccion: number
  /** Análisis narrativo libre del coordinador SST para el trimestre. */
  analisis?: string
  /**
   * Semáforo de cumplimiento de la meta del 80%:
   *   Cumple ≥ 80% | En riesgo ≥ 60% | No cumple < 60%
   */
  estado_meta_cumplimiento?: 'Cumple' | 'No cumple' | 'En riesgo'
}

// ─── Asistencia individual con firma digital ──────────────────────────────────

/**
 * Registro de asistencia individual de un trabajador a una sesión.
 * Tabla: `sst_cap_asistencias`
 *
 * Se crea desde dos flujos:
 *  1. Coordinador SST agrega asistente manualmente (POST con auth).
 *  2. Trabajador firma desde su celular vía enlace público con token (POST sin auth).
 *
 * La firma se almacena encriptada con AES-256-GCM y nunca se expone vía API.
 * La respuesta al cliente solo incluye `tiene_firma: boolean`.
 */
export interface CapAsistenciaRegistroFields {
  /** FK → sst_cap_registros.id. Identifica la sesión a la que pertenece esta asistencia. */
  registro_id: string
  /** Nombre completo del asistente. */
  nombre_trabajador: string
  /** Número de documento de identidad del asistente. */
  numero_documento?: string
  /** Número de teléfono de contacto del asistente. */
  telefono?: string
  /** Cargo dentro de la empresa o nombre de la empresa contratista. */
  cargo_empresa?: string
  /** Correo electrónico del asistente (personal externo). */
  correo_externo?: string
  /** Siempre true en el flujo actual. Se reserva false para ausencias justificadas. */
  asistio: boolean
  /**
   * Firma manuscrita digitalizada, cifrada con AES-256-GCM.
   * Formato del ciphertext: `aes256gcm.{iv_b64}.{tag_b64}.{cipher_b64}`
   * Nunca se devuelve en respuestas de la API.
   */
  firma_encriptada?: string
  /**
   * URL pública de la firma en storage externo (S3, GCS).
   * Reservado para uso futuro — actualmente no se utiliza.
   */
  firma_url?: string
  /** Nota numérica de la evaluación de conocimientos (0–100). */
  nota_evaluacion?: number
  /** Fecha en que el trabajador firmó (ISO 8601: YYYY-MM-DD). */
  fecha_firma?: string
}

// =============================================================================
// TIPOS LEGACY — Conservados para compatibilidad con rutas antiguas
// @deprecated Usar CapActividadFields y CapRegistroFields en código nuevo.
// Las tablas sst_cap_programas y sst_cap_capacitaciones serán eliminadas
// en una próxima versión del sistema.
// =============================================================================

/** @deprecated Usar CapActividadFields. Tabla: sst_cap_programas */
export interface CapProgramaFields {
  Titulo: string
  'Año': number
  Responsable: string
  Estado: 'borrador' | 'activo' | 'cerrado'
  Descripcion?: string
  'Creado Por'?: string
  'Fecha Creacion'?: string
}

/** @deprecated Usar CapRegistroFields. Tabla: sst_cap_capacitaciones */
export interface CapCapacitacionFields {
  'Programa ID': string
  'Programa Titulo'?: string
  Tema: string
  Tipo: 'induccion' | 'reinduccion' | 'periodica' | 'especifica'
  Modalidad: 'presencial' | 'virtual' | 'mixta'
  Instructor?: string
  'Fecha Programada'?: string
  'Fecha Realizada'?: string
  Duracion?: number
  Estado: 'programada' | 'realizada' | 'cancelada'
  'URL Material'?: string
  Observaciones?: string
}

/** @deprecated Usar segmentación por cargo/área en CapActividadFields.dirigido_a */
export interface CapPoblacionFields {
  'Capacitacion ID': string
  Tipo: 'cargo' | 'area' | 'todos'
  Valor?: string
}

/** @deprecated Usar CapAsistenciaRegistroFields. */
export interface CapAsistenciaFields {
  'Capacitacion ID': string
  'Capacitacion Tema'?: string
  'Nombre Trabajador': string
  'Cargo Trabajador'?: string
  'Area Trabajador'?: string
  Asistio: boolean
  'Firma URL'?: string
  'Nota Evaluacion'?: number
  'Fecha Registro'?: string
}
