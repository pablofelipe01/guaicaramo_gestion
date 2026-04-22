import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { MedEvaluacionFields } from '@/types/sst/med'
import type { AirtableRecord } from '@/lib/airtable-client'

const T_EVALUACIONES = 'sst_med_evaluaciones'

export async function listarEvaluaciones(trabajadorId?: string) {
  const formula = trabajadorId ? `{Trabajador ID}='${trabajadorId}'` : undefined
  return listRecords<MedEvaluacionFields>(T_EVALUACIONES, { filterByFormula: formula, sort: [{ field: 'Fecha', direction: 'desc' }] })
}

export async function crearEvaluacion(fields: Omit<MedEvaluacionFields, 'Creado En'>) {
  const records = await createRecords<MedEvaluacionFields>(T_EVALUACIONES, [
    { ...fields, 'Creado En': new Date().toISOString() },
  ])
  return records[0]
}

export async function actualizarEvaluacion(id: string, fields: Partial<MedEvaluacionFields>) {
  return updateRecord<MedEvaluacionFields>(T_EVALUACIONES, id, fields)
}

export async function alertasEvaluaciones(): Promise<{ mensaje: string; evaluacion: AirtableRecord<MedEvaluacionFields> }[]> {
  const hoy = new Date()
  const limite = new Date(hoy)
  limite.setDate(hoy.getDate() + 30)
  const records = await listRecords<MedEvaluacionFields>(T_EVALUACIONES, {
    filterByFormula: `AND({Proxima Evaluacion}!='', IS_BEFORE({Proxima Evaluacion}, '${limite.toISOString().split('T')[0]}'))`,
  })
  return records.map(r => ({
    mensaje: `Evaluación médica de ${r.fields['Trabajador Nombre'] ?? r.fields['Trabajador ID']} vence el ${r.fields['Proxima Evaluacion']}`,
    evaluacion: r,
  }))
}
