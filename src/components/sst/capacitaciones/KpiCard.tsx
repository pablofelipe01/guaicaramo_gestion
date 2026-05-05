'use client'

import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { KpiRing } from './KpiRing'

interface Props {
  label: string
  value: number
  unit?: string
  meta?: number
  icon?: LucideIcon
  description?: string
  showRing?: boolean
  trend?: number   // positive = good, negative = bad, undefined = no trend
  onClick?: () => void
}

const semaforo = (v: number, meta: number) => {
  if (v >= meta) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Cumple meta' }
  if (v >= meta * 0.75) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', label: 'En riesgo' }
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'No cumple' }
}

export function KpiCard({ label, value, unit = '%', meta = 80, icon: Icon, description, showRing = false, trend, onClick }: Props) {
  const s = semaforo(value, meta)
  const isPct = unit === '%'

  return (
    <div
      className={`rounded-xl border ${s.border} ${s.bg} p-4 flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${s.text} opacity-80`} />}
      </div>

      {showRing && isPct ? (
        <div className="flex items-center gap-3 py-1">
          <KpiRing value={value} meta={meta} size={70} strokeWidth={6} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${s.text}`}>{value}</span>
              <span className={`text-sm font-medium ${s.text}`}>{unit}</span>
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${s.badge}`}>{s.label}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-1">
          <div className="flex items-end gap-1">
            <span className={`text-3xl font-bold ${s.text} tabular-nums`}>{value}</span>
            <span className={`text-sm font-medium mb-0.5 ${s.text}`}>{unit}</span>
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs mb-0.5 font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}

      {isPct && !showRing && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ease-out`}
              style={{
                width: `${Math.min(value, 100)}%`,
                backgroundColor: value >= meta ? '#28A745' : value >= meta * 0.75 ? '#FF8C42' : '#DC3545',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {value >= meta ? 'Cumple meta' : value >= meta * 0.75 ? 'En riesgo' : (
                <span className="flex items-center gap-0.5 text-red-500">
                  <AlertTriangle className="w-3 h-3" /> No cumple
                </span>
              )}
            </span>
            <span>Meta: {meta}{unit}</span>
          </div>
        </div>
      )}

      {description && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{description}</p>}
    </div>
  )
}
