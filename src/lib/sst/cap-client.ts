/**
 * @file cap-client.ts
 * @module lib/sst/cap-client
 *
 * Constantes y helpers del módulo Capacitaciones seguros para Client Components.
 *
 * Este archivo NO tiene 'server-only' y puede importarse desde cualquier
 * componente React. Contiene únicamente lógica pura (sin I/O ni acceso a BD).
 *
 * Para operaciones con Airtable, usar `lib/sst/cap.ts` (server-only).
 */

// ─── Catálogos de valores permitidos ─────────────────────────────────────────

/**
 * Categorías temáticas del programa de capacitaciones SST.
 * Fuente de verdad para selects y filtros en el cliente.
 */
export const CATEGORIAS_CAP = [
  'Alturas y espacios confinados',
  'Seguridad vial y emergencias',
  'Salud y riesgo biológico',
  'Riesgos físicos y químicos',
  'Psicosocial y bienestar',
  'Ergonomía, mecánica y EPI',
] as const

/**
 * Proveedores que pueden dictar capacitaciones en Guaicaramo.
 * SST = equipo interno de Seguridad y Salud en el Trabajo.
 */
export const PROVEEDORES_CAP = [
  'Proveedor externo', 'ARL SURA', 'SENA', 'SST', 'Enfermería', 'Bienestar Social',
] as const

/** Meses del año en español, alineados con el tipo `CapMes`. */
export const MESES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

/** Identificadores de los cuatro trimestres del año operativo 2026. */
export const TRIMESTRES_CAP = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'] as const

// ─── Helpers de cálculo ───────────────────────────────────────────────────────

/**
 * Calcula un porcentaje redondeado al entero más cercano.
 * Retorna 0 si el denominador es 0, evitando NaN o Infinity.
 *
 * @param numerador - Valor parcial (ej. ejecutadas).
 * @param denominador - Valor total (ej. programadas).
 * @returns Porcentaje entero entre 0 y 100 (puede superar 100 si hay error de datos).
 */
export function calcularPct(numerador: number, denominador: number): number {
  if (!denominador) return 0
  return Math.round((numerador / denominador) * 100)
}

// ─── Helpers de presentación ──────────────────────────────────────────────────

/**
 * Devuelve el color hexadecimal asociado a una categoría de capacitación.
 * Se usa para el acento visual en tarjetas, cronograma y badges.
 *
 * @param categoria - Nombre exacto de la categoría SST.
 * @returns Color hex. Si la categoría no existe, devuelve el color por defecto `#64748B`.
 */
export function getCategoriaColor(categoria: string): string {
  const colorPorCategoria: Record<string, string> = {
    'Alturas y espacios confinados': '#E85D30',
    'Seguridad vial y emergencias':  '#FF8C42',
    'Salud y riesgo biológico':      '#1D9E75',
    'Riesgos físicos y químicos':    '#3B8BD4',
    'Psicosocial y bienestar':       '#7C3AED',
    'Ergonomía, mecánica y EPI':     '#64748B',
  }
  return colorPorCategoria[categoria] ?? '#64748B'
}

// ─── Estado derivado (cliente) ────────────────────────────────────────────────

export type EstadoActividadCliente =
  | 'Sin programar'
  | 'Programado'
  | 'En ejecución'
  | 'Completado'
  | 'Cancelado'

/**
 * Deriva el estado visual de una actividad a partir de las programaciones
 * ya cargadas en el cliente.
 *
 * Misma lógica que `derivarEstadoActividad` en cap-estados.ts (server-only),
 * duplicada aquí para que los Client Components no dependan de código server.
 *
 * Reglas:
 *   Sin programar → sin programaciones
 *   Cancelado     → todas las programaciones están Canceladas
 *   Completado    → al menos una Ejecutada y ninguna pendiente
 *   En ejecución  → al menos una Ejecutada y aún quedan pendientes
 *   Programado    → hay programaciones, ninguna ejecutada
 */
export function derivarEstadoCliente(
  programaciones: Array<{ estado: string }>
): EstadoActividadCliente {
  if (programaciones.length === 0) return 'Sin programar'

  const activas = programaciones.filter(p => p.estado !== 'Cancelado')
  if (activas.length === 0) return 'Cancelado'

  const ejecutadas = activas.filter(p => p.estado === 'Ejecutado')
  const pendientes = activas.filter(p => p.estado === 'Programado' || p.estado === 'Reprogramado')

  if (ejecutadas.length > 0 && pendientes.length === 0) return 'Completado'
  if (ejecutadas.length > 0 && pendientes.length > 0)  return 'En ejecución'
  return 'Programado'
}

/**
 * Devuelve el color de fondo (con transparencia) asociado a una categoría.
 * Complementa a `getCategoriaColor` para crear chips y etiquetas con relleno suave.
 *
 * @param categoria - Nombre exacto de la categoría SST.
 * @returns Valor CSS `rgba(...)`. Si la categoría no existe, devuelve gris translúcido.
 */
