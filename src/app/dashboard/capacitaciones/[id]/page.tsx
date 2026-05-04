'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { EstadoBadge } from '@/components/sst/capacitaciones/EstadoBadge'
import { RegistroForm } from '@/components/sst/capacitaciones/RegistroForm'
import { getCategoriaColor } from '@/lib/sst/cap-client'
import {
  ArrowLeft, Award, Users, Calendar, ClipboardCheck, BookOpen,
  AlertTriangle, Pencil, Plus,
} from 'lucide-react'
import type { CapActividadFields, CapProgramacionFields, CapRegistroFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>
type Registro = AirtableRecord<CapRegistroFields>

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function CapacitacionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [actividad, setActividad] = useState<Actividad | null>(null)
  const [programaciones, setProgramaciones] = useState<Prog[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalRegistro, setModalRegistro] = useState(false)
  const [modalProg, setModalProg] = useState(false)
  const [formProg, setFormProg] = useState({ mes: 'Enero', semana: '1', fecha_programada: '' })
  const [guardandoProg, setGuardandoProg] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [actRes, progRes, regRes] = await Promise.all([
        fetch(`/api/sst/capacitaciones/${id}`, { headers: authHeaders() }),
        fetch(`/api/sst/capacitaciones/programacion?actividad_id=${id}`, { headers: authHeaders() }),
        fetch(`/api/sst/capacitaciones/registros?actividad_id=${id}`, { headers: authHeaders() }),
      ])
      if (actRes.ok) {
        const d = await actRes.json()
        setActividad(d.record)
      } else {
        setError('Actividad no encontrada')
      }
      if (progRes.ok) {
        const d = await progRes.json()
        setProgramaciones(d.records ?? [])
      }
      if (regRes.ok) {
        const d = await regRes.json()
        setRegistros(d.records ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const crearProgramacion = async () => {
    setGuardandoProg(true)
    try {
      await fetch('/api/sst/capacitaciones/programacion', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          actividad_id: id,
          mes: formProg.mes,
          semana: Number(formProg.semana),
          fecha_programada: formProg.fecha_programada || undefined,
        }),
      })
      setModalProg(false)
      await cargar()
    } catch (e) {
      console.error(e)
    }
    setGuardandoProg(false)
  }

  const guardarRegistro = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/sst/capacitaciones/registros', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error al guardar')
    }
    setModalRegistro(false)
    await cargar()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !actividad) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <p className="text-red-600">{error ?? 'No encontrado'}</p>
      </div>
    )
  }

  const f = actividad.fields
  const color = getCategoriaColor(f.categoria)

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="mt-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              Ítem #{f.item_numero}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color + 'bb' }}
            >
              {f.categoria}
            </span>
            <EstadoBadge estado={f.estado_general} size="md" />
            {f.requiere_certificacion && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <Award className="w-3.5 h-3.5" /> Certificación requerida
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{f.tema}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Información */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" /> Información
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase">Proveedor</span>
                <p className="font-medium text-gray-700">{f.proveedor}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase">Responsable</span>
                <p className="font-medium text-gray-700">{f.responsable || '—'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase">Dirigido a</span>
                <p className="font-medium text-gray-700">{f.dirigido_a || '—'}</p>
              </div>
              {f.normativa_aplicable && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 uppercase">Normativa</span>
                  <p className="font-medium text-gray-700">{f.normativa_aplicable}</p>
                </div>
              )}
              {f.objetivo && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 uppercase">Objetivo</span>
                  <p className="text-gray-700 whitespace-pre-line">{f.objetivo}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Registros de ejecución */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-green-500" />
                Registros de ejecución ({registros.length})
              </h2>
              <button
                onClick={() => setModalRegistro(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar ejecución
              </button>
            </div>
            {registros.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin registros de ejecución</p>
            ) : (
              <div className="flex flex-col gap-2">
                {registros.map(r => {
                  const rf = r.fields
                  const pct = rf.asistentes_convocados && rf.asistentes_presentes
                    ? Math.round((rf.asistentes_presentes / rf.asistentes_convocados) * 100)
                    : null
                  return (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{rf.fecha_ejecucion}</span>
                        {rf.lugar && <span className="text-gray-500 text-xs">{rf.lugar}</span>}
                      </div>
                      {rf.facilitador && (
                        <p className="text-gray-500 text-xs mt-0.5">Facilitador: {rf.facilitador}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-600">
                        {rf.asistentes_presentes != null && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {rf.asistentes_presentes}/{rf.asistentes_convocados ?? '?'} asistentes
                            {pct != null && ` (${pct}%)`}
                          </span>
                        )}
                        {rf.evaluaciones_realizadas != null && (
                          <span>{rf.evaluaciones_aprobadas}/{rf.evaluaciones_realizadas} eval.</span>
                        )}
                        {rf.duracion_horas && <span>{rf.duracion_horas}h</span>}
                      </div>
                      {rf.observaciones && (
                        <p className="text-gray-500 text-xs mt-1 italic">{rf.observaciones}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Columna lateral: programación */}
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                Programación ({programaciones.length})
              </h2>
              <button
                onClick={() => setModalProg(true)}
                className="text-blue-600 hover:text-blue-700 transition-colors"
                title="Agregar programación"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {programaciones.length === 0 ? (
              <div className="text-center py-4">
                <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Sin fechas programadas</p>
                <button
                  onClick={() => setModalProg(true)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Programar ahora
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {programaciones.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-gray-800">{p.fields.mes}</span>
                      <span className="text-gray-400 ml-1 text-xs">Sem. {p.fields.semana}</span>
                      {p.fields.fecha_programada && (
                        <p className="text-xs text-gray-400">{p.fields.fecha_programada}</p>
                      )}
                    </div>
                    <EstadoBadge estado={p.fields.estado} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal registro */}
      <Modal open={modalRegistro} onClose={() => setModalRegistro(false)} title="">
        <RegistroForm
          actividades={actividad ? [actividad] : []}
          programaciones={programaciones}
          actividadPreseleccionada={id}
          onGuardar={guardarRegistro}
          onCancelar={() => setModalRegistro(false)}
        />
      </Modal>

      {/* Modal programación */}
      <Modal open={modalProg} onClose={() => setModalProg(false)} title="Agregar programación">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Mes</label>
              <select
                value={formProg.mes}
                onChange={e => setFormProg(p => ({ ...p, mes: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Semana</label>
              <select
                value={formProg.semana}
                onChange={e => setFormProg(p => ({ ...p, semana: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Semana {s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Fecha programada (opcional)</label>
            <input
              type="date"
              value={formProg.fecha_programada}
              onChange={e => setFormProg(p => ({ ...p, fecha_programada: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalProg(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              onClick={crearProgramacion}
              disabled={guardandoProg}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {guardandoProg ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
