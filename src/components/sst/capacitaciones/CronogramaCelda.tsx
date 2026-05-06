/**
 * @file CronogramaCelda.tsx
 * Celda interactiva del cronograma mensual para una actividad en una semana dada.
 * Al hacer clic, muestra un tooltip con acciones (crear/editar/ejecutar programación).
 * Usa `createPortal` para renderizar el tooltip por encima de otros elementos.
 */
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { getAuthHeaders } from '@/lib/client/authFetch'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

interface Props {
  prog: Prog | null
  actividad: Actividad
  semana: number
  mes: string
  onAction: (prog: Prog | null, actividad: Actividad, semana: number, mes: string) => void
  onSuccess?: () => void
}

const HOY = new Date().toISOString().split('T')[0]

function esVencido(prog: Prog): boolean {
  return prog.fields.estado === 'Programado' &&
    !!prog.fields.fecha_programada &&
    prog.fields.fecha_programada < HOY
}

type EstadoVisual = 'Ejecutado' | 'Vencido' | 'Reprogramado' | 'Cancelado' | 'Programado' | 'vacio'

interface EstadoCfg {
  bg: string
  border: string
  color: string
  label: string
  symbol: string
}

const ESTADO_CONFIG: Record<EstadoVisual, EstadoCfg> = {
  Programado:   { bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.3)',  color: '#2563EB', label: 'Programado',   symbol: 'P' },
  Ejecutado:    { bg: 'rgba(22,101,52,0.1)',   border: 'rgba(22,101,52,0.35)',  color: '#166534', label: 'Ejecutado',    symbol: '✓' },
  Vencido:      { bg: 'rgba(220,53,69,0.08)',  border: 'rgba(220,53,69,0.35)', color: '#DC3545', label: 'Vencido',      symbol: '!' },
  Reprogramado: { bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.3)', color: '#7C3AED', label: 'Reprogramado', symbol: '↻' },
  Cancelado:    { bg: 'rgba(220,53,69,0.08)',  border: 'rgba(220,53,69,0.25)',  color: '#DC3545', label: 'Cancelado',  symbol: '✕' },
  vacio:        { bg: 'transparent', border: 'transparent', color: '#D1D5DB', label: '', symbol: '' },
}

export function CronogramaCelda({ prog, actividad, semana, mes, onAction, onSuccess }: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const [executing, setExecuting] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const estadoVisual: EstadoVisual = !prog ? 'vacio'
    : esVencido(prog) ? 'Vencido'
    : prog.fields.estado as EstadoVisual

  const cfg = ESTADO_CONFIG[estadoVisual]

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setTooltipPos({ top: r.top, left: r.left + r.width / 2 })
    }
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHovered(false), 120)
  }, [])

  async function quickExecute(e: React.MouseEvent) {
    e.stopPropagation()
    if (!prog || executing) return
    setExecuting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/sst/capacitaciones/programacion/${prog.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: 'Ejecutado', fecha_ejecucion: today }),
      })
      if (!res.ok) throw new Error(await res.text())
      onSuccess?.()
    } catch (err) {
      console.error('[quickExecute]', err)
    } finally {
      setExecuting(false)
      setHovered(false)
    }
  }

  function viewDetail(e: React.MouseEvent) {
    e.stopPropagation()
    setHovered(false)
    router.push(`/dashboard/capacitaciones/${actividad.id}`)
  }

  if (estadoVisual === 'vacio') {
    return (
      <button
        onClick={() => onAction(null, actividad, semana, mes)}
        className="w-full h-9 rounded-[10px] border border-dashed transition-all duration-150 group flex items-center justify-center"
        style={{ borderColor: 'var(--sst-dark-300)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.background = 'rgba(59,130,246,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sst-dark-300)'; e.currentTarget.style.background = '' }}
        title={`Programar — ${mes} S${semana}`}
      >
        <span className="text-xs transition-colors" style={{ color: 'var(--sst-dark-300)' }}>+</span>
      </button>
    )
  }

  const tooltip = mounted && hovered && prog
    ? createPortal(
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translate(-50%, calc(-100% - 10px))' }}
          onMouseEnter={() => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="rounded-xl shadow-2xl w-56 p-3 space-y-2 text-xs"
            style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}
          >
            <p className="font-semibold leading-snug line-clamp-2">{actividad.fields.tema}</p>
            {prog.fields.fecha_programada && (
              <p style={{ color: '#94A3B8' }}>📅 {prog.fields.fecha_programada}</p>
            )}
            {actividad.fields.responsable && (
              <p style={{ color: '#94A3B8' }}>👤 {actividad.fields.responsable}</p>
            )}
            {prog.fields.observaciones && (
              <p className="text-[11px] italic leading-snug" style={{ color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                💬 {prog.fields.observaciones}
              </p>
            )}
            <div className="flex gap-1.5 pt-1">
              {estadoVisual !== 'Ejecutado' && estadoVisual !== 'Cancelado' && (
                <button
                  onClick={quickExecute}
                  disabled={executing}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 active:scale-95"
                  style={{ backgroundColor: '#0B5B2D', color: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#166534' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0B5B2D' }}
                >
                  {executing ? '…' : '✓ Ejecutado'}
                </button>
              )}
              <button
                onClick={viewDetail}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                style={{ background: 'transparent', border: '1px solid #4ADE80', color: '#4ADE80' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Ver detalle
              </button>
            </div>
            {/* flecha */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: -6,
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #0F172A',
              }}
            />
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => onAction(prog, actividad, semana, mes)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`w-full h-9 border-[1.5px] font-bold text-base transition-all duration-150 hover:scale-[1.15] active:scale-95 flex items-center justify-center ${
          estadoVisual === 'Vencido' ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          color: cfg.color,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: hovered
            ? `0 8px 24px ${cfg.color}33, inset 0 1px 0 rgba(255,255,255,0.4)`
            : 'inset 0 1px 0 rgba(255,255,255,0.3)',
          borderRadius: 'var(--radius-card)',
          transition: 'var(--transition-normal)',
        }}
        title={`${cfg.label}${prog?.fields.fecha_programada ? ` — ${prog.fields.fecha_programada}` : ''}`}
      >
        {cfg.symbol}
      </button>
      {tooltip}
    </>
  )
}
