'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertTriangle, Plus, Search, BarChart3 } from 'lucide-react'
import type { IncIncidenteFields, IncInvestigacionFields } from '@/types/sst/inc'
import type { AirtableRecord } from '@/lib/airtable-client'

type Incidente = AirtableRecord<IncIncidenteFields>
type Investigacion = AirtableRecord<IncInvestigacionFields>

const TIPO_VARIANT: Record<string, 'info' | 'warning' | 'error'> = {
  incidente: 'info',
  accidente_trabajo: 'error',
  enfermedad_laboral: 'warning',
}

const TIPO_LABEL: Record<string, string> = {
  incidente: 'Incidente',
  accidente_trabajo: 'Accidente de Trabajo',
  enfermedad_laboral: 'Enfermedad Laboral',
}

const ESTADO_VARIANT: Record<string, 'warning' | 'info' | 'success'> = {
  reportado: 'warning',
  en_investigacion: 'info',
  cerrado: 'success',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function IncidentesPage() {
  useAuth()
  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [selected, setSelected] = useState<Incidente | null>(null)
  const [investigaciones, setInvestigaciones] = useState<Investigacion[]>([])
  const [stats, setStats] = useState<{ total: number; accidentesTrabajo: number; enfermedadesLaborales: number; diasPerdidos: number } | null>(null)
  const [activeTab, setActiveTab] = useState<'lista' | 'estadisticas'>('lista')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showInvModal, setShowInvModal] = useState(false)
  const [form, setForm] = useState<Partial<IncIncidenteFields>>({})
  const [invForm, setInvForm] = useState<Partial<IncInvestigacionFields>>({})
  const [saving, setSaving] = useState(false)

  const anioActual = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    const [incRes, statsRes] = await Promise.all([
      fetch('/api/sst/incidentes', { headers: authHeaders() }),
      fetch(`/api/sst/incidentes?anio=${anioActual}`, { headers: authHeaders() }),
    ])
    if (incRes.ok) setIncidentes((await incRes.json()).records)
    if (statsRes.ok) setStats(await statsRes.json())
    setLoading(false)
  }, [anioActual])

  useEffect(() => { load() }, [load])

  const loadInvestigaciones = useCallback(async (id: string) => {
    const res = await fetch(`/api/sst/incidentes/${id}/investigaciones`, { headers: authHeaders() })
    if (res.ok) setInvestigaciones((await res.json()).records)
  }, [])

  const selectIncidente = (inc: Incidente) => {
    setSelected(inc)
    loadInvestigaciones(inc.id)
  }

  const handleSave = async () => {
    if (!form['Trabajador ID'] || !form.Tipo || !form['Fecha Ocurrencia'] || !form.Descripcion) return
    setSaving(true)
    await fetch('/api/sst/incidentes', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
    setSaving(false)
    setShowModal(false)
    setForm({})
    load()
  }

  const handleInvestigacion = async () => {
    if (!selected || !invForm.Metodologia) return
    setSaving(true)
    await fetch(`/api/sst/incidentes/${selected.id}/investigaciones`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(invForm),
    })
    setSaving(false)
    setShowInvModal(false)
    setInvForm({})
    loadInvestigaciones(selected.id)
    await fetch(`/api/sst/incidentes/${selected.id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ Estado: 'en_investigacion' }),
    })
    load()
  }

  const columns: Column<Incidente>[] = [
    { key: 'tipo', header: 'Tipo', render: r => <StatusBadge label={TIPO_LABEL[r.fields.Tipo]} variant={TIPO_VARIANT[r.fields.Tipo]} /> },
    { key: 'trabajador', header: 'Trabajador', render: r => r.fields['Trabajador Nombre'] ?? r.fields['Trabajador ID'] },
    { key: 'area', header: 'Área', render: r => r.fields.Area ?? '—' },
    { key: 'fecha', header: 'Fecha', render: r => r.fields['Fecha Ocurrencia'] },
    { key: 'estado', header: 'Estado', render: r => <StatusBadge label={r.fields.Estado.replace(/_/g, ' ')} variant={ESTADO_VARIANT[r.fields.Estado] ?? 'info'} /> },
    { key: 'dias', header: 'Días perdidos', render: r => r.fields['Dias Perdidos'] ?? 0 },
    {
      key: 'ver', header: '',
      render: r => (
        <button onClick={() => selectIncidente(r)} className="text-blue-600 text-sm hover:underline">Ver</button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Investigación de Incidentes y AT"
        description="Reporte, investigación y estadísticas de accidentalidad (Decreto 1530/1996)"
        icon={AlertTriangle}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus size={16} /> Reportar Incidente
          </button>
        }
      />

      <div className="flex gap-2">
        {(['lista', 'estadisticas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {tab === 'lista' ? 'Lista' : 'Estadísticas'}
          </button>
        ))}
      </div>

      {activeTab === 'estadisticas' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total eventos', value: stats.total, color: 'blue' },
            { label: 'Accidentes de trabajo', value: stats.accidentesTrabajo, color: 'red' },
            { label: 'Enfermedades laborales', value: stats.enfermedadesLaborales, color: 'orange' },
            { label: 'Días perdidos', value: stats.diasPerdidos, color: 'purple' },
          ].map(s => (
            <Card key={s.label}>
              <div className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                <p className="text-xs text-gray-400">{anioActual}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'lista' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando...</div>
              ) : incidentes.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="Sin incidentes reportados" description="Registra el primer evento" />
              ) : (
                <DataTable columns={columns} data={incidentes} />
              )}
            </Card>
          </div>

          <div>
            {selected ? (
              <Card>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge label={TIPO_LABEL[selected.fields.Tipo]} variant={TIPO_VARIANT[selected.fields.Tipo]} />
                    <StatusBadge label={selected.fields.Estado.replace(/_/g, ' ')} variant={ESTADO_VARIANT[selected.fields.Estado] ?? 'info'} />
                  </div>
                  <p className="text-sm font-medium">{selected.fields['Trabajador Nombre']}</p>
                  <p className="text-xs text-gray-500">{selected.fields['Fecha Ocurrencia']}</p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-4">{selected.fields.Descripcion}</p>
                  {selected.fields.Estado === 'reportado' && (
                    <button
                      onClick={() => setShowInvModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
                    >
                      <Search size={14} /> Iniciar Investigación
                    </button>
                  )}
                  {investigaciones.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Investigación</p>
                      {investigaciones.map(inv => (
                        <div key={inv.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-medium">{inv.fields.Metodologia.replace(/_/g, ' ')}</p>
                          <StatusBadge label={inv.fields.Estado.replace(/_/g, ' ')} variant={inv.fields.Estado === 'cerrada' ? 'success' : 'info'} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card>
                <EmptyState icon={BarChart3} title="Selecciona un incidente" description="Haz clic en un registro para ver detalles" />
              </Card>
            )}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Reportar Incidente / Accidente">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.Tipo ?? ''}
              onChange={e => setForm(f => ({ ...f, Tipo: e.target.value as IncIncidenteFields['Tipo'] }))}
            >
              <option value="">Seleccionar...</option>
              <option value="incidente">Incidente</option>
              <option value="accidente_trabajo">Accidente de Trabajo</option>
              <option value="enfermedad_laboral">Enfermedad Laboral</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador ID *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Trabajador ID'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Trabajador ID': e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Trabajador</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Trabajador Nombre'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Trabajador Nombre': e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Ocurrencia *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Fecha Ocurrencia'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Ocurrencia': e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Area ?? ''}
                onChange={e => setForm(f => ({ ...f, Area: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              value={form.Descripcion ?? ''}
              onChange={e => setForm(f => ({ ...f, Descripcion: e.target.value }))} />
          </div>
          {form.Tipo === 'accidente_trabajo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días Perdidos</label>
              <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Dias Perdidos'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Dias Perdidos': parseInt(e.target.value) }))} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form['Trabajador ID'] || !form.Tipo || !form['Fecha Ocurrencia'] || !form.Descripcion}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Reportar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showInvModal} onClose={() => { setShowInvModal(false); setInvForm({}) }} title="Iniciar Investigación">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metodología *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={invForm.Metodologia ?? ''}
              onChange={e => setInvForm(f => ({ ...f, Metodologia: e.target.value as IncInvestigacionFields['Metodologia'] }))}
            >
              <option value="">Seleccionar...</option>
              <option value="arbol_causas">Árbol de Causas</option>
              <option value="cinco_porques">5 Porqués</option>
              <option value="taproot">TapRooT</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Causas Inmediatas</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={invForm['Causas Inmediatas'] ?? ''}
              onChange={e => setInvForm(f => ({ ...f, 'Causas Inmediatas': e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Causas Básicas</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={invForm['Causas Basicas'] ?? ''}
              onChange={e => setInvForm(f => ({ ...f, 'Causas Basicas': e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowInvModal(false); setInvForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleInvestigacion}
              disabled={saving || !invForm.Metodologia}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Iniciar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
