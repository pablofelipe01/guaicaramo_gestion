import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { CambioFields, CambioAprobacionFields, CambioControlFields } from '@/types/sst/cambio'

const T_CAMBIOS = 'sst_cambio_cambios'
const T_APROBACIONES = 'sst_cambio_aprobaciones'
const T_CONTROLES = 'sst_cambio_controles'

export async function listarCambios() {
  const { records } = await listRecords<CambioFields>(T_CAMBIOS, {
    sort: [{ field: 'Fecha Solicitud', direction: 'desc' }],
  })
  return records
}

export async function obtenerCambio(id: string) {
  const { records } = await listRecords<CambioFields>(T_CAMBIOS, {
    filterByFormula: `RECORD_ID()="${id}"`,
    maxRecords: 1,
  })
  return records[0]
}

export async function crearCambio(fields: Partial<CambioFields>) {
  const [record] = await createRecords<CambioFields>(T_CAMBIOS, [{
    fields: { ...fields, 'Fecha Solicitud': new Date().toISOString().split('T')[0] },
  }])
  return record
}

export async function actualizarCambio(id: string, fields: Partial<CambioFields>) {
  return updateRecord<CambioFields>(T_CAMBIOS, id, fields)
}

export async function listarAprobaciones(cambioId: string) {
  const { records } = await listRecords<CambioAprobacionFields>(T_APROBACIONES, {
    filterByFormula: `{Cambio ID}="${cambioId}"`,
    sort: [{ field: 'Fecha Decision', direction: 'desc' }],
  })
  return records
}

export async function registrarAprobacion(fields: Partial<CambioAprobacionFields>) {
  const [record] = await createRecords<CambioAprobacionFields>(T_APROBACIONES, [{
    fields: { ...fields, 'Fecha Decision': new Date().toISOString().split('T')[0] },
  }])

  // Actualiza el estado del cambio según la decisión
  if (fields['Cambio ID']) {
    const nuevoEstado =
      fields.Decision === 'aprobado' ? 'aprobado' :
      fields.Decision === 'rechazado' ? 'rechazado' : 'en_revision'
    await actualizarCambio(fields['Cambio ID'], { Estado: nuevoEstado })
  }

  return record
}

export async function listarControles(cambioId: string) {
  const { records } = await listRecords<CambioControlFields>(T_CONTROLES, {
    filterByFormula: `{Cambio ID}="${cambioId}"`,
  })
  return records
}

export async function crearControl(fields: Partial<CambioControlFields>) {
  const [record] = await createRecords<CambioControlFields>(T_CONTROLES, [{ fields }])
  return record
}

export async function actualizarControl(id: string, fields: Partial<CambioControlFields>) {
  return updateRecord<CambioControlFields>(T_CONTROLES, id, fields)
}
