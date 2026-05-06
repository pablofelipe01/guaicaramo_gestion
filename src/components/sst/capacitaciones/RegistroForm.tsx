'use client'

import { useState } from 'react'
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
  const hoy = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    actividad_id:            actividadPreseleccionada ?? '',
    programacion_id:         '',
    fecha_ejecucion:         hoy,
    duracion_horas:          '',
    lugar:                   '',
    facilitador:             '',
    convocados:   '',
    presentes:    '',
    evaluaciones_realizadas: '',
    evaluaciones_aprobadas:  '',
    observaciones:           '',
  })

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const progFiltradas = programaciones.filter(p =>
    !form.actividad_id || p.fields.actividad_id === form.actividad_id
  )

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const validar = (): string | null => {
    if (!form.actividad_id) return 'Selecciona una actividad'
    if (!form.fecha_ejecucion) return 'La fecha de ejecución es requerida'
    if (form.fecha_ejecucion > hoy) return 'La fecha de ejecución no puede ser futura'
    const conv = Number(form.convocados)
    const pres = Number(form.presentes)
    const evalR = Number(form.evaluaciones_realizadas)
    const evalA = Number(form.evaluaciones_aprobadas)
    if (form.presentes && form.convocados && pres > conv)
      return 'Asistentes presentes no puede superar convocados'
    if (form.evaluaciones_aprobadas && form.evaluaciones_realizadas && evalA > evalR)
      return 'Evaluaciones aprobadas no puede superar realizadas'
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
        convocados:   form.convocados   ? Number(form.convocados)   : undefined,
        presentes:    form.presentes    ? Number(form.presentes)    : undefined,
        evaluaciones_realizadas: form.evaluaciones_realizadas ? Number(form.evaluaciones_realizadas) : undefined,
        evaluaciones_aprobadas:  form.evaluaciones_aprobadas  ? Number(form.evaluaciones_aprobadas)  : undefined,
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
            onChange={e => set('programacion_id', e.target.value)}
            className="input-field"
          >
            <option value="">Sin programación específica</option>
            {progFiltradas.map(p => {
              const cancelado = p.fields.estado === 'Cancelado'
              return (
                <option key={p.id} value={p.id} disabled={cancelado}
                  style={cancelado ? { color: '#9ca3af' } : undefined}>
                  {p.fields.mes} — Semana {p.fields.semana} ({p.fields.estado})
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
          <input type="date" required value={form.fecha_ejecucion} max={hoy}
            onChange={e => set('fecha_ejecucion', e.target.value)}
            className="input-field" />
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

      {/* Convocados + Presentes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Convocados</label>
          <input type="number" min="0" value={form.convocados}
            onChange={e => set('convocados', e.target.value)}
            className="input-field" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">
            Presentes
            {form.convocados && (
              <span className="ml-1 font-normal text-gray-400">/ {form.convocados} máx.</span>
            )}
          </label>
          <input type="number" min="0"
            max={form.convocados ? Number(form.convocados) : undefined}
            value={form.presentes}
            onChange={e => set('presentes', e.target.value)}
            className={`input-field ${form.presentes && form.convocados && Number(form.presentes) > Number(form.convocados) ? 'border-red-400' : ''}`}
          />
          {form.presentes && form.convocados && Number(form.presentes) > Number(form.convocados) && (
            <p className="text-xs text-red-500 mt-0.5">No puede superar los {form.convocados} convocados.</p>
          )}
        </div>
      </div>

      {/* Evaluaciones realizadas + aprobadas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Evaluaciones realizadas</label>
          <input type="number" min="0" value={form.evaluaciones_realizadas}
            onChange={e => set('evaluaciones_realizadas', e.target.value)}
            className="input-field" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">
            Evaluaciones aprobadas
            {form.evaluaciones_realizadas && (
              <span className="ml-1 font-normal text-gray-400">/ {form.evaluaciones_realizadas} máx.</span>
            )}
          </label>
          <input type="number" min="0"
            max={form.evaluaciones_realizadas ? Number(form.evaluaciones_realizadas) : undefined}
            value={form.evaluaciones_aprobadas}
            onChange={e => set('evaluaciones_aprobadas', e.target.value)}
            className={`input-field ${form.evaluaciones_aprobadas && form.evaluaciones_realizadas && Number(form.evaluaciones_aprobadas) > Number(form.evaluaciones_realizadas) ? 'border-red-400' : ''}`}
          />
          {form.evaluaciones_aprobadas && form.evaluaciones_realizadas && Number(form.evaluaciones_aprobadas) > Number(form.evaluaciones_realizadas) && (
            <p className="text-xs text-red-500 mt-0.5">No puede superar las {form.evaluaciones_realizadas} realizadas.</p>
          )}
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
            guardando ||
            (!!form.presentes && !!form.convocados && Number(form.presentes) > Number(form.convocados)) ||
            (!!form.evaluaciones_aprobadas && !!form.evaluaciones_realizadas && Number(form.evaluaciones_aprobadas) > Number(form.evaluaciones_realizadas))
          }
          className="btn btn-primary flex-1 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar registro'}
        </button>
      </div>
    </form>
  )
}
