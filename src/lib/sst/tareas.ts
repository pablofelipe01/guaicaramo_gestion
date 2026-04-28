import 'server-only'
import { listRecords } from '@/lib/airtable-client'
import type { PlanActividadFields } from '@/types/sst/plan'
import type { InspInspeccionFields } from '@/types/sst/insp'
import type { AudAuditoriaFields } from '@/types/sst/aud'
import type { AcAccionFields } from '@/types/sst/ac'
import type { PermPermisoFields } from '@/types/sst/perm'

export interface TareaDashboard {
  id: string
  descripcion: string
  cicloPhva: 'Planear' | 'Hacer' | 'Verificar' | 'Actuar'
  modulo: string
  enlace: string
  prioridad?: 'baja' | 'media' | 'alta' | 'critica'
  fechaLimite?: string
  estado: string
}

export async function obtenerTareasDashboard(): Promise<TareaDashboard[]> {
  const tareas: TareaDashboard[] = []

  const [actividadesRes, inspeccionesRes, auditoriasRes, accionesRes, permisosRes] = await Promise.all([
    listRecords<PlanActividadFields>('sst_plan_actividades', {
      filterByFormula: `OR({Estado}='pendiente',{Estado}='en_progreso')`,
      sort: [{ field: 'Fecha Limite', direction: 'asc' }],
    }).catch(() => ({ records: [] })),
    listRecords<InspInspeccionFields>('sst_insp_inspecciones', {
      filterByFormula: `{Estado}='programada'`,
      sort: [{ field: 'Fecha Programada', direction: 'asc' }],
    }).catch(() => ({ records: [] })),
    listRecords<AudAuditoriaFields>('sst_aud_auditorias', {
      filterByFormula: `OR({Estado}='planificada',{Estado}='en_ejecucion')`,
    }).catch(() => ({ records: [] })),
    listRecords<AcAccionFields>('sst_ac_acciones', {
      filterByFormula: `OR({Estado}='pendiente',{Estado}='en_proceso',{Estado}='reabierta')`,
      sort: [{ field: 'Fecha Limite', direction: 'asc' }],
    }).catch(() => ({ records: [] })),
    listRecords<PermPermisoFields>('sst_perm_permisos', {
      filterByFormula: `OR({Estado}='borrador',{Estado}='pendiente_aprobacion')`,
    }).catch(() => ({ records: [] })),
  ])

  for (const r of actividadesRes.records.slice(0, 5)) {
    tareas.push({
      id: r.id,
      descripcion: r.fields.Descripcion,
      cicloPhva: (r.fields['Ciclo PHVA'] as TareaDashboard['cicloPhva']) ?? 'Planear',
      modulo: 'Plan de Trabajo',
      enlace: '/dashboard/plan-trabajo',
      fechaLimite: r.fields['Fecha Limite'],
      estado: r.fields.Estado,
    })
  }

  for (const r of inspeccionesRes.records.slice(0, 3)) {
    tareas.push({
      id: r.id,
      descripcion: `Inspección: ${r.fields['Tipo Nombre'] ?? r.fields.Area}`,
      cicloPhva: 'Hacer',
      modulo: 'Inspecciones',
      enlace: '/dashboard/inspecciones',
      fechaLimite: r.fields['Fecha Programada'],
      estado: r.fields.Estado,
    })
  }

  for (const r of auditoriasRes.records.slice(0, 3)) {
    tareas.push({
      id: r.id,
      descripcion: `Auditoría: ${r.fields.Titulo}`,
      cicloPhva: 'Verificar',
      modulo: 'Auditorías',
      enlace: '/dashboard/auditorias',
      fechaLimite: r.fields['Fecha Fin'],
      estado: r.fields.Estado,
    })
  }

  for (const r of accionesRes.records.slice(0, 5)) {
    tareas.push({
      id: r.id,
      descripcion: r.fields.Titulo,
      cicloPhva: 'Actuar',
      modulo: 'Acciones Correctivas',
      enlace: '/dashboard/acciones-correctivas',
      prioridad: r.fields.Prioridad,
      fechaLimite: r.fields['Fecha Limite'],
      estado: r.fields.Estado,
    })
  }

  for (const r of permisosRes.records.slice(0, 3)) {
    tareas.push({
      id: r.id,
      descripcion: `Permiso: ${r.fields['Tipo Nombre'] ?? r.fields.Area}`,
      cicloPhva: 'Hacer',
      modulo: 'Permisos de Trabajo',
      enlace: '/dashboard/permisos-trabajo',
      estado: r.fields.Estado,
    })
  }

  return tareas
}
