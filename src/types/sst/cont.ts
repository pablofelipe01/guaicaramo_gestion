export interface ContContratistaFields {
  'Nombre Empresa': string
  NIT: string
  'Representante Legal'?: string
  Email?: string
  Telefono?: string
  Actividad?: string
  Estado: 'activo' | 'inactivo' | 'suspendido'
  'Fecha Registro'?: string
}

export interface ContContratoFields {
  'Contratista ID': string
  'Contratista Nombre'?: string
  Objeto: string
  'Area Trabajo'?: string
  Supervisor?: string
  'Fecha Inicio': string
  'Fecha Fin': string
  Estado: 'vigente' | 'vencido' | 'terminado'
  'Valor Contrato'?: number
}

export interface ContDocumentoFields {
  'Contratista ID': string
  'Contratista Nombre'?: string
  Tipo: 'arl' | 'eps' | 'pension' | 'sgsst' | 'rut' | 'camara_comercio' | 'otro'
  'Fecha Vencimiento': string
  Estado: 'vigente' | 'proximo_vencer' | 'vencido'
  'URL Documento'?: string
  Observaciones?: string
  'Fecha Carga'?: string
}

export interface ContTrabajadorFields {
  'Contratista ID': string
  'Contratista Nombre'?: string
  'Nombre Completo': string
  Identificacion?: string
  Cargo?: string
  'Induccion Realizada': boolean
  'Fecha Induccion'?: string
  'URL Soporte Induccion'?: string
  Estado: 'activo' | 'inactivo'
}
