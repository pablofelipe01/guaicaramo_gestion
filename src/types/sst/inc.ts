export interface IncIncidenteFields {
  Tipo: 'incidente' | 'accidente_trabajo' | 'enfermedad_laboral'
  'Trabajador ID': string
  'Trabajador Nombre'?: string
  Area?: string
  'Fecha Ocurrencia': string
  'Hora Ocurrencia'?: string
  Descripcion: string
  'Parte Cuerpo Afectada'?: string
  'Dias Perdidos'?: number
  Estado: 'reportado' | 'en_investigacion' | 'cerrado'
  'FURAT URL'?: string
  'Creado En': string
}

export interface IncInvestigacionFields {
  'Incidente ID': string
  Metodologia: 'arbol_causas' | 'cinco_porques' | 'taproot' | 'otro'
  'Causas Inmediatas'?: string
  'Causas Basicas'?: string
  Conclusiones?: string
  'Investigador ID'?: string
  'Investigador Nombre'?: string
  'Fecha Cierre'?: string
  Estado: 'en_proceso' | 'cerrada'
  'Documento URL'?: string
  'Creado En': string
}
