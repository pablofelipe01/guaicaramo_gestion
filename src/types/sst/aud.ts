export interface AudAuditoriaFields {
  Titulo: string
  Tipo: 'interna' | 'externa'
  Alcance: string
  'Auditor Nombre': string
  'Fecha Inicio': string
  'Fecha Fin'?: string
  Estado: 'planificada' | 'en_ejecucion' | 'cerrada'
  Observaciones?: string
  'Creado En': string
}

export interface AudItemFields {
  'Auditoria ID': string
  Descripcion: string
  Estandar?: string
  Orden?: number
}

export interface AudEvaluacionFields {
  'Auditoria ID': string
  'Item ID': string
  'Item Descripcion'?: string
  Resultado: 'conforme' | 'no_conforme_mayor' | 'no_conforme_menor' | 'observacion' | 'no_aplica'
  Evidencia?: string
  'Creado En': string
}

export interface AudNoConformidadFields {
  'Auditoria ID': string
  'Evaluacion ID'?: string
  Descripcion: string
  Tipo: 'mayor' | 'menor' | 'observacion'
  'Accion Correctiva ID'?: string
  Estado: 'abierta' | 'cerrada'
  'Creado En': string
}
