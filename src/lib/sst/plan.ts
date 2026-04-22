import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { PlanPlanFields, PlanActividadFields } from '@/types/sst/plan'

const T_PLAN = 'sst_plan_planes'
const T_ACT = 'sst_plan_actividades'
const T_EVAL = 'sst_eval_evaluaciones'

/**
 * Validar que una Evaluación existe en sst_eval_evaluaciones
 */
export async function validarEvaluacion(evalId: string): Promise<boolean> {
  if (!evalId) return true
  try {
    const eval_ = await getRecord(T_EVAL, evalId)
    return !!eval_
  } catch {
    return false
  }
}

/**
 * Validar que Responsable es una cadena válida
 */
export function validarResponsable(responsable: string): boolean {
  return responsable?.trim().length > 0
}

export async function listarPlanes() {
  const { records } = await listRecords<PlanPlanFields>(T_PLAN, {
    sort: [{ field: 'Año', direction: 'desc' }],
  })
  return records
}

export async function obtenerPlan(id: string) {
  return getRecord<PlanPlanFields>(T_PLAN, id)
}

export async function crearPlan(fields: Omit<PlanPlanFields, 'Fecha Creacion'>, creadoPor: string) {
  if (!validarResponsable(fields.Responsable)) {
    throw new Error('Responsable es requerido')
  }
  if (fields['Evaluacion ID']) {
    const evalValida = await validarEvaluacion(fields['Evaluacion ID'])
    if (!evalValida) throw new Error('Evaluación no encontrada')
  }
  const [record] = await createRecords<PlanPlanFields>(T_PLAN, [{
    fields: { 
      ...fields, 
      'Fecha Creacion': new Date().toISOString().split('T')[0], 
      'Creado Por': creadoPor,
      Estado: 'borrador'
    },
  }])
  return record
}

export async function actualizarPlan(id: string, fields: Partial<PlanPlanFields>) {
  return updateRecord<PlanPlanFields>(T_PLAN, id, fields)
}

export async function listarActividades(planId: string) {
  const { records } = await listRecords<PlanActividadFields>(T_ACT, {
    filterByFormula: `{Plan ID}="${planId}"`,
    sort: [{ field: 'Mes', direction: 'asc' }],
  })
  return records
}

export async function crearActividad(fields: PlanActividadFields) {
  if (!validarResponsable(fields.Responsable)) {
    throw new Error('Responsable es requerido')
  }
  const plan = await obtenerPlan(fields['Plan ID'])
  if (!plan) {
    throw new Error('Plan no encontrado')
  }
  const [record] = await createRecords<PlanActividadFields>(T_ACT, [{ 
    fields: {
      ...fields,
      Estado: 'pendiente'
    }
  }])
  return record
}

export async function actualizarActividad(id: string, fields: Partial<PlanActividadFields>) {
  return updateRecord<PlanActividadFields>(T_ACT, id, fields)
}

export async function dashboardPlan(planId: string) {
  const actividades = await listarActividades(planId)
  const total = actividades.length
  const completadas = actividades.filter(a => a.fields.Estado === 'completada').length
  const enProgreso = actividades.filter(a => a.fields.Estado === 'en_progreso').length
  const pendientes = actividades.filter(a => a.fields.Estado === 'pendiente').length
  const cumplimiento = total > 0 ? Math.round((completadas / total) * 100) : 0

  const porCiclo = ['Planear', 'Hacer', 'Verificar', 'Actuar'].map(ciclo => ({
    ciclo,
    total: actividades.filter(a => a.fields['Ciclo PHVA'] === ciclo).length,
    completadas: actividades.filter(a => a.fields['Ciclo PHVA'] === ciclo && a.fields.Estado === 'completada').length,
  }))

  const costoTotal = actividades.reduce((s, a) => s + (a.fields['Costo Estimado'] ?? 0), 0)

  return { total, completadas, enProgreso, pendientes, cumplimiento, porCiclo, costoTotal }
}

/**
 * Cerrar un plan e integrar con Indicadores
 */
export async function cerrarPlan(planId: string) {
  const plan = await obtenerPlan(planId)
  if (!plan) throw new Error('Plan no encontrado')
  
  const updated = await actualizarPlan(planId, { Estado: 'cerrado' })
  const metricas = await dashboardPlan(planId)
  
  // TODO: Integración con sst_ind_snapshots cuando Indicadores esté listo
  // await publicarIndicadores(planId, metricas)
  
  return updated
}
