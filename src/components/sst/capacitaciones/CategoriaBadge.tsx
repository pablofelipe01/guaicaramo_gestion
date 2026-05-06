/**
 * @file CategoriaBadge.tsx
 * Chip de categoría con color semántico derivado de `getCategoriaColor`.
 * Usado en tablas, tarjetas y listas para identificar la categoría SST.
 *
 * @example
 * <CategoriaBadge categoria="Alturas y espacios confinados" size="sm" />
 */
'use client'

import { getCategoriaColor, getCategoriaBg } from '@/lib/sst/cap-client'

interface Props {
  categoria: string
  size?: 'xs' | 'sm' | 'md'
}

export function CategoriaBadge({ categoria, size = 'sm' }: Props) {
  const color = getCategoriaColor(categoria)
  const bg    = getCategoriaBg(categoria)

  const pad = size === 'xs' ? '1px 8px' : size === 'sm' ? '3px 10px' : '4px 14px'
  const fs  = size === 'xs' ? '10px'    : size === 'sm' ? '11px'      : '12.5px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: bg,
        border: `1px solid ${color}40`,
        borderRadius: 'var(--radius-pill)',
        color,
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '5px', height: '5px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {categoria}
    </span>
  )
}
