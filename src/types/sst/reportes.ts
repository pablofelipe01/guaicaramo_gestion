/**
 * @file reportes.ts
 * Tipos para la tabla sst_cap_reportes.
 * Historial de reportes de control de asistencia con estado de firmas.
 */

/** Campos de la tabla sst_cap_reportes */
export interface CapReporteFields {
  /** FK → sst_cap_registros.id */
  id_registro: string
  /** FK → sst_cap_actividades.id */
  id_actividad: string
  /** Nombre descriptivo. Ej: "Control Asistencia — EPP — 07/05/2026" */
  nombre_reporte: string
  /** Fecha de generación (YYYY-MM-DD) */
  fecha_generacion: string
  /** Nombre del usuario que generó el PDF */
  generado_por: string
  /** JSON.stringify() de los campos del encabezado del PDF */
  datos_encabezado: string
  /** Número de asistentes al momento de generar */
  total_asistentes: number
  /** Estado según las firmas presentes */
  estado: 'pendiente' | 'parcial' | 'completo'
  /** Firma del capacitador — data URL base64 PNG */
  firma_capacitador?: string
  /** Nombre de quien firmó como capacitador */
  nombre_firmante_cap?: string
  /** Fecha y hora de la firma — "DD/MM/YYYY HH:mm" */
  fecha_firma_cap?: string
  /** Firma del director — data URL base64 PNG */
  firma_director?: string
  /** Nombre de quien firmó como director */
  nombre_firmante_dir?: string
  /** Fecha y hora de la firma — "DD/MM/YYYY HH:mm" */
  fecha_firma_dir?: string
}
