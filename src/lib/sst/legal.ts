import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { LegalRequisitoFields, LegalCumplimientoFields } from '@/types/sst/legal'

const T_REQ = 'sst_legal_requisitos'
const T_CUM = 'sst_legal_cumplimientos'

export async function listarRequisitos(soloActivos = true) {
  const { records } = await listRecords<LegalRequisitoFields>(T_REQ, {
    filterByFormula: soloActivos ? 'Activo=1' : undefined,
    sort: [{ field: 'Norma', direction: 'asc' }],
  })
  return records
}

export async function obtenerRequisito(id: string) {
  return getRecord<LegalRequisitoFields>(T_REQ, id)
}

export async function crearRequisito(fields: LegalRequisitoFields) {
  const [record] = await createRecords<LegalRequisitoFields>(T_REQ, [{ fields: { ...fields, Activo: true } }])
  return record
}

export async function actualizarRequisito(id: string, fields: Partial<LegalRequisitoFields>) {
  return updateRecord<LegalRequisitoFields>(T_REQ, id, fields)
}

export async function listarCumplimientos(requisitoId?: string) {
  const filter = requisitoId ? `{Requisito ID}="${requisitoId}"` : undefined
  const { records } = await listRecords<LegalCumplimientoFields>(T_CUM, {
    filterByFormula: filter,
    sort: [{ field: 'Fecha Revision', direction: 'desc' }],
  })
  return records
}

export async function crearCumplimiento(fields: Omit<LegalCumplimientoFields, 'Fecha Creacion'>) {
  const [record] = await createRecords<LegalCumplimientoFields>(T_CUM, [{
    fields: { ...fields, 'Fecha Creacion': new Date().toISOString().split('T')[0] },
  }])
  return record
}

export async function actualizarCumplimiento(id: string, fields: Partial<LegalCumplimientoFields>) {
  return updateRecord<LegalCumplimientoFields>(T_CUM, id, fields)
}

export async function alertasLegal() {
  const today = new Date().toISOString().split('T')[0]
  const { records } = await listRecords<LegalCumplimientoFields>(T_CUM, {
    filterByFormula: `AND({Estado}!="no_aplica",{Proxima Revision}<="${today}")`,
    sort: [{ field: 'Proxima Revision', direction: 'asc' }],
  })
  return records
}

export async function resumenCumplimiento() {
  const cumplimientos = await listarCumplimientos()
  const total = cumplimientos.length
  const porEstado = {
    cumple: cumplimientos.filter(c => c.fields.Estado === 'cumple').length,
    parcial: cumplimientos.filter(c => c.fields.Estado === 'parcial').length,
    no_cumple: cumplimientos.filter(c => c.fields.Estado === 'no_cumple').length,
    en_proceso: cumplimientos.filter(c => c.fields.Estado === 'en_proceso').length,
  }
  return { total, porEstado }
}
