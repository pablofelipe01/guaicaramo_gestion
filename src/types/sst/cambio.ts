export interface CambioFields {
  Titulo: string
  Descripcion: string
  Tipo: 'organizacional' | 'tecnologico' | 'proceso' | 'infraestructura' | 'otro'
  Estado: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'implementado'
  'Requiere Analisis Riesgo': boolean
  Solicitante: string
  'Fecha Solicitud'?: string
  'Fecha Implementacion'?: string
  Justificacion?: string
  'Area Afectada'?: string
}

export interface CambioAprobacionFields {
  'Cambio ID': string
  'Cambio Titulo'?: string
  Decision: 'aprobado' | 'rechazado' | 'devuelto'
  Rol: 'coordinador_sst' | 'gerencia'
  Aprobador: string
  Observaciones?: string
  'Fecha Decision'?: string
}

export interface CambioControlFields {
  'Cambio ID': string
  'Cambio Titulo'?: string
  Descripcion: string
  Tipo: 'eliminacion' | 'sustitucion' | 'control_ingenieria' | 'administrativo' | 'epp'
  Estado: 'pendiente' | 'implementado' | 'verificado'
  Responsable: string
  'Fecha Limite'?: string
  'Evidencia URL'?: string
  Observaciones?: string
}
