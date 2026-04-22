export interface CapProgramaFields {
  Titulo: string
  'Año': number
  Responsable: string
  Estado: 'borrador' | 'activo' | 'cerrado'
  Descripcion?: string
  'Creado Por'?: string
  'Fecha Creacion'?: string
}

export interface CapCapacitacionFields {
  'Programa ID': string
  'Programa Titulo'?: string
  Tema: string
  Tipo: 'induccion' | 'reinduccion' | 'periodica' | 'especifica'
  Modalidad: 'presencial' | 'virtual' | 'mixta'
  Instructor?: string
  'Fecha Programada'?: string
  'Fecha Realizada'?: string
  Duracion?: number
  Estado: 'programada' | 'realizada' | 'cancelada'
  'URL Material'?: string
  Observaciones?: string
}

export interface CapPoblacionFields {
  'Capacitacion ID': string
  Tipo: 'cargo' | 'area' | 'todos'
  Valor?: string
}

export interface CapAsistenciaFields {
  'Capacitacion ID': string
  'Capacitacion Tema'?: string
  'Nombre Trabajador': string
  'Cargo Trabajador'?: string
  'Area Trabajador'?: string
  Asistio: boolean
  'Firma URL'?: string
  'Nota Evaluacion'?: number
  'Fecha Registro'?: string
}
