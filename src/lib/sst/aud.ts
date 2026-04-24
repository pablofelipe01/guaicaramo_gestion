import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { AudAuditoriaFields, AudItemFields, AudEvaluacionFields, AudNoConformidadFields } from '@/types/sst/aud'

const T_AUDITORIAS        = 'sst_aud_auditorias'
const T_ITEMS             = 'sst_aud_items'
const T_EVALUACIONES      = 'sst_aud_evaluaciones'
const T_NO_CONFORMIDADES  = 'sst_aud_no_conformidades'

export async function listarAuditorias(tipo?: string) {
  const filter = tipo ? `{Tipo}="${tipo}"` : undefined
  const { records } = await listRecords<AudAuditoriaFields>(T_AUDITORIAS, {
    filterByFormula: filter,
    sort: [{ field: 'Fecha Inicio', direction: 'desc' }],
  })
  return records
}

export async function crearAuditoria(fields: Omit<AudAuditoriaFields, 'Creado En'>) {
  const [record] = await createRecords<AudAuditoriaFields>(T_AUDITORIAS, [
    { fields: { ...fields, 'Creado En': new Date().toISOString() } },
  ])
  return record
}

export async function actualizarAuditoria(id: string, fields: Partial<AudAuditoriaFields>) {
  return updateRecord<AudAuditoriaFields>(T_AUDITORIAS, id, fields)
}

export async function listarItems(auditoriaId: string) {
  const { records } = await listRecords<AudItemFields>(T_ITEMS, {
    filterByFormula: `{Auditoria ID}="${auditoriaId}"`,
    sort: [{ field: 'Orden', direction: 'asc' }],
  })
  return records
}

export async function crearItem(fields: AudItemFields) {
  const [record] = await createRecords<AudItemFields>(T_ITEMS, [{ fields }])
  return record
}

export async function listarEvaluaciones(auditoriaId: string) {
  const { records } = await listRecords<AudEvaluacionFields>(T_EVALUACIONES, {
    filterByFormula: `{Auditoria ID}="${auditoriaId}"`,
  })
  return records
}

export async function registrarEvaluacion(fields: Omit<AudEvaluacionFields, 'Creado En'>) {
  const [record] = await createRecords<AudEvaluacionFields>(T_EVALUACIONES, [
    { fields: { ...fields, 'Creado En': new Date().toISOString() } },
  ])
  return record
}

export async function listarNoConformidades(auditoriaId: string) {
  const { records } = await listRecords<AudNoConformidadFields>(T_NO_CONFORMIDADES, {
    filterByFormula: `{Auditoria ID}="${auditoriaId}"`,
  })
  return records
}

export async function crearNoConformidad(fields: Omit<AudNoConformidadFields, 'Creado En'>) {
  const [record] = await createRecords<AudNoConformidadFields>(T_NO_CONFORMIDADES, [
    { fields: { ...fields, 'Creado En': new Date().toISOString() } },
  ])
  return record
}

export async function estadisticasAuditorias() {
  const { records: auditorias } = await listRecords<AudAuditoriaFields>(T_AUDITORIAS)
  const { records: ncs } = await listRecords<AudNoConformidadFields>(T_NO_CONFORMIDADES)
  return {
    total: auditorias.length,
    planificadas: auditorias.filter(a => a.fields.Estado === 'planificada').length,
    enEjecucion: auditorias.filter(a => a.fields.Estado === 'en_ejecucion').length,
    cerradas: auditorias.filter(a => a.fields.Estado === 'cerrada').length,
    noConformidadesAbiertas: ncs.filter(n => n.fields.Estado === 'abierta').length,
    noConformidadesMayores: ncs.filter(n => n.fields.Tipo === 'mayor').length,
  }
}
