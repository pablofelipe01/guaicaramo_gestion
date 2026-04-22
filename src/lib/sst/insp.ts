import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { InspTipoFields, InspChecklistItemFields, InspInspeccionFields, InspHallazgoFields } from '@/types/sst/insp'

const T_TIPOS = 'sst_insp_tipos'
const T_ITEMS = 'sst_insp_checklist_items'
const T_INSPECCIONES = 'sst_insp_inspecciones'
const T_HALLAZGOS = 'sst_insp_hallazgos'

export async function listarTipos() {
  return listRecords<InspTipoFields>(T_TIPOS, { filterByFormula: `{Estado}='activo'` })
}

export async function crearTipo(fields: InspTipoFields) {
  const records = await createRecords<InspTipoFields>(T_TIPOS, [fields])
  return records[0]
}

export async function listarItems(tipoId: string) {
  return listRecords<InspChecklistItemFields>(T_ITEMS, {
    filterByFormula: `{Tipo ID}='${tipoId}'`,
    sort: [{ field: 'Orden', direction: 'asc' }],
  })
}

export async function listarInspecciones(estado?: string) {
  const formula = estado ? `{Estado}='${estado}'` : undefined
  return listRecords<InspInspeccionFields>(T_INSPECCIONES, { filterByFormula: formula, sort: [{ field: 'Fecha Programada', direction: 'desc' }] })
}

export async function crearInspeccion(fields: Omit<InspInspeccionFields, 'Creado En'>) {
  const records = await createRecords<InspInspeccionFields>(T_INSPECCIONES, [
    { ...fields, Estado: 'programada', 'Creado En': new Date().toISOString() },
  ])
  return records[0]
}

export async function actualizarInspeccion(id: string, fields: Partial<InspInspeccionFields>) {
  return updateRecord<InspInspeccionFields>(T_INSPECCIONES, id, fields)
}

export async function listarHallazgos(inspeccionId: string) {
  return listRecords<InspHallazgoFields>(T_HALLAZGOS, { filterByFormula: `{Inspeccion ID}='${inspeccionId}'` })
}

export async function crearHallazgo(fields: Omit<InspHallazgoFields, 'Creado En'>) {
  const records = await createRecords<InspHallazgoFields>(T_HALLAZGOS, [
    { ...fields, Estado: 'abierto', 'Creado En': new Date().toISOString() },
  ])
  return records[0]
}

export async function cerrarHallazgo(id: string) {
  return updateRecord<InspHallazgoFields>(T_HALLAZGOS, id, { Estado: 'cerrado' })
}
