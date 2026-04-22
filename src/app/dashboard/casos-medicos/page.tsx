'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { HeartPulse, Plus, MessageSquare, ChevronRight } from 'lucide-react'
import type { CasoCasoFields, CasoSeguimientoFields } from '@/types/sst/caso'
import type { AirtableRecord } from '@/lib/airtable-client'

type Caso = AirtableRecord<CasoCasoFields>
type Seguimiento = AirtableRecord<CasoSeguimientoFields>

const TIPO_LABEL: Record<string, string> = {
  restriccion: 'Restricción',
  reubicacion: 'Reubicación',
  calificacion_el: 'Calificación EL',
  incapacidad_prolongada: 'Incapacidad Prolongada',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function CasosMedicosPage() {
  useAuth()
  const [casos, setCasos] = useState<Caso[]>([])
  const [selected, setSelected] = useState<Caso | null>(null)
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
  const [form, setForm] = useState<Partial<CasoCasoFields>>({})
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/casos-medicos?estado=activo', { headers: authHeaders() })
    if (res.ok) setCasos((await res.json()).records)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadSeguimientos = useCallback(async (casoId: string) => {
    const res = await fetch(`/api/sst/casos-medicos/${casoId}/seguimientos`, { headers: authHeaders() })
    if (res.ok) setSeguimientos((await res.json()).records)
  }, [])

  const selectCaso = (caso: Caso) => {
    setSelected(caso)
    loadSeguimientos(caso.id)
  }

  const handleSave = async () => {
    if (!form['Trabajador ID'] || !form.Tipo) return
    setSaving(true)
    await fetch('/api/sst/casos-medicos', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
    })
    setSaving(false)
    setShowModal(false)
    setForm({})
    load()
  }

  const handleSeguimiento = async () => {
    if (!nota || !selected) return
    setSaving(true)
    await fetch(`/api/sst/casos-medicos/${selected.id}/seguimientos`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ Nota: nota }),
    })
    setSaving(false)
    setShowSeguimientoModal(false)
    setNota('')
    loadSeguimientos(selected.id)
  }

  const columns: Column<Caso>[] = [
    { key: 'trabajador', header: 'Trabajador', render: r => r.fields['Trabajador Nombre'] ?? r.fields['Trabajador ID'] },
    { key: 'tipo', header: 'Tipo', render: r => TIPO_LABEL[r.fields.Tipo] ?? r.fields.Tipo },
    { key: 'apertura', header: 'Fecha Apertura', render: r => r.fields['Fecha Apertura'] },
    {
      key: 'estado', header: 'Estado',
      render: r => <StatusBadge label={r.fields.Estado} variant={r.fields.Estado === 'activo' ? 'warning' : 'success'} />,
    },
    {
      key: 'acciones', header: '',
      render: r => (
        <button onClick={() => selectCaso(r)} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
          Ver <ChevronRight size={14} />
        </button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Seguimiento Casos Médicos Laborales"
        description="Casos con restricciones, reubicaciones, calificaciones o incapacidades prolongadas"
        icon={HeartPulse}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Nuevo Caso
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : casos.length === 0 ? (
              <EmptyState icon={HeartPulse} title="Sin casos activos" description="Los casos aparecen aquí al registrarlos" />
            ) : (
              <div className="divide-y">
                {casos.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCaso(c)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                  >
                    <p className="font-medium text-sm">{c.fields['Trabajador Nombre'] ?? c.fields['Trabajador ID']}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{TIPO_LABEL[c.fields.Tipo]} · {c.fields['Fecha Apertura']}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selected.fields['Trabajador Nombre'] ?? selected.fields['Trabajador ID']}</h3>
                  <p className="text-sm text-gray-500">{TIPO_LABEL[selected.fields.Tipo]} · Abierto el {selected.fields['Fecha Apertura']}</p>
                </div>
                <button
                  onClick={() => setShowSeguimientoModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  <MessageSquare size={14} /> Agregar nota
                </button>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Seguimientos ({seguimientos.length})</h4>
                {seguimientos.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin notas de seguimiento aún.</p>
                ) : (
                  <div className="space-y-3">
                    {seguimientos.map(s => (
                      <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{s.fields['Autor Nombre'] ?? 'Sistema'}</span>
                          <span>{s.fields.Fecha}</span>
                        </div>
                        <p className="text-sm text-gray-800">{s.fields.Nota}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={HeartPulse} title="Selecciona un caso" description="Haz clic en un caso de la lista para ver su seguimiento" />
            </Card>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Nuevo Caso Médico">
        <div className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Caso *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.Tipo ?? ''}
              onChange={e => setForm(f => ({ ...f, Tipo: e.target.value as CasoCasoFields['Tipo'] }))}
            >
              <option value="">Seleccionar...</option>
              <option value="restriccion">Restricción Médica</option>
              <option value="reubicacion">Reubicación Laboral</option>
              <option value="calificacion_el">Calificación Enfermedad Laboral</option>
              <option value="incapacidad_prolongada">Incapacidad Prolongada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.Descripcion ?? ''}
              onChange={e => setForm(f => ({ ...f, Descripcion: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form['Trabajador ID'] || !form.Tipo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Caso'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showSeguimientoModal} onClose={() => { setShowSeguimientoModal(false); setNota('') }} title="Agregar Nota de Seguimiento">
        <div className="space-y-4">
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={4}
            placeholder="Nota de evolución..."
            value={nota}
            onChange={e => setNota(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowSeguimientoModal(false); setNota('') }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSeguimiento}
              disabled={saving || !nota}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
