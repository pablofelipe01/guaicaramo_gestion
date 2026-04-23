'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  CheckSquare, Plus, AlertTriangle, Clock, CheckCircle,
  MessageSquare, Play, ShieldCheck, Lock, RotateCcw, ChevronRight,
} from 'lucide-react'
import type { AcAccionFields, AcSeguimientoFields } from '@/types/sst/ac'
import type { AirtableRecord } from '@/lib/airtable-client'

type Accion = AirtableRecord<AcAccionFields>
type Seguimiento = AirtableRecord<AcSeguimientoFields>

interface Stats {
  total: number
  porEstado: Record<string, number>
  cerradasATiempo: number
  tasaCierre: number
  tasaTiempo: number
}

interface Alertas { vencidas: Accion[]; proximas: Accion[] }

const ESTADO_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'error' | 'neutral'> = {
  pendiente: 'warning',
  en_proceso: 'info',
  ejecutada: 'info',
  verificada: 'success',
  cerrada: 'success',
  vencida: 'error',
  reabierta: 'warning',
}

const PRIORIDAD_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'error'> = {
  baja: 'neutral', media: 'info', alta: 'warning', critica: 'error',
}

const ORIGEN_LABEL: Record<string, string> = {
  auditoria: 'Auditoría',
  inspeccion: 'Inspección',
  investigacion_at: 'Investigación AT',
  ipvr: 'IPVR',
  otro: 'Otro',
}

