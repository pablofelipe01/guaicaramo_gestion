'use client'

import { useEffect, useRef, useState } from 'react'

interface KpiRingProps {
  value: number
  meta?: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

function getColor(value: number, meta: number) {
  if (value >= meta) return 'var(--sst-cumple)'      // #166534
  if (value >= meta * 0.75) return 'var(--sst-riesgo)' // #D97706
  return 'var(--sst-critico)'                          // #DC3545
}

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
