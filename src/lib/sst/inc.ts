import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { IncIncidenteFields, IncInvestigacionFields } from '@/types/sst/inc'

const T_INCIDENTES = 'sst_inc_incidentes'
const T_INVESTIGACIONES = 'sst_inc_investigaciones'

export async function listarIncidentes(tipo?: string) {
  const formula = tipo ? `{Tipo}='${tipo}'` : undefined
  return listRecords<IncIncidenteFields>(T_INCIDENTES, { filterByFormula: formula, sort: [{ field: 'Fecha Ocurrencia', direction: 'desc' }] })
}

export async function crearIncidente(fields: Omit<IncIncidenteFields, 'Creado En'>) {
  const records = await createRecords<IncIncidenteFields>(T_INCIDENTES, [
    { fields: { ...fields, Estado: 'reportado', 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}

export async function actualizarIncidente(id: string, fields: Partial<IncIncidenteFields>) {
  return updateRecord<IncIncidenteFields>(T_INCIDENTES, id, fields)
}

export async function listarInvestigaciones(incidenteId: string) {
  return listRecords<IncInvestigacionFields>(T_INVESTIGACIONES, { filterByFormula: `{Incidente ID}='${incidenteId}'` })
}

export async function crearInvestigacion(fields: Omit<IncInvestigacionFields, 'Creado En'>) {
  const records = await createRecords<IncInvestigacionFields>(T_INVESTIGACIONES, [
    { fields: { ...fields, Estado: 'en_proceso', 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}

export async function actualizarInvestigacion(id: string, fields: Partial<IncInvestigacionFields>) {
  return updateRecord<IncInvestigacionFields>(T_INVESTIGACIONES, id, fields)
}

export async function estadisticasIncidentes(anio: number) {
  const inicio = `${anio}-01-01`
  const fin = `${anio}-12-31`
  const { records: todos } = await listRecords<IncIncidenteFields>(T_INCIDENTES, {
    filterByFormula: `AND(IS_AFTER({Fecha Ocurrencia},'${inicio}'),IS_BEFORE({Fecha Ocurrencia},'${fin}'))`,
  })
  const ats = todos.filter(r => r.fields.Tipo === 'accidente_trabajo')
  const diasPerdidos = ats.reduce((sum, r) => sum + (r.fields['Dias Perdidos'] ?? 0), 0)
  const els = todos.filter(r => r.fields.Tipo === 'enfermedad_laboral')
  return { total: todos.length, accidentesTrabajo: ats.length, enfermedadesLaborales: els.length, diasPerdidos }
}
