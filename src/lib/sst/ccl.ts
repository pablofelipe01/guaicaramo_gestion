import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { CclComiteFields, CclIntegranteFields, CclReunionFields, CclCompromisoFields, CclCasoFields } from '@/types/sst/ccl'

const T_COMITES = 'sst_ccl_comites'
const T_INTEGRANTES = 'sst_ccl_integrantes'
const T_REUNIONES = 'sst_ccl_reuniones'
const T_COMPROMISOS = 'sst_ccl_compromisos'
const T_CASOS = 'sst_ccl_casos'

export async function obtenerComiteActivo() {
  const { records } = await listRecords<CclComiteFields>(T_COMITES, {
    filterByFormula: `{Estado}="activo"`,
    maxRecords: 1,
  })
  return records[0] ?? null
}

export async function listarComites() {
  const { records } = await listRecords<CclComiteFields>(T_COMITES)
  return records
}

export async function crearComite(fields: Partial<CclComiteFields>) {
  const [record] = await createRecords<CclComiteFields>(T_COMITES, [{ fields }])
  return record
}

export async function listarIntegrantes(comiteId: string) {
  const { records } = await listRecords<CclIntegranteFields>(T_INTEGRANTES, {
    filterByFormula: `{Comite ID}="${comiteId}"`,
  })
  return records
}

export async function crearIntegrante(fields: Partial<CclIntegranteFields>) {
  const [record] = await createRecords<CclIntegranteFields>(T_INTEGRANTES, [{ fields }])
  return record
}

export async function listarReuniones(comiteId?: string) {
  const { records } = await listRecords<CclReunionFields>(T_REUNIONES, {
    filterByFormula: comiteId ? `{Comite ID}="${comiteId}"` : undefined,
    sort: [{ field: 'Fecha', direction: 'desc' }],
  })
  return records
}

export async function crearReunion(fields: Partial<CclReunionFields>) {
  const [record] = await createRecords<CclReunionFields>(T_REUNIONES, [{ fields }])
  return record
}

export async function actualizarReunion(id: string, fields: Partial<CclReunionFields>) {
  return updateRecord<CclReunionFields>(T_REUNIONES, id, fields)
}

export async function listarCompromisos(reunionId: string) {
  const { records } = await listRecords<CclCompromisoFields>(T_COMPROMISOS, {
    filterByFormula: `{Reunion ID}="${reunionId}"`,
  })
  return records
}

export async function crearCompromiso(fields: Partial<CclCompromisoFields>) {
  const [record] = await createRecords<CclCompromisoFields>(T_COMPROMISOS, [{ fields }])
  return record
}

export async function actualizarCompromiso(id: string, fields: Partial<CclCompromisoFields>) {
  return updateRecord<CclCompromisoFields>(T_COMPROMISOS, id, fields)
}

export async function listarCasos(comiteId?: string) {
  const { records } = await listRecords<CclCasoFields>(T_CASOS, {
    filterByFormula: comiteId ? `{Comite ID}="${comiteId}"` : undefined,
    sort: [{ field: 'Fecha Apertura', direction: 'desc' }],
  })
  return records
}

export async function crearCaso(fields: Partial<CclCasoFields>) {
  const [record] = await createRecords<CclCasoFields>(T_CASOS, [{ fields }])
  return record
}

export async function alertasComite() {
  const comite = await obtenerComiteActivo()
  if (!comite) return []
  const fechaFin = new Date(comite.fields['Fecha Fin'])
  const diasRestantes = Math.ceil((fechaFin.getTime() - Date.now()) / 86400000)
  if (diasRestantes <= 30) {
    return [{ comite, diasRestantes }]
  }
  return []
}
