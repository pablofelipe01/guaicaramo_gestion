import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { CapProgramaFields, CapCapacitacionFields, CapPoblacionFields, CapAsistenciaFields } from '@/types/sst/cap'

const T_PROGRAMAS = 'sst_cap_programas'
const T_CAPACITACIONES = 'sst_cap_capacitaciones'
const T_POBLACION = 'sst_cap_poblacion'
const T_ASISTENCIAS = 'sst_cap_asistencias'

export async function listarProgramas() {
  const { records } = await listRecords<CapProgramaFields>(T_PROGRAMAS, {
    sort: [{ field: 'Año', direction: 'desc' }],
  })
  return records
}

export async function crearPrograma(fields: Partial<CapProgramaFields>) {
  const [record] = await createRecords<CapProgramaFields>(T_PROGRAMAS, [{ fields }])
  return record
}

export async function listarCapacitaciones(programaId?: string) {
  const { records } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES, {
    filterByFormula: programaId ? `{Programa ID}="${programaId}"` : undefined,
    sort: [{ field: 'Fecha Programada', direction: 'asc' }],
  })
  return records
}

export async function obtenerCapacitacion(id: string) {
  const { records } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES, {
    filterByFormula: `RECORD_ID()="${id}"`,
    maxRecords: 1,
  })
  return records[0]
}

export async function crearCapacitacion(fields: Partial<CapCapacitacionFields>) {
  const [record] = await createRecords<CapCapacitacionFields>(T_CAPACITACIONES, [{ fields }])
  return record
}

export async function actualizarCapacitacion(id: string, fields: Partial<CapCapacitacionFields>) {
  return updateRecord<CapCapacitacionFields>(T_CAPACITACIONES, id, fields)
}

export async function listarPoblacion(capacitacionId: string) {
  const { records } = await listRecords<CapPoblacionFields>(T_POBLACION, {
    filterByFormula: `{Capacitacion ID}="${capacitacionId}"`,
  })
  return records
}

export async function crearPoblacion(fields: Partial<CapPoblacionFields>) {
  const [record] = await createRecords<CapPoblacionFields>(T_POBLACION, [{ fields }])
  return record
}

export async function listarAsistencias(capacitacionId: string) {
  const { records } = await listRecords<CapAsistenciaFields>(T_ASISTENCIAS, {
    filterByFormula: `{Capacitacion ID}="${capacitacionId}"`,
  })
  return records
}

export async function registrarAsistencia(fields: Partial<CapAsistenciaFields>) {
  const [record] = await createRecords<CapAsistenciaFields>(T_ASISTENCIAS, [{ fields }])
  return record
}

export async function coberturaCapacitaciones() {
  const { records: asistencias } = await listRecords<CapAsistenciaFields>(T_ASISTENCIAS)
  const { records: caps } = await listRecords<CapCapacitacionFields>(T_CAPACITACIONES)

  const total = asistencias.length
  const asistieron = asistencias.filter(a => a.fields.Asistio).length
  const cobertura = total > 0 ? Math.round((asistieron / total) * 100) : 0

  const porCargo: Record<string, { total: number; asistieron: number }> = {}
  for (const a of asistencias) {
    const cargo = a.fields['Cargo Trabajador'] ?? 'Sin cargo'
    if (!porCargo[cargo]) porCargo[cargo] = { total: 0, asistieron: 0 }
    porCargo[cargo].total++
    if (a.fields.Asistio) porCargo[cargo].asistieron++
  }

  return {
    totalAsistencias: total,
    asistieron,
    cobertura,
    totalCapacitaciones: caps.length,
    realizadas: caps.filter(c => c.fields.Estado === 'realizada').length,
    porCargo,
  }
}
