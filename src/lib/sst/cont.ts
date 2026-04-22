import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { ContContratistaFields, ContContratoFields, ContDocumentoFields, ContTrabajadorFields } from '@/types/sst/cont'

const T_CONTRATISTAS = 'sst_cont_contratistas'
const T_CONTRATOS = 'sst_cont_contratos'
const T_DOCUMENTOS = 'sst_cont_documentos'
const T_TRABAJADORES = 'sst_cont_trabajadores'

export async function listarContratistas() {
  const { records } = await listRecords<ContContratistaFields>(T_CONTRATISTAS, {
    filterByFormula: `{Estado}="activo"`,
    sort: [{ field: 'Nombre Empresa', direction: 'asc' }],
  })
  return records
}

export async function crearContratista(fields: Partial<ContContratistaFields>) {
  const [record] = await createRecords<ContContratistaFields>(T_CONTRATISTAS, [{ fields }])
  return record
}

export async function actualizarContratista(id: string, fields: Partial<ContContratistaFields>) {
  return updateRecord<ContContratistaFields>(T_CONTRATISTAS, id, fields)
}

export async function listarContratos(contratistaId: string) {
  const { records } = await listRecords<ContContratoFields>(T_CONTRATOS, {
    filterByFormula: `{Contratista ID}="${contratistaId}"`,
    sort: [{ field: 'Fecha Fin', direction: 'desc' }],
  })
  return records
}

export async function crearContrato(fields: Partial<ContContratoFields>) {
  const [record] = await createRecords<ContContratoFields>(T_CONTRATOS, [{ fields }])
  return record
}

export async function listarDocumentos(contratistaId: string) {
  const { records } = await listRecords<ContDocumentoFields>(T_DOCUMENTOS, {
    filterByFormula: `{Contratista ID}="${contratistaId}"`,
    sort: [{ field: 'Fecha Vencimiento', direction: 'asc' }],
  })
  return records
}

export async function crearDocumento(fields: Partial<ContDocumentoFields>) {
  const hoy = new Date()
  const vencimiento = new Date(fields['Fecha Vencimiento'] ?? '')
  const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86400000)
  const estado: ContDocumentoFields['Estado'] =
    dias < 0 ? 'vencido' : dias <= 30 ? 'proximo_vencer' : 'vigente'
  const [record] = await createRecords<ContDocumentoFields>(T_DOCUMENTOS, [{
    fields: { ...fields, Estado: estado },
  }])
  return record
}

export async function listarTrabajadores(contratistaId: string) {
  const { records } = await listRecords<ContTrabajadorFields>(T_TRABAJADORES, {
    filterByFormula: `AND({Contratista ID}="${contratistaId}",{Estado}="activo")`,
  })
  return records
}

export async function crearTrabajador(fields: Partial<ContTrabajadorFields>) {
  const [record] = await createRecords<ContTrabajadorFields>(T_TRABAJADORES, [{ fields }])
  return record
}

export async function actualizarTrabajador(id: string, fields: Partial<ContTrabajadorFields>) {
  return updateRecord<ContTrabajadorFields>(T_TRABAJADORES, id, fields)
}

export async function semaforoContratista(contratistaId: string) {
  const docs = await listarDocumentos(contratistaId)
  const trabajadores = await listarTrabajadores(contratistaId)

  const vencidos = docs.filter(d => d.fields.Estado === 'vencido')
  const proximosVencer = docs.filter(d => d.fields.Estado === 'proximo_vencer')
  const sinInduccion = trabajadores.filter(t => !t.fields['Induccion Realizada'])

  let color: 'verde' | 'amarillo' | 'rojo' = 'verde'
  if (vencidos.length > 0 || sinInduccion.length > 0) color = 'rojo'
  else if (proximosVencer.length > 0) color = 'amarillo'

  return {
    color,
    vencidos: vencidos.length,
    proximosVencer: proximosVencer.length,
    sinInduccion: sinInduccion.length,
    totalDocumentos: docs.length,
    totalTrabajadores: trabajadores.length,
  }
}

export async function alertasContratistas() {
  const { records: docs } = await listRecords<ContDocumentoFields>(T_DOCUMENTOS, {
    filterByFormula: `OR({Estado}="vencido",{Estado}="proximo_vencer")`,
  })
  return docs
}
