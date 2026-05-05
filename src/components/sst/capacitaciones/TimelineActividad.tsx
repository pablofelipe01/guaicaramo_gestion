'use client'

import type { CapRegistroFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { CheckCircle, Clock, AlertCircle, User, Calendar, FileText } from 'lucide-react'

type Registro = AirtableRecord<CapRegistroFields>

interface TimelineNode {
  id: string
  fecha: string
  titulo: string
  descripcion?: string
  tipo: 'ejecutado' | 'reprogramado' | 'planeado' | 'cancelado'
  responsable?: string
  asistentes?: number
  nota?: string
}

const NODE_STYLES = {
  ejecutado:    { dot: 'bg-green-500', ring: 'ring-green-200', icon: CheckCircle, iconCls: 'text-green-600' },
  reprogramado: { dot: 'bg-orange-400', ring: 'ring-orange-200', icon: Clock, iconCls: 'text-orange-600' },
  planeado:     { dot: 'bg-blue-400', ring: 'ring-blue-200', icon: Calendar, iconCls: 'text-blue-600' },
  cancelado:    { dot: 'bg-red-400', ring: 'ring-red-200', icon: AlertCircle, iconCls: 'text-red-600' },
}

function mapRegistroToNode(r: Registro): TimelineNode {
  const f = r.fields

  return {
    id: r.id,
    fecha: f.fecha_ejecucion ?? '',
    titulo: `Sesión — ${f.lugar ?? 'Presencial'}`,
    descripcion: f.lugar ?? undefined,
    tipo: 'ejecutado',
    responsable: f.facilitador ?? undefined,
    asistentes: f.presentes ?? undefined,
    nota: f.observaciones ?? undefined,
  }
}

interface Props {
  registros: Registro[]
  emptyText?: string
}

export function TimelineActividad({ registros, emptyText = 'No hay registros de ejecución aún.' }: Props) {
  const nodes = registros.map(mapRegistroToNode).sort((a, b) => {
    if (!a.fecha) return 1
    if (!b.fecha) return -1
    return a.fecha.localeCompare(b.fecha)
  })

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
        <FileText className="w-10 h-10 opacity-40" />
        <p className="text-sm">{emptyText}</p>
      </div>
    )
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {nodes.map((node, idx) => {
        const s = NODE_STYLES[node.tipo]
        const Icon = s.icon
        const isLast = idx === nodes.length - 1

        return (
          <li key={node.id} className="flex gap-4 relative">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-gray-100" />
            )}

            {/* Dot */}
            <div className="shrink-0 mt-1">
              <div className={`w-8 h-8 rounded-full ${s.dot} ${s.ring} ring-4 ring-offset-0 flex items-center justify-center shadow-sm`}>
                <Icon className={`w-4 h-4 text-white`} />
              </div>
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 min-w-0 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{node.titulo}</p>
                  {node.descripcion && (
                    <p className="text-xs text-gray-500">{node.descripcion}</p>
                  )}
                </div>
                {node.fecha && (
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                    {new Date(node.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
                {node.responsable && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {node.responsable}
                  </span>
                )}
                {node.asistentes !== undefined && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {node.asistentes} asistentes
                  </span>
                )}
              </div>

              {node.nota && (
                <p className="mt-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-600 italic">
                  {node.nota}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
