export interface PlanPlanFields {
  Titulo: string
  'Evaluacion ID'?: string
  'Año': number
  Estado: 'borrador' | 'activo' | 'cerrado'
  Responsable: string
  Descripcion?: string
  'Fecha Creacion'?: string
  'Creado Por'?: string
}

export interface PlanActividadFields {
  Descripcion: string
  'Plan ID': string
  'Plan Titulo'?: string
  Responsable: string
  Mes?: 'Enero' | 'Febrero' | 'Marzo' | 'Abril' | 'Mayo' | 'Junio' | 'Julio' | 'Agosto' | 'Septiembre' | 'Octubre' | 'Noviembre' | 'Diciembre'
  'Ciclo PHVA'?: 'Planear' | 'Hacer' | 'Verificar' | 'Actuar'
  Estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
  'Porcentaje Avance': number
  'Costo Estimado'?: number
  'Fecha Limite'?: string
  Observaciones?: string
}
