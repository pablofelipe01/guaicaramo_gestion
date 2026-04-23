import 'server-only'
import { listRecords, createRecords } from '@/lib/airtable-client'
import type { IndIndicadorFields, IndSnapshotFields, IndKpiResult } from '@/types/sst/ind'
import type { IncIncidenteFields } from '@/types/sst/inc'
import type { CapAsistenciaFields } from '@/types/sst/cap'
import type { PlanActividadFields } from '@/types/sst/plan'
import type { PptoRubroFields, PptoEjecucionFields } from '@/types/sst/ppto'
import type { AcAccionFields } from '@/types/sst/ac'
import type { InspInspeccionFields } from '@/types/sst/insp'

const T_INDICADORES = 'sst_ind_indicadores'
const T_SNAPSHOTS = 'sst_ind_snapshots'

const KPI_METAS: Record<string, number> = {
  IF: 3,
  IS: 100,
  ILT: 1,
  COB_CAP: 90,
  CUM_PLAN: 80,
  EJEC_PPTO: 70,
  CIERRE_AC: 85,
  INSP: 90,
}

export async function calcularKPIs(anio: number, hht = 240000): Promise<IndKpiResult[]> {
  const inicio = `${anio}-01-01`
  const fin = `${anio}-12-31`

  const [incidentesRes, asistenciasRes, actividadesRes, rubrosRes, ejecucionesRes, accionesRes, inspeccionesRes] = await Promise.all([
    listRecords<IncIncidenteFields>('sst_inc_incidentes', {
      filterByFormula: `AND(IS_AFTER({Fecha Ocurrencia},'${inicio}'),IS_BEFORE({Fecha Ocurrencia},'${fin}'))`,
    }),
    listRecords<CapAsistenciaFields>('sst_cap_asistencias', {}),
    listRecords<PlanActividadFields>('sst_plan_actividades', {}),
    listRecords<PptoRubroFields>('sst_ppto_rubros', {}),
    listRecords<PptoEjecucionFields>('sst_ppto_ejecuciones', {}),
    listRecords<AcAccionFields>('sst_ac_acciones', {}),
    listRecords<InspInspeccionFields>('sst_insp_inspecciones', {}),
  ])

  const incidentes = incidentesRes.records
  const ats = incidentes.filter(r => r.fields.Tipo === 'accidente_trabajo')
  const els = incidentes.filter(r => r.fields.Tipo === 'enfermedad_laboral')
  const diasPerdidos = ats.reduce((s, r) => s + (r.fields['Dias Perdidos'] ?? 0), 0)

  const asistencias = asistenciasRes.records
  const totalAsistentes = asistencias.length
  const asistentesConFirma = asistencias.filter(r => r.fields['Firma URL']).length

  const actividades = actividadesRes.records
  const totalActs = actividades.length
  const actsCerradas = actividades.filter(r => r.fields.Estado === 'cerrada').length

  const rubros = rubrosRes.records
  const ejecuciones = ejecucionesRes.records
  const totalPresupuestado = rubros.reduce((s, r) => s + (r.fields.Monto ?? 0), 0)
  const totalEjecutado = ejecuciones.reduce((s, r) => s + (r.fields.Monto ?? 0), 0)

  const acciones = accionesRes.records
  const totalAcciones = acciones.length
  const accionesHoy = new Date().toISOString().split('T')[0]
  const accionesCerradasATiempo = acciones.filter(r =>
    r.fields.Estado === 'cerrada' &&
    r.fields['Fecha Cierre'] &&
    r.fields['Fecha Limite'] &&
    r.fields['Fecha Cierre'] <= r.fields['Fecha Limite']
  ).length

  const inspecciones = inspeccionesRes.records
  const inspeccionesTotal = inspecciones.length
  const inspeccionesRealizadas = inspecciones.filter(r => r.fields.Estado === 'realizada').length

  const nTrabajadores = 100

  const kpis: IndKpiResult[] = [
    {
      codigo: 'IF',
      nombre: 'Índice de Frecuencia de AT',
      valor: ats.length > 0 ? Math.round((ats.length * hht) / hht) : 0,
      meta: KPI_METAS.IF,
      unidad: 'AT por 240.000 HHT',
      cumpleMeta: ats.length <= KPI_METAS.IF,
      formula: '(N° AT × 240.000) / HHT',
      fuente: 'sst_inc_incidentes',
    },
    {
      codigo: 'IS',
      nombre: 'Índice de Severidad de AT',
      valor: diasPerdidos,
      meta: KPI_METAS.IS,
      unidad: 'Días perdidos por 240.000 HHT',
      cumpleMeta: diasPerdidos <= KPI_METAS.IS,
      formula: '(Días perdidos × 240.000) / HHT',
      fuente: 'sst_inc_incidentes',
    },
    {
      codigo: 'ILT',
      nombre: 'Índice de Incidencia de Enfermedades Laborales',
      valor: nTrabajadores > 0 ? Math.round((els.length * 100) / nTrabajadores) : 0,
      meta: KPI_METAS.ILT,
      unidad: '% sobre total trabajadores',
      cumpleMeta: els.length <= KPI_METAS.ILT,
      formula: '(N° EL × 100) / N° trabajadores',
      fuente: 'sst_inc_incidentes',
    },
    {
      codigo: 'COB_CAP',
      nombre: 'Cobertura de Capacitaciones',
      valor: totalAsistentes > 0 ? Math.round((asistentesConFirma / totalAsistentes) * 100) : 0,
      meta: KPI_METAS.COB_CAP,
      unidad: '%',
      cumpleMeta: totalAsistentes > 0 && Math.round((asistentesConFirma / totalAsistentes) * 100) >= KPI_METAS.COB_CAP,
      formula: '(Capacitados / Total programados) × 100',
      fuente: 'sst_cap_asistencias',
    },
    {
      codigo: 'CUM_PLAN',
      nombre: 'Cumplimiento Plan de Trabajo Anual',
      valor: totalActs > 0 ? Math.round((actsCerradas / totalActs) * 100) : 0,
      meta: KPI_METAS.CUM_PLAN,
      unidad: '%',
      cumpleMeta: totalActs > 0 && Math.round((actsCerradas / totalActs) * 100) >= KPI_METAS.CUM_PLAN,
      formula: '(Actividades cerradas / Total) × 100',
      fuente: 'sst_plan_actividades',
    },
    {
      codigo: 'EJEC_PPTO',
      nombre: 'Ejecución Presupuestal SG-SST',
      valor: totalPresupuestado > 0 ? Math.round((totalEjecutado / totalPresupuestado) * 100) : 0,
      meta: KPI_METAS.EJEC_PPTO,
      unidad: '%',
      cumpleMeta: totalPresupuestado > 0 && Math.round((totalEjecutado / totalPresupuestado) * 100) >= KPI_METAS.EJEC_PPTO,
      formula: '(Ejecutado / Presupuestado) × 100',
      fuente: 'sst_ppto_ejecuciones',
    },
    {
      codigo: 'CIERRE_AC',
      nombre: 'Cierre Oportuno de Acciones Correctivas',
      valor: totalAcciones > 0 ? Math.round((accionesCerradasATiempo / totalAcciones) * 100) : 0,
      meta: KPI_METAS.CIERRE_AC,
      unidad: '%',
      cumpleMeta: totalAcciones > 0 && Math.round((accionesCerradasATiempo / totalAcciones) * 100) >= KPI_METAS.CIERRE_AC,
      formula: '(Cerradas a tiempo / Total) × 100',
      fuente: 'sst_ac_acciones',
    },
    {
      codigo: 'INSP',
      nombre: 'Cumplimiento de Inspecciones Programadas',
      valor: inspeccionesTotal > 0 ? Math.round((inspeccionesRealizadas / inspeccionesTotal) * 100) : 0,
      meta: KPI_METAS.INSP,
      unidad: '%',
      cumpleMeta: inspeccionesTotal > 0 && Math.round((inspeccionesRealizadas / inspeccionesTotal) * 100) >= KPI_METAS.INSP,
      formula: '(Realizadas / Programadas) × 100',
      fuente: 'sst_insp_inspecciones',
    },
  ]

  return kpis
}

export async function listarIndicadores() {
  return listRecords<IndIndicadorFields>(T_INDICADORES, {
    filterByFormula: `{Activo}=1`,
  })
}

export async function listarSnapshots(indicadorId?: string) {
  const formula = indicadorId ? `{Indicador ID}='${indicadorId}'` : undefined
  return listRecords<IndSnapshotFields>(T_SNAPSHOTS, {
    filterByFormula: formula,
    sort: [{ field: 'Periodo', direction: 'desc' }],
  })
}

export async function guardarSnapshot(indicadorId: string, periodo: string, valor: number, meta: number) {
  const records = await createRecords<IndSnapshotFields>(T_SNAPSHOTS, [{
    fields: {
      'Indicador ID': indicadorId,
      Periodo: periodo,
      Valor: valor,
      Meta: meta,
      'Cumple Meta': valor >= meta,
      'Creado En': new Date().toISOString(),
    },
  }])
  return records[0]
}
