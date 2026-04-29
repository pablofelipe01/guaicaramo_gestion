'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Stethoscope, Plus, Bell, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import type { MedEvaluacionFields } from '@/types/sst/med'
import type { AirtableRecord } from '@/lib/airtable-client'

type Evaluacion = AirtableRecord<MedEvaluacionFields>

const APTITUD_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  apto: 'success',
  apto_con_restricciones: 'warning',
  no_apto: 'error',
}

const TIPO_LABEL: Record<string, string> = {
  ingreso: 'Ingreso',
  periodico: 'Periódico',
  retiro: 'Retiro',
  post_incapacidad: 'Post-Incapacidad',
  cambio_cargo: 'Cambio de Cargo',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function EvaluacionesMedicasPage() {
  useAuth()
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [alertas, setAlertas] = useState<{ mensaje: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Partial<MedEvaluacionFields>>({})
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [evRes, altRes] = await Promise.all([
      fetch('/api/sst/evaluaciones-medicas', { headers: authHeaders() }),
      fetch('/api/sst/evaluaciones-medicas?alertas=1', { headers: authHeaders() }),
    ])
    if (evRes.ok) setEvaluaciones((await evRes.json()).records)
    if (altRes.ok) setAlertas((await altRes.json()).records)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form['Trabajador ID'] || !form.Tipo || !form.Fecha || !form.Aptitud) return
    setSaving(true)
    if (editId) {
      await fetch(`/api/sst/evaluaciones-medicas/${editId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(form) })
    } else {
      await fetch('/api/sst/evaluaciones-medicas', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowModal(false)
    setEditId(null)
    setForm({})
    load()
  }

  const handleEdit = (e: Evaluacion) => {
    setEditId(e.id)
    setForm({ ...e.fields })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/sst/evaluaciones-medicas/${id}`, { method: 'DELETE', headers: authHeaders() })
    setConfirmDelete(null)
    load()
  }

  const columns: Column<Evaluacion>[] = [
    { key: 'trabajador', header: 'Trabajador', render: r => r.fields['Trabajador Nombre'] ?? r.fields['Trabajador ID'] },
    { key: 'tipo', header: 'Tipo', render: r => TIPO_LABEL[r.fields.Tipo] ?? r.fields.Tipo },
    { key: 'fecha', header: 'Fecha', render: r => r.fields.Fecha },
    {
      key: 'aptitud', header: 'Aptitud',
      render: r => (
        <StatusBadge
          label={r.fields.Aptitud.replace(/_/g, ' ')}
          variant={APTITUD_VARIANT[r.fields.Aptitud] ?? 'info'}
        />
      ),
    },
    { key: 'restricciones', header: 'Restricciones', render: r => r.fields.Restricciones ?? '—' },
    { key: 'proxima', header: 'Próxima Evaluación', render: r => r.fields['Proxima Evaluacion'] ?? '—' },
    {
      key: 'acciones', header: '',
      render: r => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => handleEdit(r)} className="p-1 text-gray-400 hover:text-green-700" title="Editar"><Pencil size={14} /></button>
          <button onClick={() => setConfirmDelete(r.id)} className="p-1 text-gray-400 hover:text-red-600" title="Eliminar"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Evaluaciones Médicas Ocupacionales"
        description="Gestión del ciclo de evaluaciones médicas (Res. 2346/2007)"
        icon={Stethoscope}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
          >
            <Plus size={16} /> Nueva Evaluación
          </button>
        }
      />

      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <Bell size={16} className="shrink-0" />
              {a.mensaje}
            </div>
          ))}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : evaluaciones.length === 0 ? (
          <EmptyState icon={Stethoscope} title="Sin evaluaciones" description="Registra la primera evaluación médica ocupacional" />
        ) : (
          <DataTable columns={columns} data={evaluaciones} />
        )}
      </Card>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditId(null); setForm({}) }} title={editId ? 'Editar Evaluación Médica' : 'Nueva Evaluación Médica'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador ID *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form['Trabajador ID'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Trabajador ID': e.target.value }))}
              placeholder="ID del trabajador"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Tipo ?? ''}
                onChange={e => setForm(f => ({ ...f, Tipo: e.target.value as MedEvaluacionFields['Tipo'] }))}
              >
                <option value="">Seleccionar...</option>
                <option value="ingreso">Ingreso</option>
                <option value="periodico">Periódico</option>
                <option value="retiro">Retiro</option>
                <option value="post_incapacidad">Post-Incapacidad</option>
                <option value="cambio_cargo">Cambio de Cargo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Fecha ?? ''}
                onChange={e => setForm(f => ({ ...f, Fecha: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aptitud *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Aptitud ?? ''}
                onChange={e => setForm(f => ({ ...f, Aptitud: e.target.value as MedEvaluacionFields['Aptitud'] }))}
              >
                <option value="">Seleccionar...</option>
                <option value="apto">Apto</option>
                <option value="apto_con_restricciones">Apto con Restricciones</option>
                <option value="no_apto">No Apto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Evaluación</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Proxima Evaluacion'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Proxima Evaluacion': e.target.value }))}
              />
            </div>
          </div>
          {form.Aptitud === 'apto_con_restricciones' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                <AlertTriangle size={14} /> Se creará un caso médico automáticamente
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restricciones</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
                value={form.Restricciones ?? ''}
                onChange={e => setForm(f => ({ ...f, Restricciones: e.target.value }))}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Médico / IPS</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form['Medico Nombre'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Medico Nombre': e.target.value }))}
              placeholder="Nombre del médico o IPS"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowModal(false); setEditId(null); setForm({}) }}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form['Trabajador ID'] || !form.Tipo || !form.Fecha || !form.Aptitud}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {confirmDelete && (
        <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
          <p className="text-sm text-gray-600 mb-4">¿Eliminar esta evaluación médica? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
