/**
 * @file EstadoBadge.tsx
 * Componente visual para el estado de una actividad o sesión del módulo Capacitaciones.
 *
 * Muestra un punto de color (con animación de pulso para 'En ejecución') y el
 * texto del estado. Todos los colores respetan el sistema de tokens CSS definido
 * en globals.css para coherencia con el resto del SG-SST.
 *
 * @example
 * <EstadoBadge estado="Completado" />
 * <EstadoBadge estado="En ejecución" size="md" />
 */
'use client'

import type { CapEstadoGeneral, CapEstadoProgramacion } from '@/types/sst/cap'

type EstadoUnion = CapEstadoGeneral | CapEstadoProgramacion

interface EstadoConfig {
  bg: string
  border: string
  text: string
  dot: string
  /** Si `true`, el punto renderiza una animación de pulso (solo para 'En ejecución'). */
  dotAnimate?: boolean
}

/** Mapa de configuraciones visuales por estado. */
const ESTADOS: Record<string, EstadoConfig> = {
  'Sin programar':  { bg: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)', text: '#DC3545', dot: '#DC3545' },
  'Programado':     { bg: 'rgba(59,130,246,0.08)',                  border: '1px solid rgba(59,130,246,0.3)', text: '#1D4ED8',             dot: 'var(--estado-programado)' },
  'En ejecución':   { bg: 'rgba(245,158,11,0.1)',                   border: '1px solid rgba(245,158,11,0.3)', text: '#92400E',             dot: '#F59E0B', dotAnimate: true },
  'Completado':     { bg: 'var(--sst-cumple-bg)',                   border: '1px solid rgba(22,101,52,0.25)', text: 'var(--sst-cumple)',   dot: 'var(--sst-cumple)' },
  'Cancelado':      { bg: 'var(--sst-critico-bg)',                  border: '1px solid rgba(220,53,69,0.25)', text: 'var(--sst-critico)',  dot: 'var(--sst-critico)' },
  'Ejecutado':      { bg: 'var(--sst-cumple-bg)',                   border: '1px solid rgba(22,101,52,0.25)', text: 'var(--sst-cumple)',   dot: 'var(--estado-ejecutado)' },
  'Reprogramado':   { bg: 'var(--sst-riesgo-bg)',                   border: '1px solid rgba(217,119,6,0.25)', text: 'var(--sst-riesgo)',   dot: 'var(--estado-reprogramado)' },
  'Vencido':        { bg: 'var(--sst-critico-bg)',                  border: '1px solid rgba(220,53,69,0.25)', text: 'var(--sst-critico)',  dot: 'var(--estado-vencido)' },
}

/** Configuración por defecto para estados no reconocidos. */
const DEFAULT: EstadoConfig = {
  bg: 'var(--sst-dark-100)', border: '1px solid var(--sst-dark-300)', text: 'var(--sst-dark-500)', dot: 'var(--sst-dark-500)',
}

interface Props {
  /** Estado de la actividad (`CapEstadoGeneral`) o de la sesión (`CapEstadoProgramacion`). */
  estado: EstadoUnion | string
  /** Tamaño del badge. 'sm' para tablas y listas, 'md' para tarjetas y encabezados. */
  size?: 'sm' | 'md'
  /**
   * Nivel de urgencia opcional, calculado en servidor con `nivelUrgencia()`.
   * Modula la apariencia del badge cuando `estado === 'Programado'`:
   *   - 'inmediata' → pulso rojo
   *   - 'proxima'   → punto naranja animado
   * Para `estado === 'Vencido'` muestra los días vencidos como sublabel.
   */
  urgencia?: NivelUrgenciaCliente
  /** Días vencida (>=0). Usado solo para 'Vencido'. */
  diasVencida?: number
}

/**
 * Tipo equivalente a `NivelUrgencia` de `cap-estados.ts` pero seguro para
 * Client Components (el módulo original es `server-only`).
 */
export type NivelUrgenciaCliente =
  | 'inmediata'
  | 'proxima'
  | 'normal'
  | 'lejana'
  | 'ejecutada'
  | 'cancelada'

export function EstadoBadge({ estado, size = 'sm', urgencia, diasVencida }: Props) {
  // Override visual: Programado + inmediata → pulso rojo
  let c = ESTADOS[estado] ?? DEFAULT
  if (estado === 'Programado' && urgencia === 'inmediata') {
    c = { bg: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.35)', text: '#7F1D1D', dot: '#DC3545', dotAnimate: true }
  } else if (estado === 'Programado' && urgencia === 'proxima') {
    c = { ...c, dot: '#FF8C42', dotAnimate: true }
  }
  const pad = size === 'sm' ? '2px 10px' : '4px 12px'
  const fontSize = size === 'sm' ? '11px' : '12.5px'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: c.bg,
        border: c.border,
        borderRadius: 'var(--radius-pill)',
        color: c.text,
        padding: pad,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {c.dotAnimate && (
          <span
            className="animate-ping"
            style={{
              position: 'absolute',
              width: '10px', height: '10px',
              borderRadius: '50%',
              background: c.dot,
              opacity: 0.6,
            }}
          />
        )}
        <span
          style={{
            display: 'inline-block',
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: c.dot,
            position: 'relative',
          }}
        />
      </span>
      {estado}
      {estado === 'Vencido' && typeof diasVencida === 'number' && diasVencida > 0 && (
        <span style={{ marginLeft: 4, fontSize: '10px', fontWeight: 500, color: 'var(--sst-dark-500)' }}>
          hace {diasVencida} {diasVencida === 1 ? 'día' : 'días'}
        </span>
      )}
    </span>
  )
}
