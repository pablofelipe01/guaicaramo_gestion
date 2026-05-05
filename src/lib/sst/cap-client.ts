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
    'Alturas y espacios confinados': '#E85D30',
    'Seguridad vial y emergencias':  '#FF8C42',
    'Salud y riesgo biológico':      '#1D9E75',
    'Riesgos físicos y químicos':    '#3B8BD4',
    'Psicosocial y bienestar':       '#7C3AED',
    'Ergonomía, mecánica y EPI':     '#64748B',
  }
  return colores[categoria] ?? '#64748B'
}

export function getCategoriaBg(categoria: string): string {
  const fondos: Record<string, string> = {
    'Alturas y espacios confinados': 'rgba(232,93,48,0.08)',
    'Seguridad vial y emergencias':  'rgba(255,140,66,0.08)',
    'Salud y riesgo biológico':      'rgba(29,158,117,0.08)',
    'Riesgos físicos y químicos':    'rgba(59,139,212,0.08)',
    'Psicosocial y bienestar':       'rgba(124,58,237,0.08)',
    'Ergonomía, mecánica y EPI':     'rgba(100,116,139,0.08)',
  }
  return fondos[categoria] ?? 'rgba(100,116,139,0.08)'
}

export function getColorEstadoMeta(pct: number, meta = 80): string {
  if (pct >= meta) return 'text-green-600'
  if (pct >= meta * 0.75) return 'text-orange-500'
  return 'text-red-600'
}
