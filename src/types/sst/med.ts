export interface MedEvaluacionFields {
  'Trabajador ID': string
  'Trabajador Nombre'?: string
  'Cargo ID'?: string
  Tipo: 'ingreso' | 'periodico' | 'retiro' | 'post_incapacidad' | 'cambio_cargo'
  Fecha: string
  'Medico Nombre'?: string
  'IPS Nombre'?: string
  Aptitud: 'apto' | 'apto_con_restricciones' | 'no_apto'
  Restricciones?: string
  Diagnostico?: string
  'Proxima Evaluacion'?: string
  Observaciones?: string
  'Documento URL'?: string
  'Creado En': string
}
