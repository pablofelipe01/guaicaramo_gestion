export interface InspTipoFields {
  Nombre: string
  Descripcion?: string
  Periodicidad: 'diaria' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual'
  Estado: 'activo' | 'inactivo'
}

export interface InspChecklistItemFields {
  'Tipo ID': string
  Descripcion: string
  Critico: boolean
  Orden?: number
}

export interface InspInspeccionFields {
  'Tipo ID': string
  'Tipo Nombre'?: string
  Area: string
  'Responsable ID'?: string
  'Responsable Nombre'?: string
  'Fecha Programada': string
  'Fecha Realizada'?: string
  Estado: 'programada' | 'realizada' | 'cancelada'
  Observaciones?: string
  'Creado En': string
}

export interface InspHallazgoFields {
  'Inspeccion ID': string
  'Item ID'?: string
  Descripcion: string
  Criticidad: 'baja' | 'media' | 'alta' | 'critica'
  'Foto URL'?: string
  'Responsable Cierre ID'?: string
  'Responsable Cierre Nombre'?: string
  'Fecha Limite'?: string
  Estado: 'abierto' | 'cerrado'
  'Accion Correctiva ID'?: string
  'Creado En': string
}
