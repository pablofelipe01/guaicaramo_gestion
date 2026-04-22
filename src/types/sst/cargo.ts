export interface CargoPerfilFields {
  'Nombre Cargo': string
  Codigo: string
  Descripcion?: string
  Area: string
  'Nivel Riesgo ARL': '1' | '2' | '3' | '4' | '5'
  Activo: boolean
  'Fecha Creacion'?: string
  'Creado Por'?: string
}

export interface CargoPeligroFields {
  Descripcion: string
  'Cargo ID': string
  'Cargo Nombre': string
  Clasificacion:
    | 'biologico'
    | 'fisico'
    | 'quimico'
    | 'psicosocial'
    | 'biomecanico'
    | 'condiciones_seguridad'
    | 'fenomenos_naturales'
  Fuente?: string
  'Nivel Probabilidad': 'bajo' | 'medio' | 'alto'
}

export interface CargoEppFields {
  'Nombre EPP': string
  'Cargo ID': string
  'Cargo Nombre': string
  Tipo: 'cabeza' | 'ojos_cara' | 'oidos' | 'respiratorio' | 'manos' | 'pies' | 'cuerpo_completo' | 'altura'
  'Frecuencia Reposicion Meses': number
  Obligatorio: boolean
  'Norma Referencia'?: string
}

export interface CargoExamenFields {
  'Tipo Examen': string
  'Cargo ID': string
  'Cargo Nombre': string
  Tipo: 'ingreso' | 'periodico' | 'retiro' | 'post_incapacidad' | 'cambio_cargo'
  'Periodicidad Meses': number
  Descripcion?: string
  Obligatorio: boolean
}
