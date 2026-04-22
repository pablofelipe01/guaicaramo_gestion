export type ModuloOrigen =
  | 'sst_cargo' | 'sst_eval' | 'sst_plan' | 'sst_ccl' | 'sst_cap'
  | 'sst_ppto' | 'sst_legal' | 'sst_cambio' | 'sst_cont' | 'sst_med'
  | 'sst_caso' | 'sst_inc' | 'sst_ipvr' | 'sst_insp' | 'sst_epp'
  | 'sst_perm' | 'sst_ind' | 'sst_aud' | 'sst_ac'

export interface DocDocumentoFields {
  Nombre: string
  'Modulo Origen': ModuloOrigen
  'Tipo Documental'?: string
  Descripcion?: string
  Version?: string
  'URL Archivo'?: string
  Estado: 'vigente' | 'borrador' | 'obsoleto'
  'Fecha Carga'?: string
  'Cargado Por'?: string
  'Referencia ID'?: string
  Confidencial?: boolean
}

export interface DocTrdFields {
  Serie: string
  Subserie?: string
  'Tipo Documental': string
  Modulo: ModuloOrigen
  Soporte: 'electronico' | 'fisico' | 'ambos'
  'Anos Archivo Gestion': number
  'Anos Archivo Central': number
  'Disposicion Final': 'conservacion_total' | 'eliminacion' | 'seleccion' | 'digitalizacion'
  'Base Legal'?: string
}
