'use client'

import { useState, useMemo } from 'react'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

interface Props {
  actividades: Actividad[]
  programaciones: Prog[]
  actividadPreseleccionada?: string
  onGuardar: (data: Record<string, unknown>) => Promise<void>
  onCancelar: () => void
}


export function RegistroForm({ actividades, programaciones, actividadPreseleccionada, onGuardar, onCancelar }: Props) {

  const [form, setForm] = useState({
    actividad_id:            actividadPreseleccionada ?? '',
    programacion_id:         '',
    fecha_ejecucion:         new Date().toISOString().split('T')[0],
    duracion_horas:          '',
    lugar:                   '',
    facilitador:             '',
    observaciones:           '',
  })

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const progFiltradas = programaciones.filter(p =>
    !form.actividad_id || p.fields.actividad_id === form.actividad_id
  )

  /** Programación actualmente seleccionada */
  const progSeleccionada = useMemo(
    () => progFiltradas.find(p => p.id === form.programacion_id) ?? null,
    [progFiltradas, form.programacion_id]
  )

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const validar = (): string | null => {
    if (!form.actividad_id) return 'Selecciona una actividad'
    if (!form.fecha_ejecucion) return 'La fecha de ejecución es requerida'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setGuardando(true)
    setError(null)
    try {
      await onGuardar({
        ...form,
        duracion_horas:          form.duracion_horas          ? Number(form.duracion_horas)          : undefined,
        programacion_id:         form.programacion_id || undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
    setGuardando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Actividad */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Actividad *</label>
        <select
          value={form.actividad_id}
          onChange={e => { set('actividad_id', e.target.value); set('programacion_id', '') }}
          required
          className="input-field"
        >
          <option value="">Seleccionar actividad…</option>
          {actividades.map(a => (
            <option key={a.id} value={a.id}>#{a.fields.item_numero} — {a.fields.tema}</option>
          ))}
        </select>
      </div>

      {/* Programación vinculada */}
      {progFiltradas.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Vincular a programación (opcional)</label>
          <select
            value={form.programacion_id}
            onChange={e => {
              const pid = e.target.value
              set('programacion_id', pid)
              if (pid) {
                const prog = progFiltradas.find(p => p.id === pid)
                if (prog?.fields.fecha_programada) {
                  set('fecha_ejecucion', prog.fields.fecha_programada)
                }
              }
            }}
            className="input-field"
          >
            <option value="">Sin programación específica</option>
            {progFiltradas.map(p => {
              const cancelado = p.fields.estado === 'Cancelado'
              return (
                <option key={p.id} value={p.id} disabled={cancelado}
                  style={cancelado ? { color: '#9ca3af' } : undefined}>
                  {p.fields.mes} — Semana {p.fields.semana}{p.fields.fecha_programada ? ` (${p.fields.fecha_programada})` : ''} — {p.fields.estado}
                </option>
              )
            })}
          </select>
          {form.programacion_id && progFiltradas.find(p => p.id === form.programacion_id)?.fields.estado === 'Cancelado' && (
            <p className="text-xs text-amber-600 mt-0.5">Esta sesión está cancelada. Considera vincular a otra o dejar sin programación.</p>
          )}

        </div>
      )}

      {/* Fecha + Duración */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Fecha ejecución *</label>
          <input
            type="date" required value={form.fecha_ejecucion}
            onChange={e => set('fecha_ejecucion', e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Duración (horas)</label>
          <input type="number" min="0" step="0.5" value={form.duracion_horas}
            onChange={e => set('duracion_horas', e.target.value)}
            className="input-field" />
        </div>
      </div>

      {/* Lugar + Facilitador */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Lugar</label>
          <input type="text" value={form.lugar}
            onChange={e => set('lugar', e.target.value)}
            className="input-field" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Facilitador</label>
          <input type="text" value={form.facilitador}
            onChange={e => set('facilitador', e.target.value)}
            className="input-field" />
        </div>
      </div>

      {/* Observaciones */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Observaciones</label>
        <textarea rows={3} value={form.observaciones}
          onChange={e => set('observaciones', e.target.value)}
          className="input-field resize-none" />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancelar} className="btn btn-secondary flex-1">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={
            guardando
          }
          className="btn btn-primary flex-1 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar registro'}
        </button>
      </div>
    </form>
  )
}
