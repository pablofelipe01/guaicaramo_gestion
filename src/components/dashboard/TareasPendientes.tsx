'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, ArrowRight } from 'lucide-react'
import type { TareaDashboard } from '@/lib/sst/tareas'

const CICLOS: TareaDashboard['cicloPhva'][] = ['Planear', 'Hacer', 'Verificar', 'Actuar']

const CICLO_CONFIG: Record<TareaDashboard['cicloPhva'], { color: string; active: string; dot: string }> = {
  Planear: {
    color: 'text-blue-700',
    active: 'border-b-2 border-blue-500 text-blue-700',
    dot: 'bg-blue-500',
  },
  Hacer: {
    color: 'text-green-700',
    active: 'border-b-2 border-green-500 text-green-700',
    dot: 'bg-green-500',
  },
  Verificar: {
    color: 'text-yellow-700',
    active: 'border-b-2 border-yellow-500 text-yellow-700',
    dot: 'bg-yellow-500',
  },
  Actuar: {
    color: 'text-red-700',
    active: 'border-b-2 border-red-500 text-red-700',
    dot: 'bg-red-500',
  },
}

const PRIORIDAD_BADGE: Record<NonNullable<TareaDashboard['prioridad']>, string> = {
  critica: 'bg-red-100 text-red-700',
  alta: 'bg-orange-100 text-orange-700',
  media: 'bg-yellow-100 text-yellow-700',
  baja: 'bg-gray-100 text-gray-600',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  en_proceso: 'En proceso',
  reabierta: 'Reabierta',
  programada: 'Programada',
  planificada: 'Planificada',
  en_ejecucion: 'En ejecución',
  borrador: 'Borrador',
  pendiente_aprobacion: 'Pend. aprobación',
}

interface TareasPendientesProps {
  tareas: TareaDashboard[]
}

export function TareasPendientes({ tareas }: TareasPendientesProps) {
  const [activo, setActivo] = useState<TareaDashboard['cicloPhva']>('Planear')

  // Group by PHVA manually
  const grupos = CICLOS.reduce(
    (acc, c) => {
      acc[c] = tareas.filter(t => t.cicloPhva === c)
      return acc
    },
    {} as Record<TareaDashboard['cicloPhva'], TareaDashboard[]>
  )

  const tareasMostradas = grupos[activo] ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-blue-600" />
        Tareas pendientes
        <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {tareas.length} total
        </span>
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {CICLOS.map(c => {
          const count = grupos[c].length
          const isActive = activo === c
          const cfg = CICLO_CONFIG[c]
          return (
            <button
              key={c}
              onClick={() => setActivo(c)}
              className={[
                'px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
                isActive ? cfg.active : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <span className={['w-1.5 h-1.5 rounded-full', cfg.dot].join(' ')} />
              {c}
              {count > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-1.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Task list */}
      {tareasMostradas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Sin tareas pendientes en {activo}
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tareasMostradas.map(t => (
            <Link
              key={t.id}
              href={t.enlace}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-medium">{t.modulo}</span>
                  {t.prioridad && (
                    <span className={['text-xs px-1.5 py-0.5 rounded font-medium', PRIORIDAD_BADGE[t.prioridad]].join(' ')}>
                      {t.prioridad}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 truncate">{t.descripcion}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {ESTADO_LABEL[t.estado] ?? t.estado}
                  </span>
                  {t.fechaLimite && (
                    <span className="text-xs text-gray-400">
                      · {new Date(t.fechaLimite).toLocaleDateString('es-CO')}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
