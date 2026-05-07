/**
 * @file reportes.ts
 * Operaciones Airtable para la tabla sst_cap_reportes.
 * Historial de reportes de control de asistencia.
 */
import 'server-only'
import { listRecords, getRecord, createRecords, updateRecord } from '@/lib/airtable-client'
import type { AirtableRecord } from '@/lib/airtable-client'
import type { CapReporteFields } from '@/types/sst/reportes'

const T_REPORTES = 'sst_cap_reportes'

/** Crea un nuevo reporte con estado inicial `pendiente`. */
export async function crearReporte(
  fields: Omit<CapReporteFields, 'estado'>
): Promise<AirtableRecord<CapReporteFields>> {
  const [record] = await createRecords<CapReporteFields>(T_REPORTES, [{
    fields: { ...fields, estado: 'pendiente' },
  }])
  return record
}

/** Lista todos los reportes de una actividad, ordenados por fecha descendente. */
export async function listarReportesPorActividad(
  actividadId: string
): Promise<AirtableRecord<CapReporteFields>[]> {
  const { records } = await listRecords<CapReporteFields>(T_REPORTES, {
    filterByFormula: `{id_actividad}="${actividadId}"`,
    sort: [{ field: 'fecha_generacion', direction: 'desc' }],
  })
  return records
}

/** Lista todos los reportes de un registro de ejecución, ordenados por fecha descendente. */
export async function listarReportesPorRegistro(
  registroId: string
): Promise<AirtableRecord<CapReporteFields>[]> {
  const { records } = await listRecords<CapReporteFields>(T_REPORTES, {
    filterByFormula: `{id_registro}="${registroId}"`,
    sort: [{ field: 'fecha_generacion', direction: 'desc' }],
  })
  return records
}

/** Obtiene el detalle completo de un reporte por su ID de Airtable. */
export async function obtenerReporte(
  id: string
): Promise<AirtableRecord<CapReporteFields>> {
  return getRecord<CapReporteFields>(T_REPORTES, id)
}

/**
 * Actualiza campos de firma de un reporte y recalcula su estado.
 * El llamador debe pasar los campos de firma a actualizar;
 * esta función calcula el nuevo estado automáticamente.
 */
export async function actualizarFirmaReporte(
  id: string,
  camposFirma: Partial<Pick<CapReporteFields,
    'firma_capacitador' | 'nombre_firmante_cap' | 'fecha_firma_cap' |
    'firma_director'    | 'nombre_firmante_dir' | 'fecha_firma_dir'>>,
  camposActuales: Partial<CapReporteFields>
): Promise<AirtableRecord<CapReporteFields>> {
  const tieneCap = camposFirma.firma_capacitador ?? camposActuales.firma_capacitador
  const tieneDir = camposFirma.firma_director    ?? camposActuales.firma_director
  const estado: CapReporteFields['estado'] =
    tieneCap && tieneDir ? 'completo' :
    tieneCap || tieneDir ? 'parcial'  : 'pendiente'

  return updateRecord<CapReporteFields>(T_REPORTES, id, { ...camposFirma, estado })
}
