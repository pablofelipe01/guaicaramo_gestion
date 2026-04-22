export interface PermTipoFields {
  Nombre: string
  Descripcion?: string
  'Requiere Aprobacion Gerencia': boolean
  Estado: 'activo' | 'inactivo'
}

export interface PermPermisoFields {
  'Tipo ID': string
  'Tipo Nombre'?: string
  Area: string
  'Tarea Descripcion': string
  'Fecha Inicio': string
  'Fecha Fin': string
  'Solicitante ID'?: string
  'Solicitante Nombre'?: string
  'Coordinador ID'?: string
  'Gerencia ID'?: string
  Estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'en_ejecucion' | 'cerrado' | 'vencido'
  'Motivo Rechazo'?: string
  'Contratista ID'?: string
  Observaciones?: string
  'Creado En': string
}

export interface PermTrabajadorFields {
  'Permiso ID': string
  'Trabajador ID': string
  'Trabajador Nombre'?: string
  'EPPs Verificados': boolean
  'Competencias Verificadas': boolean
  'Restricciones Medicas'?: string
  Habilitado: boolean
}
