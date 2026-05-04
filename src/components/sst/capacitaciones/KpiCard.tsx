'use client'

import { AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: number
  unit?: string
  meta?: number
  icon?: LucideIcon
  description?: string
}

const semaforo = (v: number, meta: number) => {
  if (v >= meta) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' }
  if (v >= meta * 0.75) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' }
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' }
}

export function KpiCard({ label, value, unit = '%', meta = 80, icon: Icon, description }: Props) {
  const s = semaforo(value, meta)
  const isPct = unit === '%'

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${s.text}`} />}
      </div>

      <div className="flex items-end gap-1">
        <span className={`text-3xl font-bold ${s.text}`}>{value}</span>
        <span className={`text-sm font-medium mb-0.5 ${s.text}`}>{unit}</span>
      </div>

      {isPct && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                value >= meta ? 'bg-green-500' : value >= meta * 0.75 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(value, 100)}%` }}
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

      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  )
}
