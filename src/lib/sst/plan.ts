import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { PlanPlanFields, PlanActividadFields } from '@/types/sst/plan'

const T_PLAN = 'sst_plan_planes'
const T_ACT = 'sst_plan_actividades'

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
  const [record] = await createRecords<PlanPlanFields>(T_PLAN, [{
    fields: { ...fields, 'Fecha Creacion': new Date().toISOString().split('T')[0], 'Creado Por': creadoPor },
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
  const [record] = await createRecords<PlanActividadFields>(T_ACT, [{ fields }])
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
