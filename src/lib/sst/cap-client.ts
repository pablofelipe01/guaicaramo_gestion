/**
 * Constantes y helpers del módulo Capacitaciones que pueden importarse
 * desde Client Components (sin 'server-only').
 */

export const CATEGORIAS_CAP = [
  'Alturas y espacios confinados',
  'Seguridad vial y emergencias',
  'Salud y riesgo biológico',
  'Riesgos físicos y químicos',
  'Psicosocial y bienestar',
  'Ergonomía, mecánica y EPI',
] as const

export const PROVEEDORES_CAP = [
  'Proveedor externo', 'ARL SURA', 'SENA', 'SST', 'Enfermería', 'Bienestar Social', 'SURA',
] as const

export const MESES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export const TRIMESTRES_CAP = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'] as const

export function calcularPct(num: number, den: number): number {
  if (!den) return 0
  return Math.round((num / den) * 100)
}

export function getCategoriaColor(categoria: string): string {
  const colores: Record<string, string> = {
    'Alturas y espacios confinados': '#2C5F8D',
    'Seguridad vial y emergencias': '#FF8C42',
    'Salud y riesgo biológico': '#28A745',
    'Riesgos físicos y químicos': '#DC3545',
    'Psicosocial y bienestar': '#6C757D',
    'Ergonomía, mecánica y EPI': '#6f42c1',
  }
  return colores[categoria] ?? '#6C757D'
}

export function getColorEstadoMeta(pct: number, meta = 80): string {
  if (pct >= meta) return 'text-green-600'
  if (pct >= meta * 0.75) return 'text-orange-500'
  return 'text-red-600'
}
