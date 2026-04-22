export interface EvalEvaluacionFields {
  Titulo: string
  Descripcion?: string
  Estado: 'en_progreso' | 'cerrada'
  Nivel?: 'critico' | 'moderado' | 'aceptable'
  'Puntaje Total'?: number
  Responsable: string
  'Fecha Inicio'?: string
  'Fecha Cierre'?: string
  Observaciones?: string
}

export interface EvalEstandarFields {
  Nombre: string
  Codigo: string
  'Ciclo PHVA': 'Planear' | 'Hacer' | 'Verificar' | 'Actuar'
  'Peso Porcentual': number
  Descripcion?: string
  Activo: boolean
}

export interface EvalRespuestaFields {
  'Evaluacion ID': string
  'Estandar ID': string
  'Estandar Nombre': string
  Resultado: 'cumple' | 'parcial' | 'no_cumple' | 'no_aplica'
  'Puntaje Obtenido'?: number
  Observacion?: string
  'URL Evidencia'?: string
  'Respondido Por'?: string
  'Fecha Respuesta'?: string
}
