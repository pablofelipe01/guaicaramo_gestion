export interface EppCatalogoFields {
  Nombre: string
  Tipo: 'epp' | 'dotacion'
  Descripcion?: string
  'Vida Util Meses'?: number
  'Periodicidad Reposicion Meses'?: number
  Estado: 'activo' | 'inactivo'
}

export interface EppInventarioFields {
  'Catalogo ID': string
  'Catalogo Nombre'?: string
  Talla?: string
  Referencia?: string
  Stock: number
  'Stock Minimo'?: number
  'Fecha Actualizacion': string
}

export interface EppEntregaFields {
  'Trabajador ID': string
  'Trabajador Nombre'?: string
  'Catalogo ID': string
  'Catalogo Nombre'?: string
  Motivo: 'ingreso' | 'reposicion' | 'deterioro' | 'perdida' | 'dotacion_periodica'
  Cantidad: number
  Talla?: string
  'Fecha Entrega': string
  'Fecha Vencimiento'?: string
  'Firma URL'?: string
  Observaciones?: string
  'Entregado Por ID'?: string
  'Creado En': string
}
