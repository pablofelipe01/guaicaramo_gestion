'use client'

import type { CapEstadoGeneral, CapEstadoProgramacion } from '@/types/sst/cap'

type EstadoUnion = CapEstadoGeneral | CapEstadoProgramacion

const ESTADO_STYLES: Record<string, string> = {
  'Sin programar':  'bg-gray-100 text-gray-700 border-gray-200',
  'Programado':     'bg-blue-100 text-blue-800 border-blue-200',
  'En ejecución':   'bg-orange-100 text-orange-800 border-orange-200',
  'Completado':     'bg-green-100 text-green-800 border-green-200',
  'Cancelado':      'bg-red-100 text-red-800 border-red-200',
  'Ejecutado':      'bg-green-100 text-green-800 border-green-200',
  'Reprogramado':   'bg-yellow-100 text-yellow-800 border-yellow-200',
}

interface Props {
  estado: EstadoUnion
  size?: 'sm' | 'md'
}

export function EstadoBadge({ estado, size = 'sm' }: Props) {
  const cls = ESTADO_STYLES[estado] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span
      className={[
        'inline-flex items-center border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        cls,
      ].join(' ')}
    >
      {estado}
    </span>
  )
}
