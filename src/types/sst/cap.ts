export type CapCategoria =
  | 'Alturas y espacios confinados'
  | 'Seguridad vial y emergencias'
  | 'Salud y riesgo biológico'
  | 'Riesgos físicos y químicos'
  | 'Psicosocial y bienestar'
  | 'Ergonomía, mecánica y EPI'

export type CapProveedor =
  | 'Proveedor externo'
  | 'ARL SURA'
  | 'SENA'
  | 'SST'
  | 'Enfermería'
  | 'Bienestar Social'
  | 'SURA'

export type CapEstadoGeneral =
  | 'Sin programar'
  | 'Programado'
  | 'En ejecución'
  | 'Completado'
  | 'Cancelado'

export type CapMes =
  | 'Enero' | 'Febrero' | 'Marzo' | 'Abril' | 'Mayo' | 'Junio'
  | 'Julio' | 'Agosto' | 'Septiembre' | 'Octubre' | 'Noviembre' | 'Diciembre'

export type CapEstadoProgramacion = 'Programado' | 'Ejecutado' | 'Reprogramado' | 'Cancelado'

export type CapTrimestre = 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026'

export interface CapActividadFields {
  item_numero: number
  tema: string
  objetivo?: string
  categoria: CapCategoria
  proveedor: CapProveedor
  responsable: string
  dirigido_a?: string
  anio: number
  normativa_aplicable?: string
  requiere_certificacion: boolean
  estado_general: CapEstadoGeneral
}

export interface CapProgramacionFields {
  actividad_id: string
  actividad_tema?: string
  mes: CapMes
  semana: number
  fecha_programada?: string
  fecha_ejecucion?: string
  estado: CapEstadoProgramacion
  observaciones?: string
}

export interface CapRegistroFields {
  programacion_id?: string
  actividad_id: string
  actividad_tema?: string
  fecha_ejecucion: string
  duracion_horas?: number
  lugar?: string
  facilitador?: string
  asistentes_convocados?: number
  asistentes_presentes?: number
  evaluaciones_realizadas?: number
  evaluaciones_aprobadas?: number
  observaciones?: string
  registrado_por?: string
}

export interface CapIndicadorFields {
  trimestre: CapTrimestre
  programadas: number
  ejecutadas: number
  trabajadores_capacitados: number
  trabajadores_objetivo: number
  evaluaciones_realizadas: number
  evaluaciones_aprobadas: number
  inducciones_realizadas: number
  ingresos_periodo: number
  pct_cumplimiento: number
  pct_cobertura: number
  pct_eficacia: number
  pct_cobertura_induccion: number
  analisis?: string
  estado_meta_cumplimiento?: 'Cumple' | 'No cumple' | 'En riesgo'
}

// Legacy types kept for backward compatibility
export interface CapProgramaFields {
  Titulo: string
  'Año': number
  Responsable: string
  Estado: 'borrador' | 'activo' | 'cerrado'
  Descripcion?: string
  'Creado Por'?: string
  'Fecha Creacion'?: string
}

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

export interface CapPoblacionFields {
  'Capacitacion ID': string
  Tipo: 'cargo' | 'area' | 'todos'
  Valor?: string
}

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
