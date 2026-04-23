import 'server-only'
import { listRecords } from '@/lib/airtable-client'
import type { AirtableRecord } from '@/lib/airtable-client'

export interface ModuloBackup {
  modulo: string
  fase: string
  tablas: Record<string, AirtableRecord[]>
}

export interface BackupPayload {
  version: string
  timestamp: string
  base: string
  totalRegistros: number
  modulos: ModuloBackup[]
}

interface ModuloDefinicion {
  modulo: string
  fase: string
  tablas: string[]
}

const MODULOS_BACKUP: ModuloDefinicion[] = [
  {
    modulo: 'Evaluación Inicial',
    fase: 'PLANEAR',
    tablas: ['sst_eval_evaluaciones', 'sst_eval_estandares', 'sst_eval_respuestas'],
  },
  {
    modulo: 'Plan de Trabajo Anual',
    fase: 'PLANEAR',
    tablas: ['sst_plan_planes', 'sst_plan_actividades'],
  },
  {
    modulo: 'Comité de Convivencia',
    fase: 'PLANEAR',
    tablas: ['sst_ccl_comites', 'sst_ccl_integrantes', 'sst_ccl_reuniones', 'sst_ccl_compromisos', 'sst_ccl_casos'],
  },
  {
    modulo: 'Capacitaciones',
    fase: 'PLANEAR',
    tablas: ['sst_cap_programas', 'sst_cap_capacitaciones', 'sst_cap_poblacion', 'sst_cap_asistencias'],
  },
  {
    modulo: 'Presupuesto',
    fase: 'PLANEAR',
    tablas: ['sst_ppto_presupuestos', 'sst_ppto_rubros', 'sst_ppto_ejecuciones'],
  },
  {
    modulo: 'Matriz Legal',
    fase: 'PLANEAR',
    tablas: ['sst_legal_requisitos', 'sst_legal_cumplimientos'],
  },
  {
    modulo: 'Gestión del Cambio',
    fase: 'PLANEAR',
    tablas: ['sst_cambio_cambios', 'sst_cambio_aprobaciones', 'sst_cambio_controles'],
  },
  {
    modulo: 'Conservación Documental',
    fase: 'PLANEAR',
    tablas: ['sst_doc_documentos', 'sst_doc_trd', 'sst_doc_accesos'],
  },
  {
    modulo: 'Contratistas',
    fase: 'PLANEAR',
    tablas: ['sst_cont_contratistas', 'sst_cont_contratos', 'sst_cont_documentos', 'sst_cont_trabajadores'],
  },
  {
    modulo: 'Evaluaciones Médicas',
    fase: 'HACER',
    tablas: ['sst_med_evaluaciones'],
  },
  {
    modulo: 'Perfiles de Cargo',
    fase: 'HACER',
    tablas: ['sst_cargo_perfiles', 'sst_cargo_peligros', 'sst_cargo_epps', 'sst_cargo_examenes'],
  },
  {
    modulo: 'Seguimiento Casos Médicos',
    fase: 'HACER',
    tablas: ['sst_caso_casos', 'sst_caso_seguimientos', 'sst_caso_calificaciones'],
  },
  {
    modulo: 'Investigación de Incidentes',
    fase: 'HACER',
    tablas: ['sst_inc_incidentes', 'sst_inc_investigaciones'],
  },
  {
    modulo: 'Matriz IPVR',
    fase: 'HACER',
    tablas: ['sst_ipvr_registros'],
  },
  {
    modulo: 'Inspecciones',
    fase: 'HACER',
    tablas: ['sst_insp_tipos', 'sst_insp_checklist_items', 'sst_insp_inspecciones', 'sst_insp_respuestas', 'sst_insp_hallazgos'],
  },
  {
    modulo: 'EPPs y Dotación',
    fase: 'HACER',
    tablas: ['sst_epp_catalogo', 'sst_epp_inventario', 'sst_epp_entregas'],
  },
  {
    modulo: 'Permisos de Trabajo',
    fase: 'HACER',
    tablas: ['sst_perm_tipos', 'sst_perm_permisos', 'sst_perm_trabajadores'],
  },
  {
    modulo: 'Indicadores',
    fase: 'VERIFICAR',
    tablas: ['sst_ind_indicadores', 'sst_ind_snapshots'],
  },
  {
    modulo: 'Auditorías',
    fase: 'VERIFICAR',
    tablas: ['sst_aud_auditorias', 'sst_aud_items', 'sst_aud_evaluaciones', 'sst_aud_no_conformidades'],
  },
  {
    modulo: 'Acciones Correctivas',
    fase: 'ACTUAR',
    tablas: ['sst_ac_acciones', 'sst_ac_seguimientos'],
  },
  {
    modulo: 'Usuarios y Roles',
    fase: 'ADMIN',
    tablas: ['Usuarios', 'Roles'],
  },
]

async function fetchAllRecords(tabla: string): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = []
  let offset: string | undefined
  do {
    const res = await listRecords(tabla, { offset })
    all.push(...res.records)
    offset = res.offset
  } while (offset)
  return all
}

export async function generarBackup(modulosFiltro?: string[]): Promise<BackupPayload> {
  const seleccionados = modulosFiltro
    ? MODULOS_BACKUP.filter((m) => modulosFiltro.includes(m.modulo))
    : MODULOS_BACKUP

  let totalRegistros = 0
  const modulos: ModuloBackup[] = []

  for (const def of seleccionados) {
    const tablasData: Record<string, AirtableRecord[]> = {}
    for (const tabla of def.tablas) {
      try {
        const records = await fetchAllRecords(tabla)
        tablasData[tabla] = records
        totalRegistros += records.length
      } catch {
        tablasData[tabla] = []
      }
    }
    modulos.push({ modulo: def.modulo, fase: def.fase, tablas: tablasData })
  }

  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    base: 'GUAICARAMO SG-SST',
    totalRegistros,
    modulos,
  }
}

export function listarModulosDisponibles() {
  return MODULOS_BACKUP.map(({ modulo, fase, tablas }) => ({
    modulo,
    fase,
    cantidadTablas: tablas.length,
  }))
}
