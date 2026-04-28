import 'server-only'
import { listRecords, createRecords, updateRecord, getRecord } from '@/lib/airtable-client'
import type { IncIncidenteFields, IncInvestigacionFields } from '@/types/sst/inc'
import { crearAccion } from '@/lib/sst/ac'
import { crearCaso } from '@/lib/sst/caso'

const T_INCIDENTES = 'sst_incidentes'
const T_INVESTIGACIONES = 'sst_inc_investigaciones'

export async function listarIncidentes(tipo?: string) {
  const formula = tipo ? `{Tipo}='${tipo}'` : undefined
  return listRecords<IncIncidenteFields>(T_INCIDENTES, { filterByFormula: formula, sort: [{ field: 'Fecha Ocurrencia', direction: 'desc' }] })
}

export async function crearIncidente(fields: Omit<IncIncidenteFields, 'Creado En'>) {
  const records = await createRecords<IncIncidenteFields>(T_INCIDENTES, [
    { fields: { ...fields, Estado: 'reportado', 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}

export async function actualizarIncidente(id: string, fields: Partial<IncIncidenteFields>) {
  return updateRecord<IncIncidenteFields>(T_INCIDENTES, id, fields)
}

export async function listarInvestigaciones(incidenteId: string) {
  return listRecords<IncInvestigacionFields>(T_INVESTIGACIONES, { filterByFormula: `{Incidente ID}='${incidenteId}'` })
}

export async function crearInvestigacion(fields: Omit<IncInvestigacionFields, 'Creado En'>) {
  const records = await createRecords<IncInvestigacionFields>(T_INVESTIGACIONES, [
    { fields: { ...fields, Estado: 'en_proceso', 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}

export async function actualizarInvestigacion(id: string, fields: Partial<IncInvestigacionFields>) {
  return updateRecord<IncInvestigacionFields>(T_INVESTIGACIONES, id, fields)
}

export async function estadisticasIncidentes(anio: number) {
  const inicio = `${anio}-01-01`
  const fin = `${anio}-12-31`
  const { records: todos } = await listRecords<IncIncidenteFields>(T_INCIDENTES, {
    filterByFormula: `AND(IS_AFTER({Fecha Ocurrencia},'${inicio}'),IS_BEFORE({Fecha Ocurrencia},'${fin}'))`,
  })
  const ats = todos.filter(r => r.fields.Tipo === 'accidente_trabajo')
  const diasPerdidos = ats.reduce((sum, r) => sum + (r.fields['Dias Perdidos'] ?? 0), 0)
  const els = todos.filter(r => r.fields.Tipo === 'enfermedad_laboral')
  return { total: todos.length, accidentesTrabajo: ats.length, enfermedadesLaborales: els.length, diasPerdidos }
}

/**
 * Cierra una investigación y ejecuta las automatizaciones:
 * 1. Crea acciones correctivas por causas básicas / inmediatas encontradas.
 * 2. Si hay incapacidad, crea un caso médico de seguimiento.
 * 3. Marca el incidente como 'cerrado'.
 */
export async function cerrarInvestigacionConAcciones(investigacionId: string): Promise<void> {
  const inv = await getRecord<IncInvestigacionFields>(T_INVESTIGACIONES, investigacionId)
  const invF = inv.fields

  // Obtener datos del incidente asociado
  const incidente = await getRecord<IncIncidenteFields>(T_INCIDENTES, invF['Incidente ID'])
  const incF = incidente.fields

  const esMortal = incF['Dias Perdidos'] != null && incF['Dias Perdidos'] >= 180
  const prioridad = esMortal ? 'critica' : 'alta'
  const diasLimite = esMortal ? 7 : 30
  const fechaLimite = new Date(Date.now() + diasLimite * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Acción por causas inmediatas
  if (invF['Causas Inmediatas']) {
    await crearAccion({
      Titulo: `AT — Causas inmediatas: ${invF['Causas Inmediatas'].slice(0, 60)}`,
      Tipo: 'correctiva',
      Origen: 'investigacion_at',
      'Origen ID': investigacionId,
      Descripcion: `Causas inmediatas del AT/Incidente: ${invF['Causas Inmediatas']} — Trabajador: ${incF['Trabajador Nombre'] ?? incF['Trabajador ID']}`,
      Prioridad: prioridad,
      Estado: 'pendiente',
      'Fecha Limite': fechaLimite,
    })
  }

  // Acción por causas básicas
  if (invF['Causas Basicas']) {
    await crearAccion({
      Titulo: `AT — Causas básicas: ${invF['Causas Basicas'].slice(0, 60)}`,
      Tipo: 'correctiva',
      Origen: 'investigacion_at',
      'Origen ID': investigacionId,
      Descripcion: `Causas básicas del AT/Incidente: ${invF['Causas Basicas']} — Trabajador: ${incF['Trabajador Nombre'] ?? incF['Trabajador ID']}`,
      Prioridad: prioridad,
      Estado: 'pendiente',
      'Fecha Limite': fechaLimite,
    })
  }

  // Crear caso médico si hay incapacidad
  if (incF['Dias Perdidos'] != null && incF['Dias Perdidos'] > 0) {
    await crearCaso({
      'Trabajador ID': incF['Trabajador ID'],
      'Trabajador Nombre': incF['Trabajador Nombre'],
      Tipo: 'incapacidad_prolongada',
      'Fecha Apertura': new Date().toISOString().split('T')[0],
      Estado: 'activo',
      Descripcion: `Incapacidad de ${incF['Dias Perdidos']} días derivada de investigación AT. ${invF.Conclusiones ?? ''}`,
    })
  }

  // Cerrar la investigación y el incidente
  await actualizarInvestigacion(investigacionId, {
    Estado: 'cerrada',
    'Fecha Cierre': new Date().toISOString().split('T')[0],
  })
  await actualizarIncidente(invF['Incidente ID'], { Estado: 'cerrado' })
}
