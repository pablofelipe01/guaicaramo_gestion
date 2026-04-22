export interface CasoCasoFields {
  'Trabajador ID': string
  'Trabajador Nombre'?: string
  Tipo: 'restriccion' | 'reubicacion' | 'calificacion_el' | 'incapacidad_prolongada'
  Estado: 'activo' | 'cerrado'
  'Fecha Apertura': string
  'Fecha Cierre'?: string
  Descripcion?: string
  'Coordinador ID'?: string
  'Creado En': string
}

export interface CasoSeguimientoFields {
  'Caso ID': string
  Fecha: string
  Nota: string
  'Autor ID'?: string
  'Autor Nombre'?: string
  'Creado En': string
}

export interface CasoCalificacionFields {
  'Caso ID': string
  Instancia: 'arl' | 'junta_regional' | 'junta_nacional'
  'PCL Porcentaje'?: number
  'Fecha Dictamen'?: string
  Resultado?: string
  'Documento URL'?: string
  'Creado En': string
}
