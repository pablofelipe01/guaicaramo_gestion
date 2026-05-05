'use client'

import { ChevronDown, ChevronRight, Mountain, Car, Bug, FlaskConical, Brain, Wrench } from 'lucide-react'
import { getCategoriaColor } from '@/lib/sst/cap-client'
import type { CapCategoria } from '@/types/sst/cap'

interface Props {
  categoria: CapCategoria
  count: number
  collapsed: boolean
  onToggle: () => void
}

const CATEGORIA_ICON: Record<CapCategoria, React.FC<{ className?: string }>> = {
  'Alturas y espacios confinados': Mountain,
  'Seguridad vial y emergencias': Car,
  'Salud y riesgo biológico': Bug,
  'Riesgos físicos y químicos': FlaskConical,
  'Psicosocial y bienestar': Brain,
  'Ergonomía, mecánica y EPI': Wrench,
}

export function CronogramaSeparadorCategoria({ categoria, count, collapsed, onToggle }: Props) {
  const color = getCategoriaColor(categoria)
  const Icon = CATEGORIA_ICON[categoria] ?? Mountain
  const Chevron = collapsed ? ChevronRight : ChevronDown

  return (
    <tr className="select-none">
      <td
        colSpan={100}
        className="px-3 py-2 cursor-pointer transition-all"
        style={{
          backgroundColor: `${color}1A`,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          borderLeft: `3px solid ${color}`,
          fontFamily: 'var(--font-poppins)',
        }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span style={{ color }} className="flex-shrink-0"><Icon className="w-4 h-4" /></span>
          <span className="font-semibold text-xs" style={{ color }}>
            {categoria}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 font-medium ml-1"
            style={{ backgroundColor: `${color}20`, color, borderRadius: 'var(--radius-pill)' }}
          >
            {count}
          </span>
          <Chevron className="w-3.5 h-3.5 ml-auto" style={{ color }} />
        </div>
      </td>
    </tr>
  )
}
