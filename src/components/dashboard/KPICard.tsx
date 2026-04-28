import type { IndKpiResult } from '@/types/sst/ind'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const ICONOS_CODIGO: Record<string, string> = {
  IF: '🦺',
  IS: '📅',
  ILT: '🏥',
  COB_CAP: '📚',
  CUM_PLAN: '📋',
  EJEC_PPTO: '💰',
  CIERRE_AC: '✅',
  INSP: '🔍',
}

function formatValor(valor: number | null, unidad: string): string {
  if (valor === null || valor === undefined) return '—'
  if (unidad === '%') return `${valor}%`
  return String(valor)
}

interface KPICardProps {
  kpi: IndKpiResult
}

export function KPICard({ kpi }: KPICardProps) {
  const cumple = kpi.cumpleMeta
  const valor = kpi.valor

  const borderColor = valor === null
    ? 'border-l-gray-300'
    : cumple
    ? 'border-l-green-500'
    : 'border-l-red-500'

  const valorColor = valor === null
    ? 'text-gray-400'
    : cumple
    ? 'text-green-700'
    : 'text-red-700'

  const TrendIcon = valor === null ? Minus : cumple ? TrendingUp : TrendingDown
  const trendColor = valor === null ? 'text-gray-400' : cumple ? 'text-green-500' : 'text-red-500'

  return (
    <div
      className={[
        'bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4',
        borderColor,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
            {ICONOS_CODIGO[kpi.codigo] && (
              <span className="mr-1">{ICONOS_CODIGO[kpi.codigo]}</span>
            )}
            {kpi.codigo}
          </p>
          <p className={['text-2xl font-bold mt-1', valorColor].join(' ')}>
            {formatValor(valor, kpi.unidad)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            Meta: {kpi.meta}{kpi.unidad === '%' ? '%' : ''}
          </p>
        </div>
        <TrendIcon className={['w-5 h-5 shrink-0 mt-1', trendColor].join(' ')} />
      </div>
      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{kpi.nombre}</p>
    </div>
  )
}
