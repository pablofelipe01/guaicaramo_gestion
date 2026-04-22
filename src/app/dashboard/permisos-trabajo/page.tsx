'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShieldCheck, Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { PermPermisoFields } from '@/types/sst/perm'
import type { AirtableRecord } from '@/lib/airtable-client'

type Permiso = AirtableRecord<PermPermisoFields>

const ESTADO_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'error'> = {
  borrador: 'info',
  pendiente_aprobacion: 'warning',
  aprobado: 'success',
  rechazado: 'error',
  en_ejecucion: 'success',
  cerrado: 'info',
  vencido: 'error',
}

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  pendiente_aprobacion: 'Pendiente Aprobación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  en_ejecucion: 'En Ejecución',
  cerrado: 'Cerrado',
  vencido: 'Vencido',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function PermisosTrabajoPage() {
  useAuth()
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [selected, setSelected] = useState<Permiso | null>(null)
  const [prerrequisitos, setPrerrequisitos] = useState<{ habilitado: boolean; bloqueos: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Partial<PermPermisoFields>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/permisos', { headers: authHeaders() })
    if (res.ok) setPermisos((await res.json()).records)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const selectPermiso = async (p: Permiso) => {
    setSelected(p)
    const res = await fetch(`/api/sst/permisos/${p.id}`, { headers: authHeaders() })
    if (res.ok) setPrerrequisitos(await res.json())
  }

  const handleSave = async () => {
    if (!form['Tipo ID'] || !form.Area || !form['Tarea Descripcion'] || !form['Fecha Inicio'] || !form['Fecha Fin']) return
    setSaving(true)
    await fetch('/api/sst/permisos', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
    setSaving(false)
    setShowModal(false)
    setForm({})
    load()
  }

  const handleEnviarRevision = async (p: Permiso) => {
    await fetch(`/api/sst/permisos/${p.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ Estado: 'pendiente_aprobacion' }),
    })
    load()
  }

  const handleAprobar = async (p: Permiso, aprobado: boolean) => {
    await fetch(`/api/sst/permisos/${p.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ Estado: aprobado ? 'aprobado' : 'rechazado' }),
    })
    setSelected(null)
    load()
  }

  const columns: Column<Permiso>[] = [
    { key: 'tipo', header: 'Tipo', render: r => r.fields['Tipo Nombre'] ?? r.fields['Tipo ID'] },
    { key: 'area', header: 'Área', render: r => r.fields.Area },
    { key: 'tarea', header: 'Tarea', render: r => r.fields['Tarea Descripcion'] },
    { key: 'inicio', header: 'Inicio', render: r => r.fields['Fecha Inicio'] },
    { key: 'fin', header: 'Fin', render: r => r.fields['Fecha Fin'] },
    {
      key: 'estado', header: 'Estado',
      render: r => <StatusBadge label={ESTADO_LABEL[r.fields.Estado] ?? r.fields.Estado} variant={ESTADO_VARIANT[r.fields.Estado] ?? 'info'} />,
    },
    {
      key: 'ver', header: '',
      render: r => (
        <button onClick={() => selectPermiso(r)} className="text-blue-600 text-sm hover:underline">Ver</button>
      ),
    },
  ]

  const stats = {
    activos: permisos.filter(p => ['aprobado', 'en_ejecucion'].includes(p.fields.Estado)).length,
    pendientes: permisos.filter(p => p.fields.Estado === 'pendiente_aprobacion').length,
    vencidos: permisos.filter(p => p.fields.Estado === 'vencido').length,
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Permisos de Trabajo — Actividades de Alto Riesgo"
        description="Emisión y aprobación de permisos para trabajos en altura, espacios confinados, caliente, LOTO y excavaciones"
        icon={ShieldCheck}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Nuevo Permiso
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Activos / En ejecución', value: stats.activos, color: 'green' },
          { label: 'Pendientes de aprobación', value: stats.pendientes, color: 'amber' },
          { label: 'Vencidos', value: stats.vencidos, color: 'red' },
        ].map(s => (
          <Card key={s.label}>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : permisos.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Sin permisos" description="Emite el primer permiso de trabajo" />
            ) : (
              <DataTable columns={columns} data={permisos} />
            )}
          </Card>
        </div>

        <div>
          {selected ? (
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm mb-1">{selected.fields['Tarea Descripcion']}</h3>
                <p className="text-xs text-gray-500">{selected.fields.Area} · {selected.fields['Fecha Inicio']} → {selected.fields['Fecha Fin']}</p>
                <StatusBadge label={ESTADO_LABEL[selected.fields.Estado]} variant={ESTADO_VARIANT[selected.fields.Estado] ?? 'info'} />
              </div>

              {prerrequisitos && (
                <div className="p-4 border-b">
                  <div className={`p-3 rounded-lg text-sm ${prerrequisitos.habilitado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 font-medium mb-2">
                      {prerrequisitos.habilitado
                        ? <><CheckCircle size={14} className="text-green-600" /> Prerrequisitos cumplidos</>
                        : <><AlertTriangle size={14} className="text-red-600" /> Bloqueos activos</>
                      }
                    </div>
                    {prerrequisitos.bloqueos.map((b, i) => (
                      <p key={i} className="text-xs text-red-700">• {b}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2">
                {selected.fields.Estado === 'borrador' && (
                  <button
                    onClick={() => handleEnviarRevision(selected)}
                    className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
                  >
                    Enviar a Revisión
                  </button>
                )}
                {selected.fields.Estado === 'pendiente_aprobacion' && prerrequisitos?.habilitado && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAprobar(selected, true)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      <CheckCircle size={14} /> Aprobar
                    </button>
                    <button
                      onClick={() => handleAprobar(selected, false)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                  </div>
                )}
                {selected.fields.Estado === 'aprobado' && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/sst/permisos/${selected.id}`, {
                        method: 'PUT', headers: authHeaders(),
                        body: JSON.stringify({ Estado: 'en_ejecucion' }),
                      })
                      setSelected(null)
                      load()
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Iniciar Ejecución
                  </button>
                )}
                {selected.fields.Estado === 'en_ejecucion' && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/sst/permisos/${selected.id}`, {
                        method: 'PUT', headers: authHeaders(),
                        body: JSON.stringify({ Estado: 'cerrado' }),
                      })
                      setSelected(null)
                      load()
                    }}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                  >
                    Cerrar Permiso
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={ShieldCheck} title="Selecciona un permiso" description="Haz clic en un registro para gestionar su flujo" />
            </Card>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({}) }} title="Nuevo Permiso de Trabajo">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Permiso ID *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ID del tipo de permiso"
              value={form['Tipo ID'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Tipo ID': e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.Area ?? ''}
              onChange={e => setForm(f => ({ ...f, Area: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Tarea *</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={form['Tarea Descripcion'] ?? ''}
              onChange={e => setForm(f => ({ ...f, 'Tarea Descripcion': e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Fecha Inicio'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Inicio': e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form['Fecha Fin'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Fin': e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
              value={form.Observaciones ?? ''}
              onChange={e => setForm(f => ({ ...f, Observaciones: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm({}) }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !form['Tipo ID'] || !form.Area || !form['Tarea Descripcion'] || !form['Fecha Inicio'] || !form['Fecha Fin']}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Permiso'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
