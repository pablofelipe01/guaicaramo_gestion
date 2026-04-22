'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { HardHat, Plus, Bell, Package } from 'lucide-react'
import type { EppCatalogoFields, EppEntregaFields } from '@/types/sst/epp'
import type { AirtableRecord } from '@/lib/airtable-client'

type Catalogo = AirtableRecord<EppCatalogoFields>
type Entrega = AirtableRecord<EppEntregaFields>

const MOTIVO_LABEL: Record<string, string> = {
  ingreso: 'Ingreso', reposicion: 'Reposición', deterioro: 'Deterioro',
  perdida: 'Pérdida', dotacion_periodica: 'Dotación Periódica',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function EppsPage() {
  useAuth()
  const [catalogo, setCatalogo] = useState<Catalogo[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [alertas, setAlertas] = useState<{ mensaje: string }[]>([])
  const [activeTab, setActiveTab] = useState<'catalogo' | 'entregas'>('entregas')
  const [loading, setLoading] = useState(true)
  const [showCatalogoModal, setShowCatalogoModal] = useState(false)
  const [showEntregaModal, setShowEntregaModal] = useState(false)
  const [catForm, setCatForm] = useState<Partial<EppCatalogoFields>>({})
  const [entregaForm, setEntregaForm] = useState<Partial<EppEntregaFields>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [catRes, entRes, altRes] = await Promise.all([
      fetch('/api/sst/epps', { headers: authHeaders() }),
      fetch('/api/sst/epps/entregas', { headers: authHeaders() }),
      fetch('/api/sst/epps?alertas=1', { headers: authHeaders() }),
    ])
    if (catRes.ok) setCatalogo((await catRes.json()).records)
    if (entRes.ok) setEntregas((await entRes.json()).records)
    if (altRes.ok) setAlertas((await altRes.json()).records)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaveCatalogo = async () => {
    if (!catForm.Nombre || !catForm.Tipo) return
    setSaving(true)
    await fetch('/api/sst/epps', { method: 'POST', headers: authHeaders(), body: JSON.stringify(catForm) })
    setSaving(false)
    setShowCatalogoModal(false)
    setCatForm({})
    load()
  }

  const handleSaveEntrega = async () => {
    if (!entregaForm['Trabajador ID'] || !entregaForm['Catalogo ID'] || !entregaForm.Motivo || !entregaForm['Fecha Entrega']) return
    setSaving(true)
    await fetch('/api/sst/epps/entregas', { method: 'POST', headers: authHeaders(), body: JSON.stringify(entregaForm) })
    setSaving(false)
    setShowEntregaModal(false)
    setEntregaForm({})
    load()
  }

  const catalogoColumns: Column<Catalogo>[] = [
    { key: 'nombre', header: 'Nombre', render: r => r.fields.Nombre },
    {
      key: 'tipo', header: 'Tipo',
      render: r => <StatusBadge label={r.fields.Tipo === 'epp' ? 'EPP' : 'Dotación'} variant={r.fields.Tipo === 'epp' ? 'info' : 'success'} />,
    },
    { key: 'vida', header: 'Vida útil (meses)', render: r => r.fields['Vida Util Meses'] ?? '—' },
    { key: 'reposicion', header: 'Reposición (meses)', render: r => r.fields['Periodicidad Reposicion Meses'] ?? '—' },
  ]

  const entregasColumns: Column<Entrega>[] = [
    { key: 'trabajador', header: 'Trabajador', render: r => r.fields['Trabajador Nombre'] ?? r.fields['Trabajador ID'] },
    { key: 'epp', header: 'EPP / Dotación', render: r => r.fields['Catalogo Nombre'] ?? r.fields['Catalogo ID'] },
    { key: 'motivo', header: 'Motivo', render: r => MOTIVO_LABEL[r.fields.Motivo] ?? r.fields.Motivo },
    { key: 'cantidad', header: 'Cantidad', render: r => r.fields.Cantidad },
    { key: 'fecha', header: 'Fecha Entrega', render: r => r.fields['Fecha Entrega'] },
    {
      key: 'vencimiento', header: 'Vencimiento',
      render: r => {
        if (!r.fields['Fecha Vencimiento']) return '—'
        const vence = new Date(r.fields['Fecha Vencimiento'])
        const hoy = new Date()
        const dias = Math.ceil((vence.getTime() - hoy.getTime()) / 86400000)
        return (
          <span className={dias <= 15 ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {r.fields['Fecha Vencimiento']} {dias <= 15 && `(${dias}d)`}
          </span>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="EPPs y Dotación"
        description="Control de entrega y vida útil de elementos de protección personal"
        icon={HardHat}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowCatalogoModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <Package size={16} /> Nuevo EPP
            </button>
            <button onClick={() => setShowEntregaModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Registrar Entrega
            </button>
          </div>
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

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'EPPs en catálogo', value: catalogo.filter(c => c.fields.Tipo === 'epp').length, icon: HardHat },
          { label: 'Dotaciones en catálogo', value: catalogo.filter(c => c.fields.Tipo === 'dotacion').length, icon: Package },
          { label: 'Entregas registradas', value: entregas.length, icon: Plus },
        ].map(s => (
          <Card key={s.label}>
            <div className="p-4 flex items-center gap-3">
              <s.icon size={24} className="text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(['entregas', 'catalogo'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'entregas' ? `Historial de Entregas (${entregas.length})` : `Catálogo (${catalogo.length})`}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : activeTab === 'catalogo' ? (
          catalogo.length === 0
            ? <EmptyState icon={HardHat} title="Catálogo vacío" description="Agrega los EPPs y dotaciones disponibles" />
            : <DataTable columns={catalogoColumns} data={catalogo} />
        ) : (
          entregas.length === 0
            ? <EmptyState icon={HardHat} title="Sin entregas registradas" description="Registra la primera entrega de EPP o dotación" />
            : <DataTable columns={entregasColumns} data={entregas} />
        )}
      </Card>

      <Modal open={showCatalogoModal} onClose={() => { setShowCatalogoModal(false); setCatForm({}) }} title="Nuevo EPP / Dotación">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={catForm.Nombre ?? ''}
              onChange={e => setCatForm(f => ({ ...f, Nombre: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={catForm.Tipo ?? ''}
              onChange={e => setCatForm(f => ({ ...f, Tipo: e.target.value as EppCatalogoFields['Tipo'] }))}>
              <option value="">Seleccionar...</option>
              <option value="epp">EPP</option>
              <option value="dotacion">Dotación</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vida útil (meses)</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={catForm['Vida Util Meses'] ?? ''}
                onChange={e => setCatForm(f => ({ ...f, 'Vida Util Meses': parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidad reposición (meses)</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={catForm['Periodicidad Reposicion Meses'] ?? ''}
                onChange={e => setCatForm(f => ({ ...f, 'Periodicidad Reposicion Meses': parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowCatalogoModal(false); setCatForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSaveCatalogo} disabled={saving || !catForm.Nombre || !catForm.Tipo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showEntregaModal} onClose={() => { setShowEntregaModal(false); setEntregaForm({}) }} title="Registrar Entrega de EPP">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador ID *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={entregaForm['Trabajador ID'] ?? ''}
                onChange={e => setEntregaForm(f => ({ ...f, 'Trabajador ID': e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Trabajador</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={entregaForm['Trabajador Nombre'] ?? ''}
                onChange={e => setEntregaForm(f => ({ ...f, 'Trabajador Nombre': e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EPP / Dotación *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={entregaForm['Catalogo ID'] ?? ''}
              onChange={e => {
                const cat = catalogo.find(c => c.id === e.target.value)
                setEntregaForm(f => ({ ...f, 'Catalogo ID': e.target.value, 'Catalogo Nombre': cat?.fields.Nombre }))
              }}>
              <option value="">Seleccionar...</option>
              {catalogo.map(c => <option key={c.id} value={c.id}>{c.fields.Nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={entregaForm.Motivo ?? ''}
                onChange={e => setEntregaForm(f => ({ ...f, Motivo: e.target.value as EppEntregaFields['Motivo'] }))}>
                <option value="">Seleccionar...</option>
                {Object.entries(MOTIVO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm"
                value={entregaForm.Cantidad ?? ''}
                onChange={e => setEntregaForm(f => ({ ...f, Cantidad: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={entregaForm['Fecha Entrega'] ?? ''}
                onChange={e => setEntregaForm(f => ({ ...f, 'Fecha Entrega': e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={entregaForm['Fecha Vencimiento'] ?? ''}
                onChange={e => setEntregaForm(f => ({ ...f, 'Fecha Vencimiento': e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowEntregaModal(false); setEntregaForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSaveEntrega}
              disabled={saving || !entregaForm['Trabajador ID'] || !entregaForm['Catalogo ID'] || !entregaForm.Motivo || !entregaForm['Fecha Entrega']}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Registrar Entrega'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
