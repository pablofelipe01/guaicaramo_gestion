import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { PptoPresupuestoFields, PptoRubroFields, PptoEjecucionFields } from '@/types/sst/ppto'

const T_PPTO = 'sst_ppto_presupuestos'
const T_RUBROS = 'sst_ppto_rubros'
const T_EJEC = 'sst_ppto_ejecuciones'

export async function listarPresupuestos() {
  const { records } = await listRecords<PptoPresupuestoFields>(T_PPTO, {
    sort: [{ field: 'Año', direction: 'desc' }],
  })
  return records
}

export async function obtenerPresupuesto(id: string) {
  return getRecord<PptoPresupuestoFields>(T_PPTO, id)
}

export async function crearPresupuesto(fields: Omit<PptoPresupuestoFields, 'Fecha Creacion'>, creadoPor: string) {
  const [record] = await createRecords<PptoPresupuestoFields>(T_PPTO, [{
    fields: { ...fields, 'Fecha Creacion': new Date().toISOString().split('T')[0], 'Creado Por': creadoPor },
  }])
  return record
}

export async function actualizarPresupuesto(id: string, fields: Partial<PptoPresupuestoFields>) {
  return updateRecord<PptoPresupuestoFields>(T_PPTO, id, fields)
}

export async function listarRubros(presupuestoId: string) {
  const { records } = await listRecords<PptoRubroFields>(T_RUBROS, {
    filterByFormula: `{Presupuesto ID}="${presupuestoId}"`,
  })
  return records
}

export async function crearRubro(fields: PptoRubroFields) {
  const [record] = await createRecords<PptoRubroFields>(T_RUBROS, [{ fields: { ...fields, 'Valor Ejecutado': 0 } }])
  return record
}

export async function listarEjecuciones(rubroId: string) {
  const { records } = await listRecords<PptoEjecucionFields>(T_EJEC, {
    filterByFormula: `{Rubro ID}="${rubroId}"`,
    sort: [{ field: 'Fecha', direction: 'desc' }],
  })
  return records
}

export async function registrarEjecucion(fields: PptoEjecucionFields, registradoPor: string) {
  const [record] = await createRecords<PptoEjecucionFields>(T_EJEC, [{
    fields: { ...fields, 'Registrado Por': registradoPor, Fecha: fields.Fecha ?? new Date().toISOString().split('T')[0] },
  }])
  // Actualizar valor ejecutado del rubro
  const ejecuciones = await listarEjecuciones(fields['Rubro ID'])
  const totalEjecutado = ejecuciones.reduce((s, e) => s + (e.fields.Valor ?? 0), 0) + fields.Valor
  await updateRecord<PptoRubroFields>(T_RUBROS, fields['Rubro ID'], { 'Valor Ejecutado': totalEjecutado })
  return record
}

export async function alertasPresupuesto(presupuestoId: string) {
  const rubros = await listarRubros(presupuestoId)
  return rubros
    .filter(r => r.fields['Valor Presupuestado'] > 0)
    .map(r => {
      const pct = (r.fields['Valor Ejecutado'] / r.fields['Valor Presupuestado']) * 100
      return {
        id: r.id,
        nombre: r.fields['Nombre Rubro'],
        porcentaje: Math.round(pct),
        alerta: pct > 80 ? 'sobreejecucion' : pct < 50 ? 'subejecucion' : null,
      }
    })
    .filter(r => r.alerta !== null)
}
