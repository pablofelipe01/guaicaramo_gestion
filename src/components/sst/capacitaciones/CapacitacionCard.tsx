'use client'

import { Award, Users, AlertTriangle } from 'lucide-react'
import { EstadoBadge } from './EstadoBadge'
import { getCategoriaColor } from '@/lib/sst/cap-client'
import type { CapActividadFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

interface Props {
  actividad: AirtableRecord<CapActividadFields>
  onClick?: () => void
}

export function CapacitacionCard({ actividad, onClick }: Props) {
  const f = actividad.fields
  const color = getCategoriaColor(f.categoria)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            #{f.item_numero}
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{f.tema}</span>
        </div>
        <EstadoBadge estado={f.estado_general} />
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
        <span
          className="px-2 py-0.5 rounded-full text-white text-xs"
          style={{ backgroundColor: color + 'cc' }}
        >
          {f.categoria}
        </span>
        {f.proveedor && (
          <span className="bg-gray-100 px-2 py-0.5 rounded-full">{f.proveedor}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {f.dirigido_a ? f.dirigido_a.slice(0, 40) + (f.dirigido_a.length > 40 ? '…' : '') : '—'}
        </span>
        <div className="flex gap-1.5">
          {f.requiere_certificacion && (
            <span className="flex items-center gap-1 text-amber-600">
              <Award className="w-3 h-3" /> Certif.
            </span>
          )}
          {f.estado_general === 'Sin programar' && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="w-3 h-3" /> Sin fecha
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
