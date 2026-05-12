/**
 * @file cap-estados.ts
 * @module lib/sst/cap-estados
 *
 * Fuente de verdad de la máquina de estados del módulo Capacitaciones.
 *
 * Reglas:
 *  - `derivarEstadoActividad()` es la única función autorizada para calcular
 *    `estado_general` en Airtable. No replicar esta lógica en otro lugar.
 *  - `derivarAlertaCobertura()` es la única fuente de `alerta_cobertura`.
 *  - Server-only: nunca importar desde Client Components.
 */
import 'server-only'

export type EstadoProgramacion = 'Programado' | 'Ejecutado' | 'Reprogramado' | 'Cancelado'

export type EstadoActividad =
  | 'Sin programar'
  | 'Programado'
  | 'En ejecución'
  | 'Completado'
  | 'Cancelado'

export type AlertaCobertura = 'ok' | 'riesgo' | 'critico' | 'sin_datos'

export interface ProgramacionResumen {
  id: string
  estado: EstadoProgramacion
  fecha_programada: string | null
  fecha_ejecucion: string | null
}

export interface RegistroResumen {
  id: string
  asistentes_presentes: number
  asistentes_convocados: number
  estado_firma: 'pendiente' | 'parcial' | 'completo'
  evaluaciones_aprobadas: number
  evaluaciones_realizadas: number
}

/** Devuelve la fecha de hoy a medianoche local (00:00:00). */
function hoyMidnight(): Date {
  const h = new Date()
  h.setHours(0, 0, 0, 0)
  return h
}

/**
 * Regla 1: Una programación está vencida si su fecha_programada ya pasó
 * y aún está en estado Programado (no ejecutada, no cancelada, no reprogramada).
 */
export function esProgramacionVencida(prog: ProgramacionResumen): boolean {
  if (prog.estado !== 'Programado') return false
  if (!prog.fecha_programada) return false
  return new Date(prog.fecha_programada) < hoyMidnight()
}

/**
 * Regla 2: Días transcurridos desde fecha_programada (>=0 = vencida).
 */
export function diasVencida(prog: ProgramacionResumen): number {
  if (!prog.fecha_programada) return 0
  const diff = Date.now() - new Date(prog.fecha_programada).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Regla 3: Días restantes hasta fecha_programada.
 * Positivo = días que faltan. Negativo = días vencida.
 */
export function diasHastaEjecucion(prog: ProgramacionResumen): number {
  if (!prog.fecha_programada) return Infinity
  const diff = new Date(prog.fecha_programada).getTime() - Date.now()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Regla 4: Estado derivado de la actividad según sus programaciones.
 *
 *   Sin programar  → no tiene ninguna programación
 *   Cancelado      → todas las programaciones están Canceladas
 *   Completado     → al menos una Ejecutada y NINGUNA pendiente (Programado/Reprogramado)
 *   En ejecución   → al menos una Ejecutada y aún quedan pendientes
 *   Programado     → tiene programaciones, ninguna ejecutada todavía
 */
export function derivarEstadoActividad(programaciones: ProgramacionResumen[]): EstadoActividad {
  if (programaciones.length === 0) return 'Sin programar'

  const activas = programaciones.filter(p => p.estado !== 'Cancelado')
  if (activas.length === 0) return 'Cancelado'

  const ejecutadas = activas.filter(p => p.estado === 'Ejecutado')
  const pendientes = activas.filter(p => p.estado === 'Programado' || p.estado === 'Reprogramado')

  if (ejecutadas.length > 0 && pendientes.length === 0) return 'Completado'
  if (ejecutadas.length > 0 && pendientes.length > 0) return 'En ejecución'
  return 'Programado'
}

/**
 * Regla 5: Alerta de cobertura según % de asistencia.
 *   ok        ≥ 80%
 *   riesgo    60–79%
 *   critico   < 60%
 *   sin_datos no hay registros con convocados > 0
 */
export function derivarAlertaCobertura(registros: RegistroResumen[]): AlertaCobertura {
  const conDatos = registros.filter(r => r.asistentes_convocados > 0)
  if (conDatos.length === 0) return 'sin_datos'

  const totalPresentes = conDatos.reduce((s, r) => s + r.asistentes_presentes, 0)
  const totalConvocados = conDatos.reduce((s, r) => s + r.asistentes_convocados, 0)
  const pct = (totalPresentes / totalConvocados) * 100

  if (pct >= 80) return 'ok'
  if (pct >= 60) return 'riesgo'
  return 'critico'
}

/**
 * Regla 6: Semáforo de urgencia individual de una programación.
 *   inmediata  → vencida o vence hoy/mañana
 *   proxima    → vence en 2–7 días
 *   normal     → vence en 8–30 días
 *   lejana     → vence en > 30 días
 *   ejecutada  → ya ejecutada
 *   cancelada  → cancelada
 */
export type NivelUrgencia = 'inmediata' | 'proxima' | 'normal' | 'lejana' | 'ejecutada' | 'cancelada'

export function nivelUrgencia(prog: ProgramacionResumen): NivelUrgencia {
  if (prog.estado === 'Ejecutado') return 'ejecutada'
  if (prog.estado === 'Cancelado') return 'cancelada'
  const dias = diasHastaEjecucion(prog)
  if (dias <= 1) return 'inmediata'
  if (dias <= 7) return 'proxima'
  if (dias <= 30) return 'normal'
  return 'lejana'
}

/**
 * Determina el trimestre colombiano (Q1-Q4) para una fecha dada.
 * Usado para agrupar indicadores por periodo en el módulo Capacitaciones.
 *
 * @param fecha - Fecha de referencia. Por defecto la fecha actual.
 * @returns Identificador del trimestre con año, p.ej. "Q2 2026".
 */
export function obtenerTrimestreActual(fecha: Date = new Date()): string {
  const mes = fecha.getMonth() + 1 // 1-12
  const anio = fecha.getFullYear()
  if (mes <= 3) return `Q1 ${anio}`
  if (mes <= 6) return `Q2 ${anio}`
  if (mes <= 9) return `Q3 ${anio}`
  return `Q4 ${anio}`
}