const TIPO_LABEL: Record<string, string> = {
  correctiva: 'Correctiva', preventiva: 'Preventiva', mejora: 'Mejora',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function AccionesCorrectivasPage() {
  useAuth()
  const [acciones, setAcciones] = useState<Accion[]>([])
  const [selected, setSelected] = useState<Accion | null>(null)
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [alertas, setAlertas] = useState<Alertas | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
  const [showVerificarModal, setShowVerificarModal] = useState(false)
  const [form, setForm] = useState<Partial<AcAccionFields>>({})
  const [seguimientoNota, setSeguimientoNota] = useState('')
  const [eficaciaConfirmada, setEficaciaConfirmada] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = filtroEstado ? `?estado=${filtroEstado}` : ''
    const [accionesRes, statsRes, alertasRes] = await Promise.all([
      fetch(`/api/sst/acciones${params}`, { headers: authHeaders() }),
      fetch('/api/sst/acciones?vista=estadisticas', { headers: authHeaders() }),
      fetch('/api/sst/acciones?vista=alertas', { headers: authHeaders() }),
    ])
    if (accionesRes.ok) setAcciones((await accionesRes.json()).records)
    if (statsRes.ok) setStats(await statsRes.json())
    if (alertasRes.ok) setAlertas(await alertasRes.json())
    setLoading(false)
  }, [filtroEstado])

  useEffect(() => { load() }, [load])

  const loadSeguimientos = useCallback(async (id: string) => {
    const res = await fetch(`/api/sst/acciones/${id}/seguimientos`, { headers: authHeaders() })
    if (res.ok) setSeguimientos((await res.json()).records)
  }, [])

  const selectAccion = (a: Accion) => {
    setSelected(a)
    loadSeguimientos(a.id)
  }

  const handleSave = async () => {
    if (!form.Titulo || !form.Tipo || !form.Origen || !form.Prioridad || !form['Fecha Limite']) return
    setSaving(true)
    await fetch('/api/sst/acciones', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
    setSaving(false)
    setShowModal(false)
    setForm({})
    load()
  }

  const handleEjecutar = async () => {
    if (!selected) return
    await fetch(`/api/sst/acciones/${selected.id}/ejecutar`, { method: 'PUT', headers: authHeaders() })
    load()
    loadSeguimientos(selected.id)
    setSelected(prev => prev ? { ...prev, fields: { ...prev.fields, Estado: 'ejecutada' } } : null)
  }

  const handleVerificar = async () => {
    if (!selected || eficaciaConfirmada === null) return
    setSaving(true)
    await fetch(`/api/sst/acciones/${selected.id}/verificar`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ confirmada: eficaciaConfirmada }),
    })
    setSaving(false)
    setShowVerificarModal(false)
    setEficaciaConfirmada(null)
    const nuevoEstado = eficaciaConfirmada ? 'verificada' : 'reabierta'
    setSelected(prev => prev ? { ...prev, fields: { ...prev.fields, Estado: nuevoEstado } } : null)
    load()
  }

  const handleCerrar = async () => {
    if (!selected) return
    const res = await fetch(`/api/sst/acciones/${selected.id}/cerrar`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) {
      const err = await res.json()
      alert(err.message)
      return
    }
    setSelected(prev => prev ? { ...prev, fields: { ...prev.fields, Estado: 'cerrada' } } : null)
    load()
  }

  const handleSeguimiento = async () => {
    if (!selected || !seguimientoNota.trim()) return
    setSaving(true)
    await fetch(`/api/sst/acciones/${selected.id}/seguimientos`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ Nota: seguimientoNota }),
    })
    setSaving(false)
    setShowSeguimientoModal(false)
    setSeguimientoNota('')
    loadSeguimientos(selected.id)
  }

  const columns: Column<Accion>[] = [
    { key: 'titulo', header: 'Título', render: r => <span className="font-medium text-sm">{r.fields.Titulo}</span> },
    { key: 'tipo', header: 'Tipo', render: r => TIPO_LABEL[r.fields.Tipo] ?? r.fields.Tipo },
    { key: 'origen', header: 'Origen', render: r => ORIGEN_LABEL[r.fields.Origen] ?? r.fields.Origen },
    {
      key: 'prioridad', header: 'Prioridad',
      render: r => <StatusBadge label={r.fields.Prioridad} variant={PRIORIDAD_VARIANT[r.fields.Prioridad] ?? 'neutral'} />,
    },
    {
      key: 'estado', header: 'Estado',
      render: r => <StatusBadge label={r.fields.Estado.replace('_', ' ')} variant={ESTADO_VARIANT[r.fields.Estado] ?? 'info'} />,
    },
    { key: 'limite', header: 'Fecha Límite', render: r => r.fields['Fecha Limite'] },
    {
      key: 'ver', header: '',
      render: r => (
        <button onClick={() => selectAccion(r)} className="text-blue-600 text-sm hover:underline flex items-center gap-0.5">
          Ver <ChevronRight size={14} />
        </button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Acciones Correctivas, Preventivas y de Mejora"
        description="Ciclo ACTUAR — seguimiento hasta verificación de eficacia"
        icon={CheckSquare}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Plus size={16} /> Nueva Acción
          </button>
        }
      />

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><div className="p-4 text-center"><p className="text-2xl font-bold text-gray-800">{stats.total}</p><p className="text-xs text-gray-500 mt-1">Total acciones</p></div></Card>
          <Card><div className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{(stats.porEstado['pendiente'] ?? 0) + (stats.porEstado['en_proceso'] ?? 0)}</p><p className="text-xs text-gray-500 mt-1">En proceso</p></div></Card>
          <Card><div className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.tasaCierre}%</p><p className="text-xs text-gray-500 mt-1">Tasa de cierre</p></div></Card>
          <Card><div className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.tasaTiempo}%</p><p className="text-xs text-gray-500 mt-1">Cierre a tiempo</p></div></Card>
        </div>
      )}

      {/* Alertas */}
      {alertas && (alertas.vencidas.length > 0 || alertas.proximas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertas.vencidas.length > 0 && (
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-600" />
                  <h3 className="font-medium text-sm text-red-700">Vencidas ({alertas.vencidas.length})</h3>
                </div>
                <div className="space-y-2">
                  {alertas.vencidas.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-sm bg-red-50 rounded px-3 py-2">
                      <span className="text-gray-700 truncate flex-1 mr-2">{a.fields.Titulo}</span>
                      <span className="text-red-600 text-xs shrink-0">{a.fields['Fecha Limite']}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
          {alertas.proximas.length > 0 && (
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-amber-600" />
                  <h3 className="font-medium text-sm text-amber-700">Próximas a vencer ({alertas.proximas.length})</h3>
                </div>
                <div className="space-y-2">
                  {alertas.proximas.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-sm bg-amber-50 rounded px-3 py-2">
                      <span className="text-gray-700 truncate flex-1 mr-2">{a.fields.Titulo}</span>
                      <span className="text-amber-600 text-xs shrink-0">{a.fields['Fecha Limite']}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="ejecutada">Ejecutada</option>
              <option value="verificada">Verificada</option>
              <option value="cerrada">Cerrada</option>
              <option value="vencida">Vencida</option>
              <option value="reabierta">Reabierta</option>
            </select>
          </div>
          <Card>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : acciones.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Sin acciones" description="No hay acciones para el filtro seleccionado" />
            ) : (
              <DataTable columns={columns} data={acciones} />
            )}
          </Card>
        </div>

        {/* Panel lateral de detalle */}
        <div>
          {selected ? (
            <Card>
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm leading-tight">{selected.fields.Titulo}</h3>
                  <StatusBadge
                    label={selected.fields.Estado.replace('_', ' ')}
                    variant={ESTADO_VARIANT[selected.fields.Estado] ?? 'info'}
                  />
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  <StatusBadge label={TIPO_LABEL[selected.fields.Tipo]} variant="neutral" />
                  <StatusBadge label={ORIGEN_LABEL[selected.fields.Origen] ?? selected.fields.Origen} variant="neutral" />
                  <StatusBadge label={selected.fields.Prioridad} variant={PRIORIDAD_VARIANT[selected.fields.Prioridad] ?? 'neutral'} />
                </div>
                <p className="text-xs text-gray-500 mb-1">Fecha límite: <span className="text-gray-700 font-medium">{selected.fields['Fecha Limite']}</span></p>
                {selected.fields['Responsable Nombre'] && (
                  <p className="text-xs text-gray-500">Responsable: <span className="text-gray-700">{selected.fields['Responsable Nombre']}</span></p>
                )}
                <p className="text-xs text-gray-600 mt-2">{selected.fields.Descripcion}</p>

                {/* Flujo de transición */}
                <div className="mt-4 flex flex-col gap-2">
                  {(selected.fields.Estado === 'pendiente' || selected.fields.Estado === 'reabierta') && (
                    <button
                      onClick={handleEjecutar}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Play size={13} /> Marcar en proceso
                    </button>
                  )}
                  {selected.fields.Estado === 'en_proceso' && (
                    <button
                      onClick={handleEjecutar}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <CheckCircle size={13} /> Marcar como ejecutada
                    </button>
                  )}
                  {selected.fields.Estado === 'ejecutada' && (
                    <button
                      onClick={() => setShowVerificarModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      <ShieldCheck size={13} /> Verificar eficacia
                    </button>
                  )}
                  {selected.fields.Estado === 'verificada' && (
                    <button
                      onClick={handleCerrar}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
                    >
                      <Lock size={13} /> Cerrar acción
                    </button>
                  )}
                  {selected.fields.Estado === 'cerrada' && (
                    <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium py-1">
                      <CheckCircle size={14} /> Acción cerrada
                    </div>
                  )}
                  {selected.fields.Estado !== 'cerrada' && (
                    <button
                      onClick={() => setShowSeguimientoModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      <MessageSquare size={13} /> Agregar seguimiento
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Seguimientos ({seguimientos.length})
                </h4>
                {seguimientos.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin notas de seguimiento.</p>
                ) : (
                  <div className="space-y-2">
                    {seguimientos.map(s => (
                      <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{s.fields.Nota}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {s.fields['Responsable Nombre'] && `${s.fields['Responsable Nombre']} · `}
                          {new Date(s.fields['Creado En']).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={CheckSquare} title="Selecciona una acción" description="Haz clic en una fila para ver el detalle y las transiciones de estado" />
            </Card>
          )}
        </div>
      </div>

      {/* Modal nueva acción */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Nueva Acción">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.Titulo ?? ''}
              onChange={e => setForm(f => ({ ...f, Titulo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              value={form.Descripcion ?? ''}
              onChange={e => setForm(f => ({ ...f, Descripcion: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Tipo ?? ''}
                onChange={e => setForm(f => ({ ...f, Tipo: e.target.value as AcAccionFields['Tipo'] }))}>
                <option value="">Seleccionar...</option>
                <option value="correctiva">Correctiva</option>
                <option value="preventiva">Preventiva</option>
                <option value="mejora">Mejora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Origen ?? ''}
                onChange={e => setForm(f => ({ ...f, Origen: e.target.value as AcAccionFields['Origen'] }))}>
                <option value="">Seleccionar...</option>
                <option value="auditoria">Auditoría</option>
                <option value="inspeccion">Inspección</option>
                <option value="investigacion_at">Investigación AT</option>
                <option value="ipvr">IPVR</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Prioridad ?? ''}
                onChange={e => setForm(f => ({ ...f, Prioridad: e.target.value as AcAccionFields['Prioridad'] }))}>
                <option value="">Seleccionar...</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Fecha Limite'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Limite': e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Nombre del responsable"
              value={form['Responsable Nombre'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Responsable Nombre': e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.Titulo || !form.Tipo || !form.Origen || !form.Prioridad || !form['Fecha Limite']}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Acción'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal seguimiento */}
      <Modal open={showSeguimientoModal} onClose={() => { setShowSeguimientoModal(false); setSeguimientoNota('') }} title="Agregar Nota de Seguimiento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota *</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4}
              placeholder="Describe el avance o novedad..."
              value={seguimientoNota}
              onChange={e => setSeguimientoNota(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowSeguimientoModal(false); setSeguimientoNota('') }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSeguimiento}
              disabled={saving || !seguimientoNota.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal verificar eficacia */}
      <Modal open={showVerificarModal} onClose={() => { setShowVerificarModal(false); setEficaciaConfirmada(null) }} title="Verificación de Eficacia">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿La acción implementada fue eficaz? Esta verificación es <strong>obligatoria</strong> antes del cierre definitivo.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setEficaciaConfirmada(true)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                eficaciaConfirmada === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <CheckCircle size={16} /> Sí, fue eficaz
            </button>
            <button
              onClick={() => setEficaciaConfirmada(false)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                eficaciaConfirmada === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <RotateCcw size={16} /> No, reabrir
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowVerificarModal(false); setEficaciaConfirmada(null) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleVerificar}
              disabled={saving || eficaciaConfirmada === null}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Confirmar verificación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
