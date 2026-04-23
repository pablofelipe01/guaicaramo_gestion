export interface IndIndicadorFields {
  Codigo: string
  Nombre: string
  Formula: string
  Meta: number
  Unidad: string
  Frecuencia: 'mensual' | 'trimestral' | 'semestral' | 'anual'
  Activo: boolean
}

export interface IndSnapshotFields {
  'Indicador ID': string
  'Indicador Codigo'?: string
  Periodo: string
  Valor: number
  Meta: number
  'Cumple Meta': boolean
  'Creado En': string
}

export interface IndKpiResult {
  codigo: string
  nombre: string
  valor: number | null
  meta: number
  unidad: string
  cumpleMeta: boolean
  formula: string
  fuente: string
}
