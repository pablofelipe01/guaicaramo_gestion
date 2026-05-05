'use client'

import { CheckCircle2, Clock, AlertCircle, RotateCcw, XCircle } from 'lucide-react'
import type { CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Prog = AirtableRecord<CapProgramacionFields>

const HOY = new Date().toISOString().split('T')[0]

function esVencido(p: Prog): boolean {
  return p.fields.estado === 'Programado' && !!p.fields.fecha_programada && p.fields.fecha_programada < HOY
}

const ESTADOS = [
  { key: 'Programado', label: 'Programado', color: '#3B82F6', Icon: Clock },
  { key: 'Ejecutado', label: 'Ejecutado', color: '#22C55E', Icon: CheckCircle2 },
  { key: 'Vencido', label: 'Vencido', color: '#EF4444', Icon: AlertCircle },
  { key: 'Reprogramado', label: 'Reprogramado', color: '#F59E0B', Icon: RotateCcw },
  { key: 'Cancelado', label: 'Cancelado', color: '#9CA3AF', Icon: XCircle },
] as const

interface Props {
  programaciones: Prog[]
  filtroEstados: string[]
  onToggle: (estado: string) => void
}

export function CronogramaLeyenda({ programaciones, filtroEstados, onToggle }: Props) {
  const counts: Record<string, number> = {}
  for (const p of programaciones) {
    const k = esVencido(p) ? 'Vencido' : p.fields.estado
    counts[k] = (counts[k] ?? 0) + 1
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS.map(({ key, label, color, Icon }) => {
        const active = filtroEstados.length === 0 || filtroEstados.includes(key)
        const n = counts[key] ?? 0
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 ${
              active ? 'shadow-sm' : 'opacity-40'
            }`}
            style={{
              borderColor: color,
              backgroundColor: active ? `${color}15` : 'transparent',
              color,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${color}25`, color }}
            >
              {n}
            </span>
          </button>
        )
      })}
      {filtroEstados.length > 0 && (
        <button
          onClick={() => filtroEstados.forEach(e => onToggle(e))}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
