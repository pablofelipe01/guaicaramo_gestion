'use client'

import type { CapEstadoGeneral, CapEstadoProgramacion } from '@/types/sst/cap'

type EstadoUnion = CapEstadoGeneral | CapEstadoProgramacion

type EstadoConfig = {
  bg: string
  border: string
  text: string
  dot: string
  dotAnimate?: boolean
}

const ESTADOS: Record<string, EstadoConfig> = {
  'Sin programar':  { bg: 'bg-gray-50',     border: 'border-gray-200',  text: 'text-gray-600',   dot: 'bg-gray-400' },
  'Programado':     { bg: 'bg-blue-50',     border: 'border-blue-200',  text: 'text-blue-700',   dot: 'bg-blue-500' },
  'En ejecución':  { bg: 'bg-orange-50',   border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', dotAnimate: true },
  'Completado':     { bg: 'bg-green-50',    border: 'border-green-200', text: 'text-green-700',  dot: 'bg-green-500' },
  'Cancelado':      { bg: 'bg-red-50',      border: 'border-red-200',   text: 'text-red-700',    dot: 'bg-red-400' },
  'Ejecutado':      { bg: 'bg-green-50',    border: 'border-green-200', text: 'text-green-700',  dot: 'bg-green-500' },
  'Reprogramado':   { bg: 'bg-yellow-50',   border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}

const DEFAULT_CONFIG: EstadoConfig = {
  bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400',
}

interface Props {
  estado: EstadoUnion
  size?: 'sm' | 'md'
}

export function EstadoBadge({ estado, size = 'sm' }: Props) {
  const c = ESTADOS[estado] ?? DEFAULT_CONFIG
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        c.bg, c.border, c.text,
      ].join(' ')}
    >
      <span className="relative flex items-center justify-center">
        {c.dotAnimate && (
          <span className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${c.dot} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
      </span>
      {estado}
    </span>
  )
}
