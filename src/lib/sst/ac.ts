import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { AcAccionFields, AcSeguimientoFields } from '@/types/sst/ac'

const T_ACCIONES = 'sst_ac_acciones'
const T_SEGUIMIENTOS = 'sst_ac_seguimientos'

export async function listarAcciones(estado?: string, origen?: string) {
  const filters: string[] = []
  if (estado) filters.push(`{Estado}='${estado}'`)
  if (origen) filters.push(`{Origen}='${origen}'`)
  const formula = filters.length === 1 ? filters[0] : filters.length > 1 ? `AND(${filters.join(',')})` : undefined
  return listRecords<AcAccionFields>(T_ACCIONES, {
    filterByFormula: formula,
    sort: [{ field: 'Fecha Limite', direction: 'asc' }],
  })
}

export async function crearAccion(fields: Omit<AcAccionFields, 'Creado En'>) {
  const records = await createRecords<AcAccionFields>(T_ACCIONES, [
    { fields: { ...fields, Estado: 'pendiente', 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}

export async function actualizarAccion(id: string, fields: Partial<AcAccionFields>) {
  return updateRecord<AcAccionFields>(T_ACCIONES, id, fields)
}

export async function ejecutarAccion(id: string) {
  return updateRecord<AcAccionFields>(T_ACCIONES, id, {
    Estado: 'ejecutada',
    'Fecha Ejecucion': new Date().toISOString().split('T')[0],
  })
}

export async function verificarEficacia(id: string, confirmada: boolean, verificadoPorNombre?: string) {
  return updateRecord<AcAccionFields>(T_ACCIONES, id, {
    Estado: confirmada ? 'verificada' : 'reabierta',
    'Fecha Verificacion': new Date().toISOString().split('T')[0],
    'Eficacia Confirmada': confirmada,
    ...(verificadoPorNombre ? { 'Verificado Por Nombre': verificadoPorNombre } : {}),
  })
}

export async function cerrarAccion(id: string) {
  return updateRecord<AcAccionFields>(T_ACCIONES, id, {
    Estado: 'cerrada',
    'Fecha Cierre': new Date().toISOString().split('T')[0],
  })
}

export async function alertasAcciones() {
  const hoy = new Date().toISOString().split('T')[0]
  const en7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { records: vencidas } = await listRecords<AcAccionFields>(T_ACCIONES, {
    filterByFormula: `AND(IS_BEFORE({Fecha Limite},'${hoy}'),OR({Estado}='pendiente',{Estado}='en_proceso',{Estado}='reabierta'))`,
  })
  const { records: proximas } = await listRecords<AcAccionFields>(T_ACCIONES, {
    filterByFormula: `AND(IS_AFTER({Fecha Limite},'${hoy}'),IS_BEFORE({Fecha Limite},'${en7dias}'),OR({Estado}='pendiente',{Estado}='en_proceso',{Estado}='reabierta'))`,
  })
  return { vencidas, proximas }
}

export async function estadisticasAcciones() {
  const { records: todas } = await listRecords<AcAccionFields>(T_ACCIONES, {})
  const total = todas.length
  const porEstado: Record<string, number> = {}
  for (const r of todas) {
    porEstado[r.fields.Estado] = (porEstado[r.fields.Estado] ?? 0) + 1
  }
  const cerradasATiempo = todas.filter(r => {
    if (r.fields.Estado !== 'cerrada' || !r.fields['Fecha Cierre'] || !r.fields['Fecha Limite']) return false
    return r.fields['Fecha Cierre'] <= r.fields['Fecha Limite']
  }).length
  const cerradas = porEstado['cerrada'] ?? 0
  const tasaCierre = total > 0 ? Math.round((cerradas / total) * 100) : 0
  const tasaTiempo = cerradas > 0 ? Math.round((cerradasATiempo / cerradas) * 100) : 0
  return { total, porEstado, cerradasATiempo, tasaCierre, tasaTiempo }
}

export async function listarSeguimientos(accionId: string) {
  return listRecords<AcSeguimientoFields>(T_SEGUIMIENTOS, {
    filterByFormula: `{Accion ID}='${accionId}'`,
    sort: [{ field: 'Creado En', direction: 'desc' }],
  })
}

export async function crearSeguimiento(fields: Omit<AcSeguimientoFields, 'Creado En'>) {
  const records = await createRecords<AcSeguimientoFields>(T_SEGUIMIENTOS, [
    { fields: { ...fields, 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}
