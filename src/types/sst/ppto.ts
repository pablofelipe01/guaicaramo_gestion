export interface PptoPresupuestoFields {
  Titulo: string
  'Plan ID'?: string
  'Año': number
  'Total Presupuestado': number
  Estado: 'borrador' | 'aprobado' | 'ejecutando' | 'cerrado'
  Responsable: string
  'Fecha Creacion'?: string
  'Creado Por'?: string
}

export interface PptoRubroFields {
  'Nombre Rubro': string
  'Presupuesto ID': string
  'Presupuesto Titulo'?: string
  Categoria: 'epps' | 'capacitacion' | 'medico' | 'consultoria' | 'infraestructura' | 'otro'
  'Valor Presupuestado': number
  'Valor Ejecutado': number
  Observaciones?: string
}

export interface PptoEjecucionFields {
  Descripcion: string
  'Rubro ID': string
  'Rubro Nombre'?: string
  Valor: number
  Fecha?: string
  Proveedor?: string
  'URL Soporte'?: string
  'Registrado Por'?: string
}
