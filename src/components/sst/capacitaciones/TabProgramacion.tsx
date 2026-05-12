'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Plus, Check, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { CAP_COLORS, MESES_CAP } from '@/lib/sst/cap-client'
import { getAuthHeaders } from '@/lib/client/authFetch'
import type { CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Prog = AirtableRecord<CapProgramacionFields>

export interface TabProgramacionProps {
  actividadId: string
  programaciones: Prog[]
  onRefresh: () => Promise<void>
  toastSuccess: (title: string, msg?: string) => void
  toastError:   (title: string, msg?: string) => void
}

// ─── Formulario vacío ─────────────────────────────────────────────────────────

const FORM_VACÍO = {
  fecha_programada: '',
  mes:             '',
  semana:          '',
  observaciones:   '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string | undefined | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}

function getProgColor(prog: Prog): string {
  if (prog.fields.estado === 'Ejecutado') return CAP_COLORS.verde
  if (prog.fields.esta_vencida) return CAP_COLORS.rojo
  return CAP_COLORS.gris
}

function getProgNumber(prog: Prog, idx: number, progs: Prog[]): number {
  // Número secuencial basado en fecha_programada ascendente (ya vienen ordenadas)
  return idx + 1
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TabProgramacion({
  actividadId,
  programaciones,
  onRefresh,
  toastSuccess,
  toastError,
}: TabProgramacionProps) {
  const [formOpen,  setFormOpen]  = useState(false)
  const [form,      setForm]      = useState(FORM_VACÍO)
  const [formErr,   setFormErr]   = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const abrirFormulario = () => {
    setForm(FORM_VACÍO)
    setFormErr(null)
    setFormOpen(true)
  }

  const guardar = useCallback(async () => {
    if (!form.fecha_programada) { setFormErr('La fecha programada es obligatoria.'); return }
    if (!form.mes)    { setFormErr('El mes es obligatorio.'); return }
    if (!form.semana) { setFormErr('La semana es obligatoria.'); return }

    setGuardando(true)
    setFormErr(null)
    try {
      const body: Record<string, unknown> = {
        actividad_id:     actividadId,
        fecha_programada: form.fecha_programada,
        mes:              form.mes,
        semana:           parseInt(form.semana, 10),
      }
      if (form.observaciones) body.observaciones = form.observaciones

      const res = await fetch('/api/sst/capacitaciones/programacion', {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? `Error ${res.status}`)
      }

      setFormOpen(false)
      setForm(FORM_VACÍO)
      toastSuccess('Sesión programada', `Fecha: ${formatFecha(form.fecha_programada)}`)
      await onRefresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      setFormErr(msg)
      toastError('Error al programar', msg)
    }
    setGuardando(false)
  }, [form, actividadId, onRefresh, toastSuccess, toastError])

  // ── Render vacío ────────────────────────────────────────────────────────────
  if (programaciones.length === 0 && !formOpen) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: CAP_COLORS.azulLight }}>
          <CalendarDays className="w-6 h-6" style={{ color: CAP_COLORS.azul }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Sin sesiones programadas</p>
          <p className="text-xs text-gray-400 mt-1">
            Agrega la primera sesión para iniciar el cronograma.
          </p>
        </div>
        <button
          onClick={abrirFormulario}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: CAP_COLORS.azul }}
        >
          <Plus className="w-4 h-4" />
          Programar primera sesión
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Lista de sesiones ──────────────────────────────────────────────── */}
      {programaciones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Sesiones programadas
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({programaciones.length})
              </span>
            </h3>
            <button
              onClick={abrirFormulario}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ background: CAP_COLORS.azul }}
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar sesión
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {programaciones.map((prog, idx) => {
              const color    = getProgColor(prog)
              const numero   = getProgNumber(prog, idx, programaciones)
              const ejecutado = prog.fields.estado === 'Ejecutado'
              const vencido  = !!prog.fields.esta_vencida && !ejecutado

              return (
                <div key={prog.id} className="flex items-start gap-3 px-4 py-3">
                  {/* Círculo numerado */}
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: color }}
                  >
                    {ejecutado ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">{numero}</span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: color + '22',
                          color,
                        }}
                      >
                        {prog.fields.estado}
                        {vencido && ' · Vencida'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Semana {prog.fields.semana} — {prog.fields.mes}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-800 mt-1 capitalize">
                      {formatFecha(prog.fields.fecha_programada)}
                    </p>

                    {prog.fields.observaciones && (
                      <p className="text-[11px] text-gray-400 mt-1">{prog.fields.observaciones}</p>
                    )}


                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Formulario inline ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-700">Nueva sesión</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fecha */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Fecha programada *
                  </label>
                  <input
                    type="date"
                    value={form.fecha_programada}
                    onChange={e => setForm(p => ({ ...p, fecha_programada: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                {/* Mes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Mes *</label>
                  <select
                    value={form.mes}
                    onChange={e => setForm(p => ({ ...p, mes: e.target.value }))}
                    className="input-field text-sm"
                  >
                    <option value="">Seleccionar mes</option>
                    {MESES_CAP.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Semana */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Semana *</label>
                  <select
                    value={form.semana}
                    onChange={e => setForm(p => ({ ...p, semana: e.target.value }))}
                    className="input-field text-sm"
                  >
                    <option value="">Seleccionar semana</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>Semana {n}</option>
                    ))}
                  </select>
                </div>

                {/* Observaciones */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-gray-600">Observaciones</label>
                  <textarea
                    rows={2}
                    value={form.observaciones}
                    onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                    className="input-field text-sm resize-none"
                  />
                </div>
              </div>

              {/* Error */}
              {formErr && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {formErr}
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => { setFormOpen(false); setForm(FORM_VACÍO); setFormErr(null) }}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-xl font-semibold text-white disabled:opacity-60"
                  style={{ background: CAP_COLORS.azul }}
                >
                  {guardando && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {guardando ? 'Guardando…' : 'Guardar sesión'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante inferior cuando ya hay sesiones y el form está cerrado */}
      {programaciones.length > 0 && !formOpen && (
        <button
          onClick={abrirFormulario}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-dashed text-center justify-center transition-colors hover:bg-green-50"
          style={{ borderColor: CAP_COLORS.azul + '66', color: CAP_COLORS.azul }}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar otra sesión
        </button>
      )}
    </div>
  )
}
