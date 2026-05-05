'use client'

import { useState } from 'react'
import { X, CheckCircle2, RotateCcw, XCircle, Clock, CalendarDays } from 'lucide-react'
import { getCategoriaColor } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapProgramacionFields, CapEstadoProgramacion } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

interface Props {
  open: boolean
  prog: Prog | null
  actividad: Actividad | null
  semana?: number
  mes?: string
  onClose: () => void
  onSuccess: () => void
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

const OPCIONES: { estado: CapEstadoProgramacion; label: string; color: string; Icon: React.FC<{ className?: string }> }[] = [
  { estado: 'Ejecutado', label: 'Marcar ejecutado', color: '#22C55E', Icon: CheckCircle2 },
  { estado: 'Reprogramado', label: 'Reprogramar', color: '#F59E0B', Icon: RotateCcw },
  { estado: 'Cancelado', label: 'Cancelar', color: '#9CA3AF', Icon: XCircle },
  { estado: 'Programado', label: 'Restablecer como programado', color: '#3B82F6', Icon: Clock },
]

export function CronogramaActionSheet({ open, prog, actividad, onClose, onSuccess }: Props) {
  const [estadoSel, setEstadoSel] = useState<CapEstadoProgramacion | null>(null)
  const [fecha, setFecha] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open || !prog || !actividad) return null

  const catColor = getCategoriaColor(actividad.fields.categoria)
  const necesitaFecha = estadoSel === 'Ejecutado' || estadoSel === 'Reprogramado'

  async function handleGuardar() {
    if (!prog || !estadoSel) return
    if (necesitaFecha && !fecha) { setError('La fecha es requerida'); return }
    setLoading(true)
    setError('')
    try {
      const body: Partial<CapProgramacionFields> = { estado: estadoSel, observaciones: observaciones || undefined }
      if (estadoSel === 'Ejecutado') body.fecha_ejecucion = fecha
      if (estadoSel === 'Reprogramado') body.fecha_programada = fecha

      const res = await fetch(`/api/sst/capacitaciones/programacion/${prog.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ fields: body }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      onSuccess()
      handleClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setEstadoSel(null)
    setFecha('')
    setObservaciones('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-0 sm:mx-4 z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div
          className="px-5 py-4 rounded-t-2xl flex items-start justify-between gap-3"
          style={{ backgroundColor: `${catColor}12`, borderBottom: `2px solid ${catColor}` }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: catColor }}>
              {actividad.fields.categoria}
            </p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2">{actividad.fields.tema}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {prog.fields.mes} — Semana {prog.fields.semana}
              {prog.fields.fecha_programada && ` — ${prog.fields.fecha_programada}`}
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Opciones de estado */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Actualizar estado</p>
          <div className="grid grid-cols-2 gap-2">
            {OPCIONES.map(({ estado, label, color, Icon }) => {
              if (estado === prog.fields.estado && estado !== 'Programado') return null
              const sel = estadoSel === estado
              return (
                <button
                  key={estado}
                  onClick={() => { setEstadoSel(estado); setFecha('') }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 ${
                    sel ? 'shadow-md' : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: color,
                    backgroundColor: sel ? `${color}20` : `${color}08`,
                    color,
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-left leading-tight">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Campos adicionales */}
        {necesitaFecha && (
          <div className="px-5 pb-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {estadoSel === 'Ejecutado' ? 'Fecha de ejecución' : 'Nueva fecha programada'}
                <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => { setFecha(e.target.value); setError('') }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={2}
                placeholder="Opcional..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="px-5 pb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!estadoSel || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-40"
            style={{ backgroundColor: estadoSel ? '#3B82F6' : '#9CA3AF' }}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
