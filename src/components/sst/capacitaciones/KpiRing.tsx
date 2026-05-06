/**
 * @file KpiRing.tsx
 * Anillo SVG animado para representar un indicador porcentual con semáforo.
 *
 * La animación de llenado se activa al entrar en el viewport (IntersectionObserver)
 * con una curva ease-out cúbica de 1.1 segundos.
 *
 * Colores del semáforo (tokens CSS de globals.css):
 *   - value ≥ meta          → --sst-cumple  (verde)
 *   - value ≥ meta × 0.75   → --sst-riesgo  (naranja)
 *   - value < meta × 0.75   → --sst-critico (rojo)
 *
 * @example
 * <KpiRing value={72} meta={80} size={90} strokeWidth={7} label="72%" sublabel="Cobertura" />
 */
'use client'

import { useEffect, useRef, useState } from 'react'

interface KpiRingProps {
  /** Valor actual del indicador (0–100). */
  value: number
  /** Meta esperada. Por defecto 80 (mínimo Res. 0312). */
  meta?: number
  /** Diámetro total del SVG en px. Por defecto 90. */
  size?: number
  /** Grosor del trazo del anillo en px. Por defecto 7. */
  strokeWidth?: number
  /** Texto principal dentro del anillo (ej. "72%"). */
  label?: string
  /** Texto secundario bajo el label (ej. "Cobertura"). */
  sublabel?: string
}

/**
 * Devuelve el token CSS de color para el semáforo del anillo.
 *
 * @param value - Valor actual del indicador.
 * @param meta - Meta esperada.
 * @returns Token CSS var(--sst-cumple|riesgo|critico).
 */
function getColor(value: number, meta: number) {
  if (value >= meta) return 'var(--sst-cumple)'
  if (value >= meta * 0.75) return 'var(--sst-riesgo)'
  return 'var(--sst-critico)'
}

/**
 * Función de easing ease-out cúbica para la animación del anillo.
 *
 * @param t - Progreso de la animación (0–1).
 * @returns Valor de opacidad/progreso suavizado.
 */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function KpiRing({ value, meta = 80, size = 90, strokeWidth = 7, label, sublabel }: KpiRingProps) {
  const [animated, setAnimated] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const animRef = useRef<number>(0)

  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const color = getColor(value, meta)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const startTime = performance.now()
        const duration = 1100

        const step = (now: number) => {
          const t = Math.min((now - startTime) / duration, 1)
          const eased = easeOutCubic(t)
          setAnimated(Math.round(value * eased))
          if (t < 1) {
            animRef.current = requestAnimationFrame(step)
          }
        }
        animRef.current = requestAnimationFrame(step)
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [value])

  const progress = (animated / 100) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          ref={svgRef}
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E9ECEF"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 40ms linear' }}
          />
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center leading-none pointer-events-none"
        >
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: size * 0.24, color }}
          >
            {animated}%
          </span>
        </div>
      </div>

      {label && (
        <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
      )}
      {sublabel && (
        <span className="text-[10px] text-gray-400 text-center">{sublabel}</span>
      )}
    </div>
  )
}
