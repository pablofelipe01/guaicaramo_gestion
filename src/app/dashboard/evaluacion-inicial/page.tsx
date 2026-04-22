'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClipboardCheck, Plus, CheckCircle2, XCircle, MinusCircle, AlertCircle, Lock } from 'lucide-react'
import type { EvalEvaluacionFields, EvalEstandarFields, EvalRespuestaFields } from '@/types/sst/eval'
import type { AirtableRecord } from '@/lib/airtable-client'

type Evaluacion = AirtableRecord<EvalEvaluacionFields>
type Estandar = AirtableRecord<EvalEstandarFields>
type Respuesta = AirtableRecord<EvalRespuestaFields>

const NIVEL_VARIANT: Record<string, 'error' | 'warning' | 'success'> = {
  critico: 'error', moderado: 'warning', aceptable: 'success',
}
const RESULTADO_ICON: Record<string, React.ReactNode> = {
  cumple: <CheckCircle2 size={16} className="text-green-500" />,
  parcial: <MinusCircle size={16} className="text-yellow-500" />,
  no_cumple: <XCircle size={16} className="text-red-500" />,
  no_aplica: <AlertCircle size={16} className="text-gray-400" />,
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function EvaluacionInicialPage() {
  const { user } = useAuth()
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState<Evaluacion | null>(null)
  const [estandares, setEstandares] = useState<Estandar[]>([])
  const [respuestas, setRespuestas] = useState<Respuesta[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalNueva, setModalNueva] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [form, setForm] = useState({ Titulo: '', Descripcion: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/evaluaciones', { headers: authHeaders() })
    const data = await res.json()
    setEvaluaciones(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback(async (ev: Evaluacion) => {
    setSeleccionada(ev)
    setLoadingDetalle(true)
    try {
      const [estRes, respRes] = await Promise.all([
        fetch('/api/sst/estandares', { headers: authHeaders() }),
        fetch(`/api/sst/evaluaciones/${ev.id}/respuestas`, { headers: authHeaders() }),
      ])
      if (estRes.ok) {
        const est = await estRes.json()
        setEstandares(est.records ?? [])
      }
      if (respRes.ok) {
        const resp = await respRes.json()
        setRespuestas(resp.records ?? [])
      }
    } catch (error) {
      console.error('Error cargando evaluación:', error)
    }
    setLoadingDetalle(false)
  }, [])

  const crearEvaluacion = async () => {
    if (!form.Titulo) return
    setGuardando(true)
    await fetch('/api/sst/evaluaciones', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...form, Responsable: user?.name }),
    })
    setModalNueva(false)
    setForm({ Titulo: '', Descripcion: '' })
    await cargar()
    setGuardando(false)
  }

  const responder = async (estandarId: string, estandarNombre: string, resultado: string) => {
    if (!seleccionada) return
    try {
      await fetch(`/api/sst/evaluaciones/${seleccionada.id}/respuestas`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ 'Estandar ID': estandarId, 'Estandar Nombre': estandarNombre, Resultado: resultado }),
      })
      const res = await fetch(`/api/sst/evaluaciones/${seleccionada.id}/respuestas`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setRespuestas(data.records ?? [])
      }
    } catch (error) {
      console.error('Error respondiendo:', error)
    }
  }

  const cerrarEvaluacion = async () => {
    if (!seleccionada) return
    setCerrando(true)
    try {
      const res = await fetch(`/api/sst/evaluaciones/${seleccionada.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ accion: 'cerrar' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSeleccionada(data.record)
        await cargar()
      }
    } catch (error) {
      console.error('Error cerrando evaluación:', error)
    }
    setCerrando(false)
  }

  const getRespuesta = (estandarId: string) =>
    respuestas.find(r => r.fields['Estandar ID'] === estandarId)

  const columnas: Column<Evaluacion>[] = [
    { key: 'Titulo', header: 'Título', render: r => <span className="font-medium">{r.fields.Titulo}</span> },
    { key: 'Estado', header: 'Estado', render: r => (
      <StatusBadge variant={r.fields.Estado === 'cerrada' ? 'neutral' : 'primary'} label={r.fields.Estado} />
    )},
    { key: 'Nivel', header: 'Nivel', render: r => r.fields.Nivel ? (
      <StatusBadge variant={NIVEL_VARIANT[r.fields.Nivel]} label={r.fields.Nivel} />
    ) : <span className="text-gray-400 text-xs">—</span> },
    { key: 'Puntaje', header: 'Puntaje', render: r => r.fields['Puntaje Total'] != null
      ? <span className="font-semibold">{r.fields['Puntaje Total'].toFixed(1)}%</span>
      : <span className="text-gray-400 text-xs">—</span> },
    { key: 'Responsable', header: 'Responsable', render: r => <span className="text-sm text-gray-600">{r.fields.Responsable}</span> },
  ]

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={ClipboardCheck}
        title="Evaluación Inicial"
        description="Res. 0312/2019 — Estándares mínimos del SG-SST"
        actions={
          <button
            onClick={() => setModalNueva(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} /> Nueva evaluación
          </button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full overflow-auto p-0">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
            ) : evaluaciones.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Sin evaluaciones" description="Crea la primera evaluación inicial" />
            ) : (
              <ul>
                {evaluaciones.map(ev => (
                  <li
                    key={ev.id}
                    onClick={() => seleccionar(ev)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${seleccionada?.id === ev.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">{ev.fields.Titulo}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge variant={ev.fields.Estado === 'cerrada' ? 'neutral' : 'primary'} label={ev.fields.Estado} />
                      {ev.fields.Nivel && <StatusBadge variant={NIVEL_VARIANT[ev.fields.Nivel]} label={ev.fields.Nivel} />}
                    </div>
                    {ev.fields['Puntaje Total'] != null && (
                      <div className="text-xs text-gray-500 mt-1">Puntaje: {ev.fields['Puntaje Total'].toFixed(1)}%</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Detalle */}
        <div className="flex-1 min-w-0">
          {!seleccionada ? (
            <Card className="h-full flex items-center justify-center">
              <EmptyState icon={ClipboardCheck} title="Selecciona una evaluación" description="Haz clic en una evaluación para ver y responder sus estándares" />
            </Card>
          ) : (
            <Card className="h-full flex flex-col overflow-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{seleccionada.fields.Titulo}</h2>
                  {seleccionada.fields.Descripcion && <p className="text-sm text-gray-500 mt-1">{seleccionada.fields.Descripcion}</p>}
                </div>
                {seleccionada.fields.Estado === 'en_progreso' && (
                  <button
                    onClick={cerrarEvaluacion}
                    disabled={cerrando}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    <Lock size={14} /> {cerrando ? 'Cerrando...' : 'Cerrar y calcular'}
                  </button>
                )}
              </div>

              {loadingDetalle ? (
                <div className="text-center text-gray-500 text-sm py-8">Cargando estándares...</div>
              ) : estandares.length === 0 ? (
                <EmptyState icon={AlertCircle} title="Sin estándares configurados" description="Agrega estándares para comenzar la evaluación" />
              ) : (
                <div className="space-y-2">
                  {estandares.map(est => {
                    const resp = getRespuesta(est.id)
                    const cerrada = seleccionada.fields.Estado === 'cerrada'
                    return (
                      <div key={est.id} className="border rounded-lg p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">{est.fields.Codigo}</span>
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{est.fields['Ciclo PHVA']}</span>
                            <span className="text-xs text-gray-500">{est.fields['Peso Porcentual']}%</span>
                          </div>
                          <div className="text-sm font-medium text-gray-800 mt-0.5 truncate">{est.fields.Nombre}</div>
                        </div>
                        {resp ? (
                          <div className="flex items-center gap-1">
                            {RESULTADO_ICON[resp.fields.Resultado]}
                            <span className="text-xs text-gray-600">{resp.fields.Resultado}</span>
                          </div>
                        ) : cerrada ? (
                          <span className="text-xs text-gray-400">sin resp.</span>
                        ) : (
                          <div className="flex gap-1">
                            {(['cumple', 'parcial', 'no_cumple', 'no_aplica'] as const).map(r => (
                              <button
                                key={r}
                                onClick={() => responder(est.id, est.fields.Nombre, r)}
                                className="text-xs px-2 py-1 border rounded hover:bg-gray-50 transition-colors"
                                title={r}
                              >
                                {RESULTADO_ICON[r]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Modal nueva evaluación */}
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva evaluación inicial" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.Titulo}
              onChange={e => setForm(f => ({ ...f, Titulo: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ej. Evaluación inicial 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.Descripcion}
              onChange={e => setForm(f => ({ ...f, Descripcion: e.target.value }))}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalNueva(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button
              onClick={crearEvaluacion}
              disabled={guardando || !form.Titulo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
