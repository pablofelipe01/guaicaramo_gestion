export interface CclComiteFields {
  Nombre: string
  'Fecha Inicio': string
  'Fecha Fin': string
  Estado: 'activo' | 'vencido' | 'disuelto'
  Observaciones?: string
}

export interface CclIntegranteFields {
  'Comite ID': string
  'Nombre Completo': string
  Rol: 'presidente' | 'secretario' | 'rep_empleador' | 'rep_trabajador' | 'suplente'
  Cargo?: string
  Email?: string
  'Fecha Posesion'?: string
}

export interface CclReunionFields {
  'Comite ID': string
  Tipo: 'ordinaria' | 'extraordinaria'
  Fecha: string
  Lugar?: string
  Estado: 'programada' | 'realizada' | 'cancelada'
  'Acta URL'?: string
  Observaciones?: string
  'Creado Por'?: string
}

export interface CclCompromisoFields {
  'Reunion ID': string
  Descripcion: string
  Responsable: string
  'Fecha Limite': string
  Estado: 'pendiente' | 'cumplido' | 'vencido'
  Observaciones?: string
}

export interface CclCasoFields {
  'Comite ID': string
  Descripcion: string
  Partes: string
  Severidad: 'leve' | 'grave'
  Estado: 'abierto' | 'en_seguimiento' | 'cerrado' | 'derivado'
  'Fecha Reporte': string
  'Fecha Apertura'?: string
  'Fecha Cierre'?: string
  Observaciones?: string
  Confidencial: boolean
  'Registrado Por'?: string
}
