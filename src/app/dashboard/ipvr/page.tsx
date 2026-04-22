'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShieldAlert, Plus, AlertTriangle } from 'lucide-react'
import type { IpvrRegistroFields } from '@/types/sst/ipvr'
import type { AirtableRecord } from '@/lib/airtable-client'

type Registro = AirtableRecord<IpvrRegistroFields>

const NIVEL_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  I: 'error', II: 'warning', III: 'info', IV: 'success',
}

const NIVEL_DESC: Record<string, string> = {
  I: 'No aceptable (≥600)',
  II: 'No aceptable o aceptable con control específico (150–599)',
  III: 'Aceptable con control (40–149)',
  IV: 'Aceptable (< 40)',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function IpvrPage() {
  useAuth()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [nivelI, setNivelI] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Partial<IpvrRegistroFields> & { ND?: number; NE?: number; NC?: number }>({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'todos' | 'criticos'>('todos')

  const preview = form.ND && form.NE && form.NC
    ? { NP: form.ND * form.NE, NR: form.ND * form.NE * form.NC }
    : null
  const nivelPreview = preview
    ? (preview.NR >= 600 ? 'I' : preview.NR >= 150 ? 'II' : preview.NR >= 40 ? 'III' : 'IV')
    : null

  const load = useCallback(async () => {
    setLoading(true)
    const [allRes, nivelIRes] = await Promise.all([
      fetch('/api/sst/ipvr', { headers: authHeaders() }),
      fetch('/api/sst/ipvr?nivelI=1', { headers: authHeaders() }),
    ])
    if (allRes.ok) setRegistros((await allRes.json()).records)
    if (nivelIRes.ok) setNivelI((await nivelIRes.json()).records)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.Area || !form['Proceso Actividad'] || !form['Descripcion Peligro'] || form.ND == null || form.NE == null || form.NC == null) return
    setSaving(true)
    await fetch('/api/sst/ipvr', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...form, 'Fecha Revision': form['Fecha Revision'] ?? new Date().toISOString().split('T')[0] }),
    })
    setSaving(false)
    setShowModal(false)
    setForm({})
    load()
  }

  const columns: Column<Registro>[] = [
    { key: 'area', header: 'Área', render: r => r.fields.Area },
    { key: 'peligro', header: 'Peligro', render: r => r.fields['Descripcion Peligro'] },
    { key: 'np', header: 'NP', render: r => r.fields.NP },
    { key: 'nc', header: 'NC', render: r => r.fields.NC },
    { key: 'nr', header: 'NR', render: r => <span className="font-bold">{r.fields.NR}</span> },
    {
      key: 'nivel', header: 'Nivel',
      render: r => <StatusBadge label={`Nivel ${r.fields['Nivel Intervencion']}`} variant={NIVEL_VARIANT[r.fields['Nivel Intervencion']]} />,
    },
    { key: 'controles', header: 'Controles existentes', render: r => r.fields['Controles Existentes'] ?? '—' },
  ]

  const displayData = activeTab === 'criticos' ? nivelI : registros

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Matriz IPVR — Identificación de Peligros"
        description="Valoración de riesgos con metodología GTC-45"
        icon={ShieldAlert}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Nuevo Registro
          </button>
        }
      />

      {nivelI.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <strong>{nivelI.length} peligro(s) de Nivel I</strong> — requieren acción inmediata e intervención prioritaria
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['I', 'II', 'III', 'IV'] as const).map(nivel => {
          const count = registros.filter(r => r.fields['Nivel Intervencion'] === nivel).length
          return (
            <Card key={nivel}>
              <div className="p-4 text-center">
                <StatusBadge label={`Nivel ${nivel}`} variant={NIVEL_VARIANT[nivel]} />
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs text-gray-400 mt-1">{NIVEL_DESC[nivel].split('(')[0].trim()}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-2">
        {(['todos', 'criticos'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'todos' ? `Todos (${registros.length})` : `Nivel I — Críticos (${nivelI.length})`}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : displayData.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Sin registros" description="Agrega peligros identificados en la organización" />
        ) : (
          <DataTable columns={columns} data={displayData} />
        )}
      </Card>

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Nuevo Registro IPVR">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.Area ?? ''}
                onChange={e => setForm(f => ({ ...f, Area: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proceso / Actividad *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Proceso Actividad'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Proceso Actividad': e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clasificación del Peligro</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Físico, Químico, Biomecánico..."
              value={form['Clasificacion Peligro'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Clasificacion Peligro': e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Peligro *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form['Descripcion Peligro'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Descripcion Peligro': e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ND (Deficiencia) *</label>
              <input type="number" min={1} max={10} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.ND ?? ''}
                onChange={e => setForm(f => ({ ...f, ND: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NE (Exposición) *</label>
              <input type="number" min={1} max={4} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.NE ?? ''}
                onChange={e => setForm(f => ({ ...f, NE: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NC (Consecuencia) *</label>
              <input type="number" min={10} max={100} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.NC ?? ''}
                onChange={e => setForm(f => ({ ...f, NC: parseInt(e.target.value) }))} />
            </div>
          </div>
          {preview && nivelPreview && (
            <div className={`p-3 rounded-lg border text-sm flex items-center justify-between ${nivelPreview === 'I' ? 'bg-red-50 border-red-200' : nivelPreview === 'II' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
              <span>NP = {preview.NP} · NR = <strong>{preview.NR}</strong></span>
              <StatusBadge label={`Nivel ${nivelPreview}`} variant={NIVEL_VARIANT[nivelPreview]} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Controles Existentes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={form['Controles Existentes'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Controles Existentes': e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.Area || !form['Proceso Actividad'] || !form['Descripcion Peligro'] || form.ND == null || form.NE == null || form.NC == null}
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
