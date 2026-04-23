export interface AcAccionFields {
  Titulo: string
  Descripcion: string
  Tipo: 'correctiva' | 'preventiva' | 'mejora'
  Origen: 'auditoria' | 'inspeccion' | 'investigacion_at' | 'ipvr' | 'otro'
  'Origen ID'?: string
  Prioridad: 'baja' | 'media' | 'alta' | 'critica'
  Estado: 'pendiente' | 'en_proceso' | 'ejecutada' | 'verificada' | 'cerrada' | 'vencida' | 'reabierta'
  'Responsable ID'?: string
  'Responsable Nombre'?: string
  'Fecha Limite': string
  'Fecha Ejecucion'?: string
  'Fecha Verificacion'?: string
  'Fecha Cierre'?: string
  'Verificado Por ID'?: string
  'Verificado Por Nombre'?: string
  'Eficacia Confirmada'?: boolean
  Observaciones?: string
  'Creado En': string
}

export interface AcSeguimientoFields {
  'Accion ID': string
  Nota: string
  'Responsable ID'?: string
  'Responsable Nombre'?: string
  'Creado En': string
}
