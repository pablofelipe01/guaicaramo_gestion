import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { EvalEvaluacionFields, EvalEstandarFields, EvalRespuestaFields } from '@/types/sst/eval'

const T_EVAL = 'sst_eval_evaluaciones'
const T_EST = 'sst_eval_estandares'
const T_RESP = 'sst_eval_respuestas'

export async function listarEvaluaciones() {
  const { records } = await listRecords<EvalEvaluacionFields>(T_EVAL, {
    sort: [{ field: 'Fecha Inicio', direction: 'desc' }],
  })
  return records
}

export async function obtenerEvaluacion(id: string) {
  return getRecord<EvalEvaluacionFields>(T_EVAL, id)
}

export async function crearEvaluacion(fields: Omit<EvalEvaluacionFields, 'Estado' | 'Puntaje Total' | 'Nivel'>, creadoPor: string) {
  const [record] = await createRecords<EvalEvaluacionFields>(T_EVAL, [{
    fields: {
      ...fields,
      Estado: 'en_progreso',
      'Fecha Inicio': fields['Fecha Inicio'] ?? new Date().toISOString().split('T')[0],
      Responsable: fields.Responsable ?? creadoPor,
    },
  }])
  return record
}

export async function cerrarEvaluacion(id: string) {
  const respuestas = await listarRespuestas(id)
  const estandares = await listarEstandares()
  const mapPeso = Object.fromEntries(estandares.map(e => [e.id, e.fields['Peso Porcentual']]))

  let puntaje = 0
  for (const r of respuestas) {
    const peso = mapPeso[r.fields['Estandar ID']] ?? 0
    if (r.fields.Resultado === 'cumple') puntaje += peso
    else if (r.fields.Resultado === 'parcial') puntaje += peso * 0.5
  }

  const nivel: EvalEvaluacionFields['Nivel'] =
    puntaje < 60 ? 'critico' : puntaje < 85 ? 'moderado' : 'aceptable'

  return updateRecord<EvalEvaluacionFields>(T_EVAL, id, {
    Estado: 'cerrada',
    'Puntaje Total': Math.round(puntaje * 100) / 100,
    Nivel: nivel,
    'Fecha Cierre': new Date().toISOString().split('T')[0],
  })
}

export async function listarEstandares() {
  const { records } = await listRecords<EvalEstandarFields>(T_EST, {
    filterByFormula: 'Activo=1',
    sort: [{ field: 'Codigo', direction: 'asc' }],
  })
  return records
}

export async function crearEstandar(fields: EvalEstandarFields) {
  const [record] = await createRecords<EvalEstandarFields>(T_EST, [{ fields }])
  return record
}

export async function listarRespuestas(evaluacionId: string) {
  const { records } = await listRecords<EvalRespuestaFields>(T_RESP, {
    filterByFormula: `{Evaluacion ID}="${evaluacionId}"`,
  })
  return records
}

export async function guardarRespuesta(fields: EvalRespuestaFields) {
  const existing = await listRecords<EvalRespuestaFields>(T_RESP, {
    filterByFormula: `AND({Evaluacion ID}="${fields['Evaluacion ID']}",{Estandar ID}="${fields['Estandar ID']}")`,
    maxRecords: 1,
  })
  if (existing.records.length > 0) {
    return updateRecord<EvalRespuestaFields>(T_RESP, existing.records[0].id, fields)
  }
  const [record] = await createRecords<EvalRespuestaFields>(T_RESP, [{ fields }])
  return record
}
