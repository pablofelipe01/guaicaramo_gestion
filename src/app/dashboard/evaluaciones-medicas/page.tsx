'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Stethoscope, Plus, Bell, AlertTriangle } from 'lucide-react'
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
    await fetch('/api/sst/evaluaciones-medicas', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowModal(false)
    setForm({})
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Nueva Evaluación Médica">
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
              onClick={() => { setShowModal(false); setForm({}) }}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form['Trabajador ID'] || !form.Tipo || !form.Fecha || !form.Aptitud}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
