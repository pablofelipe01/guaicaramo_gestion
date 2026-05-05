'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

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

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

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
  Programado:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  color: '#3B82F6', label: 'Programado',   symbol: 'P' },
  Ejecutado:    { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: '#22C55E', label: 'Ejecutado',    symbol: '✓' },
  Vencido:      { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#EF4444', label: 'Vencido',      symbol: '!' },
  Reprogramado: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#F59E0B', label: 'Reprogramado', symbol: '↻' },
  Cancelado:    { bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)', color: '#9CA3AF', label: 'Cancelado',  symbol: '✕' },
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
        headers: authHeaders(),
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
        className="w-full h-9 rounded-[10px] border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-150 group flex items-center justify-center"
        title={`Programar — ${mes} S${semana}`}
      >
        <span className="text-gray-300 group-hover:text-blue-400 text-xs transition-colors">+</span>
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
            <div className="flex gap-1.5 pt-1">
              {estadoVisual !== 'Ejecutado' && estadoVisual !== 'Cancelado' && (
                <button
                  onClick={quickExecute}
                  disabled={executing}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#16A34A', color: '#fff' }}
                >
                  {executing ? '…' : '✓ Ejecutado'}
                </button>
              )}
              <button
                onClick={viewDetail}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                style={{ backgroundColor: '#2563EB', color: '#fff' }}
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
        className={`w-full h-9 rounded-[10px] border-[1.5px] font-bold text-base transition-all duration-150 hover:scale-[1.15] active:scale-95 flex items-center justify-center ${
          estadoVisual === 'Vencido' ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          color: cfg.color,
          boxShadow: hovered ? `0 4px 14px ${cfg.color}50` : undefined,
        }}
        title={`${cfg.label}${prog?.fields.fecha_programada ? ` — ${prog.fields.fecha_programada}` : ''}`}
      >
        {cfg.symbol}
      </button>
      {tooltip}
    </>
  )
}
