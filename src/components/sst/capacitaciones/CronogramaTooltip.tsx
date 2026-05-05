'use client'

import { User, Users, CalendarDays, Tag, MessageSquare } from 'lucide-react'
import { getCategoriaColor } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

const HOY = new Date().toISOString().split('T')[0]

function estadoLabel(prog: Prog): { label: string; color: string } {
  if (prog.fields.estado === 'Ejecutado') return { label: 'Ejecutado', color: '#22C55E' }
  if (prog.fields.estado === 'Cancelado') return { label: 'Cancelado', color: '#9CA3AF' }
  if (prog.fields.estado === 'Reprogramado') return { label: 'Reprogramado', color: '#F59E0B' }
  if (prog.fields.estado === 'Programado' && prog.fields.fecha_programada && prog.fields.fecha_programada < HOY)
    return { label: 'Vencido', color: '#EF4444' }
  return { label: 'Programado', color: '#3B82F6' }
}

interface Props {
  prog: Prog
  actividad: Actividad
  onEdit: () => void
  visible: boolean
}

export function CronogramaTooltip({ prog, actividad, onEdit, visible }: Props) {
  const catColor = getCategoriaColor(actividad.fields.categoria)
  const estado = estadoLabel(prog)

  return (
    <div
      className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl shadow-xl border border-gray-200 bg-white transition-all duration-150 pointer-events-none ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Header con categoría */}
      <div
        className="px-3 py-2 rounded-t-xl flex items-center gap-2"
        style={{ backgroundColor: `${catColor}15`, borderBottom: `2px solid ${catColor}` }}
      >
        <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: catColor }} />
        <span className="text-xs font-semibold line-clamp-1" style={{ color: catColor }}>
          {actividad.fields.categoria}
        </span>
        <span
          className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{ backgroundColor: `${estado.color}20`, color: estado.color }}
        >
          {estado.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2">{actividad.fields.tema}</p>

        {prog.fields.fecha_programada && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <CalendarDays className="w-3 h-3" />
            <span className="text-[11px]">{prog.fields.fecha_programada}</span>
            {prog.fields.fecha_ejecucion && prog.fields.fecha_ejecucion !== prog.fields.fecha_programada && (
              <span className="text-[11px] text-green-600 ml-1">→ {prog.fields.fecha_ejecucion}</span>
            )}
          </div>
        )}

        {actividad.fields.responsable && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <User className="w-3 h-3" />
            <span className="text-[11px]">{actividad.fields.responsable}</span>
          </div>
        )}

        {actividad.fields.dirigido_a && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users className="w-3 h-3" />
            <span className="text-[11px]">{actividad.fields.dirigido_a}</span>
          </div>
        )}

        {prog.fields.observaciones && (
          <div className="flex items-start gap-1 pt-1">
            <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400" />
            <p className="text-[11px] text-gray-400 italic line-clamp-2">{prog.fields.observaciones}</p>
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200" />
    </div>
  )
}