export function getCategoriaBg(categoria: string): string {
  const fondoPorCategoria: Record<string, string> = {
    'Alturas y espacios confinados': 'rgba(232,93,48,0.08)',
    'Seguridad vial y emergencias':  'rgba(255,140,66,0.08)',
    'Salud y riesgo biológico':      'rgba(29,158,117,0.08)',
    'Riesgos físicos y químicos':    'rgba(59,139,212,0.08)',
    'Psicosocial y bienestar':       'rgba(124,58,237,0.08)',
    'Ergonomía, mecánica y EPI':     'rgba(100,116,139,0.08)',
  }
  return fondoPorCategoria[categoria] ?? 'rgba(100,116,139,0.08)'
}

/**
 * Devuelve la clase CSS de color de texto para un indicador según su cercanía a la meta.
 *
 * Umbrales:
 *  - Verde (`text-green-600`):  pct ≥ meta (por defecto 80%).
 *  - Naranja (`text-orange-500`): pct ≥ 75% de la meta.
 *  - Rojo (`text-red-600`):     por debajo del umbral de riesgo.
 *
 * @param pct - Porcentaje actual del indicador (0–100).
 * @param meta - Meta esperada. Por defecto 80 (mínimo Res. 0312 de 2019).
 * @returns Clase Tailwind de color de texto.
 */
export function getColorEstadoMeta(pct: number, meta = 80): string {
  if (pct >= meta) return 'text-green-600'
  if (pct >= meta * 0.75) return 'text-orange-500'
  return 'text-red-600'
}

/**
 * Extrae el texto de observaciones de los campos de un registro de programación,
 * tolerando variantes de nombre de campo que Airtable puede devolver.
 *
 * Airtable no garantiza consistencia en la capitalización de nombres de campo
 * si el campo fue renombrado. Este helper prueba los candidatos más comunes.
 *
 * @param fields - Campos crudos del registro de Airtable.
 * @returns Texto de observaciones, o cadena vacía si no existe.
 */
export function getObservacionesProg(fields: Record<string, unknown>): string {
  const nombresCandidatos = ['Observaciones', 'observaciones', 'notas', 'Notas', 'comentarios', 'Comentarios']
  for (const nombreCampo of nombresCandidatos) {
    const valor = fields[nombreCampo]
    if (typeof valor === 'string' && valor.trim()) return valor.trim()
  }
  return ''
}

// ─── Tipos y constantes de color para el rediseño visual ─────────────────────

/** Estado visual de actividad extendido (incluye 'Vencida' para la UI). */
export type EstadoActividad =
  | 'Sin programar'
  | 'Programado'
  | 'En ejecución'
  | 'Completado'
  | 'Cancelado'
  | 'Vencida'

/** Alerta de cobertura de asistencia (alias explícito para la UI). */
export type AlertaCobertura = 'ok' | 'riesgo' | 'critico' | 'sin_datos'

/** Paleta de colores oficial del módulo Capacitaciones SST. */
export const CAP_COLORS = {
  // ── Triada principal ──────────────────────────────────────────────
  verde:        '#28A745',   // Principal — acciones, éxito, marca
  blanco:       '#FFFFFF',   // Cards, superficies
  carbon:       '#2B2D42',   // Textos, headers, íconos

  // ── Semánticos ───────────────────────────────────────────────────
  naranja:      '#FF8C42',
  rojo:         '#DC3545',
  gris:         '#6C757D',

  // ── Suaves ───────────────────────────────────────────────────────
  verdeLight:   '#e8f5eb',
  naranjaLight: '#fff3eb',
  rojoLight:    '#fdecea',
  grisLight:    '#f0f0f5',
  carbonLight:  '#f0f0f5',

  // ── Backward compat (deprecated) ─────────────────────────────────
  azul:         '#28A745',   // → usar verde
  azulLight:    '#e8f5eb',   // → usar verdeLight
} as const

/** Colores del sistema de capas de fondo. */
export const CAP_BG = {
  pagina:   '#DFE9DC',
  seccion:  'rgba(255,255,255,0.45)',
  card:     '#FFFFFF',
  tabInact: 'rgba(255,255,255,0.8)',
} as const

/** Mapa de color de borde/acento por estado de actividad. */
export const ESTADO_COLOR: Record<EstadoActividad, string> = {
  'Sin programar': '#6C757D',
  'Programado':    '#6C757D',
  'En ejecución':  '#FF8C42',
  'Completado':    '#28A745',
  'Cancelado':     '#6C757D',
  'Vencida':       '#DC3545',
}

/** Mapa de color de barra de progreso por alerta de cobertura. */
export const ALERTA_COLOR: Record<AlertaCobertura, string> = {
  ok:        '#28A745',
  riesgo:    '#FF8C42',
  critico:   '#DC3545',
  sin_datos: '#6C757D',
}

/** Fondos de alerta contextual. */
export const ALERTA_BG: Record<string, string> = {
  ok:        '#e8f5eb',
  riesgo:    '#fff3eb',
  critico:   '#fdecea',
  sin_datos: '#f0f0f5',
}

/** Bordes de alerta contextual. */
export const ALERTA_BORDER: Record<string, string> = {
  ok:        '#b7dfbf',
  riesgo:    '#ffd6b3',
  critico:   '#f5c6cb',
  sin_datos: '#d0d0da',
}

/** Textos de alerta contextual. */
export const ALERTA_TEXT: Record<string, string> = {
  ok:        '#155724',
  riesgo:    '#7a3e00',
  critico:   '#721c24',
  sin_datos: '#2B2D42',
}
