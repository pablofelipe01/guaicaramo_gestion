export interface LegalRequisitoFields {
  Norma: string
  Articulo?: string
  Descripcion?: string
  Tipo: 'ley' | 'decreto' | 'resolucion' | 'circular' | 'norma_tecnica'
  Ambito: 'nacional' | 'sectorial' | 'empresa'
  Activo: boolean
  'Fecha Vigencia'?: string
}

export interface LegalCumplimientoFields {
  'Requisito ID': string
  'Requisito Nombre': string
  Estado: 'cumple' | 'parcial' | 'no_cumple' | 'en_proceso' | 'no_aplica'
  Responsable?: string
  'Evidencia URL'?: string
  'Fecha Revision'?: string
  'Proxima Revision'?: string
  Observaciones?: string
  'Fecha Creacion'?: string
}
