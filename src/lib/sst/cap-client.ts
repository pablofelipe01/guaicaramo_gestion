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
