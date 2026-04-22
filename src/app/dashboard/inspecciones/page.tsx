'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClipboardList, Plus, Flag, ChevronRight } from 'lucide-react'
import type { InspInspeccionFields, InspHallazgoFields } from '@/types/sst/insp'
import type { AirtableRecord } from '@/lib/airtable-client'

type Inspeccion = AirtableRecord<InspInspeccionFields>
type Hallazgo = AirtableRecord<InspHallazgoFields>

const ESTADO_VARIANT: Record<string, 'warning' | 'success' | 'error'> = {
  programada: 'warning', realizada: 'success', cancelada: 'error',
}

const CRITICIDAD_VARIANT: Record<string, 'info' | 'warning' | 'error' | 'error'> = {
  baja: 'info', media: 'warning', alta: 'error', critica: 'error',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function InspeccionesPage() {
  useAuth()
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [selected, setSelected] = useState<Inspeccion | null>(null)
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHallazgoModal, setShowHallazgoModal] = useState(false)
  const [form, setForm] = useState<Partial<InspInspeccionFields>>({})
  const [hallazgoForm, setHallazgoForm] = useState<Partial<InspHallazgoFields>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/inspecciones', { headers: authHeaders() })
    if (res.ok) setInspecciones((await res.json()).records)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadHallazgos = useCallback(async (id: string) => {
    const res = await fetch(`/api/sst/inspecciones/${id}/hallazgos`, { headers: authHeaders() })
    if (res.ok) setHallazgos((await res.json()).records)
  }, [])

  const selectInspeccion = (insp: Inspeccion) => {
    setSelected(insp)
    loadHallazgos(insp.id)
  }

  const handleSave = async () => {
    if (!form['Tipo ID'] || !form.Area || !form['Fecha Programada']) return
    setSaving(true)
    await fetch('/api/sst/inspecciones', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
    setSaving(false)
    setShowModal(false)
    setForm({})
    load()
  }

  const handleHallazgo = async () => {
    if (!selected || !hallazgoForm.Descripcion || !hallazgoForm.Criticidad) return
    setSaving(true)
    await fetch(`/api/sst/inspecciones/${selected.id}/hallazgos`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(hallazgoForm),
    })
    setSaving(false)
    setShowHallazgoModal(false)
    setHallazgoForm({})
    loadHallazgos(selected.id)
  }

  const handleMarcarRealizada = async (insp: Inspeccion) => {
    await fetch(`/api/sst/inspecciones/${insp.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ Estado: 'realizada', 'Fecha Realizada': new Date().toISOString().split('T')[0] }),
    })
    load()
  }

  const columns: Column<Inspeccion>[] = [
    { key: 'tipo', header: 'Tipo', render: r => r.fields['Tipo Nombre'] ?? r.fields['Tipo ID'] },
    { key: 'area', header: 'Área', render: r => r.fields.Area },
    { key: 'programada', header: 'Fecha Programada', render: r => r.fields['Fecha Programada'] },
    { key: 'realizada', header: 'Fecha Realizada', render: r => r.fields['Fecha Realizada'] ?? '—' },
    {
      key: 'estado', header: 'Estado',
      render: r => <StatusBadge label={r.fields.Estado} variant={ESTADO_VARIANT[r.fields.Estado] ?? 'info'} />,
    },
    {
      key: 'ver', header: '',
      render: r => (
        <button onClick={() => selectInspeccion(r)} className="text-blue-600 text-sm hover:underline">
          Ver <ChevronRight size={14} className="inline" />
        </button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Inspecciones de Seguridad"
        description="Planificación, ejecución y hallazgos de inspecciones"
        icon={ClipboardList}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Nueva Inspección
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : inspecciones.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Sin inspecciones" description="Programa la primera inspección de seguridad" />
            ) : (
              <DataTable columns={columns} data={inspecciones} />
            )}
          </Card>
        </div>

        <div>
          {selected ? (
            <Card>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{selected.fields.Area}</h3>
                  <StatusBadge label={selected.fields.Estado} variant={ESTADO_VARIANT[selected.fields.Estado] ?? 'info'} />
                </div>
                <p className="text-xs text-gray-500">{selected.fields['Fecha Programada']}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {selected.fields.Estado === 'programada' && (
                    <button
                      onClick={() => handleMarcarRealizada(selected)}
                      className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Marcar como Realizada
                    </button>
                  )}
                  {selected.fields.Estado === 'realizada' && (
                    <button
                      onClick={() => setShowHallazgoModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
                    >
                      <Flag size={14} /> Registrar Hallazgo
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Hallazgos ({hallazgos.length})</h4>
                {hallazgos.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin hallazgos registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {hallazgos.map(h => (
                      <div key={h.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <StatusBadge label={h.fields.Criticidad} variant={CRITICIDAD_VARIANT[h.fields.Criticidad] ?? 'info'} />
                          <StatusBadge label={h.fields.Estado} variant={h.fields.Estado === 'cerrado' ? 'success' : 'warning'} />
                        </div>
                        <p className="text-sm text-gray-700">{h.fields.Descripcion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={ClipboardList} title="Selecciona una inspección" description="Haz clic para ver hallazgos" />
            </Card>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Nueva Inspección">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo ID *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ID del tipo de inspección"
              value={form['Tipo ID'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Tipo ID': e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Area ?? ''}
                onChange={e => setForm(f => ({ ...f, Area: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Programada *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Fecha Programada'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Programada': e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form['Responsable Nombre'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Responsable Nombre': e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form['Tipo ID'] || !form.Area || !form['Fecha Programada']}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showHallazgoModal} onClose={() => { setShowHallazgoModal(false); setHallazgoForm({}) }} title="Registrar Hallazgo">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Criticidad *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={hallazgoForm.Criticidad ?? ''}
              onChange={e => setHallazgoForm(f => ({ ...f, Criticidad: e.target.value as InspHallazgoFields['Criticidad'] }))}>
              <option value="">Seleccionar...</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              value={hallazgoForm.Descripcion ?? ''}
              onChange={e => setHallazgoForm(f => ({ ...f, Descripcion: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable Cierre</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={hallazgoForm['Responsable Cierre Nombre'] ?? ''}
                onChange={e => setHallazgoForm(f => ({ ...f, 'Responsable Cierre Nombre': e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={hallazgoForm['Fecha Limite'] ?? ''}
                onChange={e => setHallazgoForm(f => ({ ...f, 'Fecha Limite': e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowHallazgoModal(false); setHallazgoForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleHallazgo}
              disabled={saving || !hallazgoForm.Descripcion || !hallazgoForm.Criticidad}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
