'use client'

/**
 * @file AlertasPanelCap.tsx
 *
 * Panel resumen de alertas para la página de listado de capacitaciones
 * (`/dashboard/capacitaciones`). Agrega las alertas a nivel de actividad
 * a partir de `alerta_cobertura` y `estado_general` (los únicos campos
 * disponibles sin tener que cargar programaciones individuales).
 *
 * Comportamiento:
 *  - No se renderiza si no hay actividades con alerta.
 *  - Colapsado por defecto si hay < 3 alertas; expandido si hay >= 3.
 *  - Muestra hasta 5 alertas; si hay más se muestra un botón "Ver todas"
 *    que aplica un filtro visual (callback `onVerTodas`).
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { CapActividadFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

const COLORS = {
  rojo:    { bg: 'rgba(220,53,69,0.10)', border: '#DC3545', text: '#7F1D1D' },
  naranja: { bg: 'rgba(255,140,66,0.10)', border: '#FF8C42', text: '#7C2D12' },
} as const

type Severidad = keyof typeof COLORS

interface AlertaItem {
  id: string
  tema: string
  severidad: Severidad
  motivo: string
}

export interface AlertasPanelCapProps {
  actividades: Array<AirtableRecord<CapActividadFields>>
  onVerTodas?: () => void
}

function clasificar(a: AirtableRecord<CapActividadFields>): AlertaItem | null {
  const f = a.fields
  if (f.alerta_cobertura === 'critico') {
    return {
      id: a.id,
      tema: f.tema || 'Sin tema',
      severidad: 'rojo',
      motivo: 'Cobertura de asistencia crítica (< 70%)',
    }
  }
  if (f.alerta_cobertura === 'riesgo') {
    return {
      id: a.id,
      tema: f.tema || 'Sin tema',
      severidad: 'naranja',
      motivo: 'Cobertura de asistencia en riesgo (70–84%)',
    }
  }
  return null
}

const SEVERIDAD_ORDER: Record<Severidad, number> = { rojo: 0, naranja: 1 }

export default function AlertasPanelCap({ actividades, onVerTodas }: AlertasPanelCapProps) {
  const alertas = useMemo(() => {
    const items = actividades
      .map(clasificar)
      .filter((x): x is AlertaItem => x !== null)
    items.sort((a, b) => SEVERIDAD_ORDER[a.severidad] - SEVERIDAD_ORDER[b.severidad])
    return items
  }, [actividades])

  const [expandido, setExpandido] = useState<boolean>(alertas.length >= 3)

  if (alertas.length === 0) return null

  const visibles = expandido ? alertas.slice(0, 5) : []
  const restantes = alertas.length - visibles.length

  return (
    <div
      className="rounded-xl border-l-4 bg-white shadow-sm"
      style={{ borderLeftColor: '#FF8C42' }}
    >
      <button
        type="button"
        onClick={() => setExpandido(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-xl"
        aria-expanded={expandido}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: '#FF8C42' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--sst-dark-800)' }}>
            {alertas.length} {alertas.length === 1 ? 'actividad requiere' : 'actividades requieren'} atención
          </span>
        </div>
        {expandido ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expandido && (
        <ul className="border-t border-gray-100 divide-y divide-gray-100">
          {visibles.map(item => {
            const c = COLORS[item.severidad]
            const Icon = item.severidad === 'rojo' ? AlertCircle : AlertTriangle
            return (
              <li key={item.id}>
                <Link
                  href={`/dashboard/capacitaciones/${item.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                    style={{ background: c.bg }}
                  >
                    <Icon size={14} className="" style={{ color: c.border }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: c.text }}>
                      {item.tema}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.motivo}</p>
                  </div>
                </Link>
              </li>
            )
          })}
          {restantes > 0 && (
            <li className="px-4 py-2.5">
              <button
                type="button"
                onClick={onVerTodas}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#2C5F8D' }}
              >
                Ver todas ({alertas.length})
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
