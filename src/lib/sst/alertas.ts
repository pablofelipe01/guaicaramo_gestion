import 'server-only'
import { alertasVencimiento as eppAlertas } from '@/lib/sst/epp'
import { alertasAcciones } from '@/lib/sst/ac'
import { alertasEvaluaciones } from '@/lib/sst/med'
import { listarContratistas } from '@/lib/sst/cont'

export interface AlertaDashboard {
  tipo: 'critica' | 'alta' | 'media'
  categoria: 'epp' | 'contratista' | 'accion_correctiva' | 'evaluacion_medica'
  mensaje: string
  enlace: string
  fecha?: string
}

export async function obtenerAlertasDashboard(): Promise<AlertaDashboard[]> {
  const alertas: AlertaDashboard[] = []

  const [epps, acciones, evMedicas, contratistas] = await Promise.all([
    eppAlertas().catch((): Awaited<ReturnType<typeof eppAlertas>> => []),
    alertasAcciones().catch(() => ({ vencidas: [] as Awaited<ReturnType<typeof alertasAcciones>>['vencidas'], proximas: [] as Awaited<ReturnType<typeof alertasAcciones>>['proximas'] })),
    alertasEvaluaciones().catch((): Awaited<ReturnType<typeof alertasEvaluaciones>> => []),
    listarContratistas().catch(() => []),
  ])

  for (const epp of epps) {
    alertas.push({
      tipo: 'alta',
      categoria: 'epp',
      mensaje: epp.mensaje,
      enlace: '/dashboard/epps',
      fecha: epp.entrega.fields['Fecha Vencimiento'],
    })
  }

  for (const ac of acciones.vencidas) {
    alertas.push({
      tipo: 'critica',
      categoria: 'accion_correctiva',
      mensaje: `Acción vencida: ${ac.fields.Titulo}`,
      enlace: '/dashboard/acciones-correctivas',
      fecha: ac.fields['Fecha Limite'],
    })
  }

  for (const ac of acciones.proximas) {
    alertas.push({
      tipo: 'alta',
      categoria: 'accion_correctiva',
      mensaje: `Próxima a vencer: ${ac.fields.Titulo}`,
      enlace: '/dashboard/acciones-correctivas',
      fecha: ac.fields['Fecha Limite'],
    })
  }

  for (const med of evMedicas) {
    alertas.push({
      tipo: 'media',
      categoria: 'evaluacion_medica',
      mensaje: med.mensaje,
      enlace: '/dashboard/evaluaciones-medicas',
      fecha: med.evaluacion.fields['Proxima Evaluacion'],
    })
  }

  const contratistasRojo = contratistas.filter(
    c => (c.fields as unknown as { Semaforo?: string }).Semaforo === 'rojo'
  )
  for (const c of contratistasRojo) {
    alertas.push({
      tipo: 'critica',
      categoria: 'contratista',
      mensaje: `Contratista semáforo ROJO: ${c.fields['Nombre Empresa']}`,
      enlace: '/dashboard/contratistas',
    })
  }

  const prioridad: Record<AlertaDashboard['tipo'], number> = { critica: 0, alta: 1, media: 2 }
  return alertas.sort((a, b) => prioridad[a.tipo] - prioridad[b.tipo])
}
