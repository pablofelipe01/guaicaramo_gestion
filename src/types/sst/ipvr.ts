export interface IpvrRegistroFields {
  Area: string
  'Cargo ID'?: string
  'Proceso Actividad': string
  'Clasificacion Peligro': string
  'Descripcion Peligro': string
  'Efectos Posibles'?: string
  ND: number
  NE: number
  NP: number
  NC: number
  NR: number
  'Nivel Intervencion': 'I' | 'II' | 'III' | 'IV'
  'Controles Existentes'?: string
  'Controles Propuestos'?: string
  'Responsable Control'?: string
  'Fecha Revision': string
  Estado: 'activo' | 'archivado'
  'Creado En': string
}
