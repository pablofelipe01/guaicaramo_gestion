'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Archive, Plus, Search, Filter } from 'lucide-react'
import type { DocDocumentoFields, ModuloOrigen } from '@/types/sst/doc'
import type { AirtableRecord } from '@/lib/airtable-client'

type Documento = AirtableRecord<DocDocumentoFields> & { id: string }

const MODULOS: ModuloOrigen[] = [
  'sst_cargo', 'sst_eval', 'sst_plan', 'sst_ccl', 'sst_cap', 'sst_ppto',
  'sst_legal', 'sst_cambio', 'sst_cont', 'sst_med', 'sst_caso', 'sst_inc',
  'sst_ipvr', 'sst_insp', 'sst_epp', 'sst_perm', 'sst_ind', 'sst_aud', 'sst_ac',
]

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  vigente: 'success', borrador: 'warning', obsoleto: 'neutral',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<Partial<DocDocumentoFields>>({
    Estado: 'vigente',
    Version: '1.0',
  })

  const cargarDocumentos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroModulo) params.set('modulo', filtroModulo)
    if (filtroEstado) params.set('estado', filtroEstado)
    if (busqueda) params.set('busqueda', busqueda)
    const res = await fetch(`/api/sst/documentos?${params}`, { headers: authHeaders() })
    const data = await res.json()
    setDocumentos(data.records ?? [])
    setLoading(false)
  }, [filtroModulo, filtroEstado, busqueda])

  useEffect(() => { cargarDocumentos() }, [cargarDocumentos])

  const guardar = async () => {
    if (!form.Nombre || !form['Modulo Origen']) return
    setGuardando(true)
    await fetch('/api/sst/documentos', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
    })
    setModal(false)
    setForm({ Estado: 'vigente', Version: '1.0' })
    await cargarDocumentos()
    setGuardando(false)
  }

  const columnas: Column<Documento>[] = [
    {
      key: 'Nombre', header: 'Documento',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800">{r.fields.Nombre}</p>
          {r.fields['Tipo Documental'] && <p className="text-xs text-gray-400">{r.fields['Tipo Documental']}</p>}
        </div>
      ),
    },
    { key: 'Modulo Origen', header: 'Módulo', render: (r) => <StatusBadge label={r.fields['Modulo Origen']} variant="neutral" /> },
    { key: 'Version', header: 'Versión', render: (r) => <span className="text-sm">{r.fields.Version ?? '—'}</span> },
    { key: 'Estado', header: 'Estado', render: (r) => <StatusBadge label={r.fields.Estado} variant={ESTADO_VARIANT[r.fields.Estado]} /> },
    { key: 'Fecha Carga', header: 'Fecha', render: (r) => <span className="text-sm text-gray-500">{r.fields['Fecha Carga'] ?? '—'}</span> },
    {
      key: 'URL Archivo', header: 'Archivo',
      render: (r) => r.fields['URL Archivo']
        ? <a href={r.fields['URL Archivo']} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">Ver archivo</a>
        : <span className="text-gray-300 text-sm">Sin archivo</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Conservación Documental"
        description="Repositorio central del SG-SST — punto único de entrada para todos los módulos"
        icon={Archive}
        iconColor="text-purple-600"
        actions={
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Subir documento
          </button>
        }
      />

      <Card padding={false}>
        <div className="flex flex-wrap gap-3 p-4 border-b border-gray-200">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && cargarDocumentos()}
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos los módulos</option>
            {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="borrador">Borrador</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
          <button onClick={cargarDocumentos} className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            <Filter className="w-3.5 h-3.5" /> Filtrar
          </button>
        </div>

        <DataTable
          columns={columnas}
          data={documentos}
          isLoading={loading}
          emptyMessage="No hay documentos registrados"
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Subir documento" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del documento *</label>
              <input type="text" value={form.Nombre ?? ''} onChange={e => setForm(f => ({ ...f, Nombre: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Módulo origen *</label>
              <select value={form['Modulo Origen'] ?? ''} onChange={e => setForm(f => ({ ...f, 'Modulo Origen': e.target.value as ModuloOrigen }))} className="input-field">
                <option value="">Seleccionar...</option>
                {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo documental</label>
              <input type="text" value={form['Tipo Documental'] ?? ''} onChange={e => setForm(f => ({ ...f, 'Tipo Documental': e.target.value }))} className="input-field" placeholder="Ej: Procedimiento, Registro..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
              <input type="text" value={form.Version ?? '1.0'} onChange={e => setForm(f => ({ ...f, Version: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.Estado ?? 'vigente'} onChange={e => setForm(f => ({ ...f, Estado: e.target.value as 'vigente' | 'borrador' | 'obsoleto' }))} className="input-field">
                <option value="vigente">Vigente</option>
                <option value="borrador">Borrador</option>
                <option value="obsoleto">Obsoleto</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del archivo</label>
              <input type="url" value={form['URL Archivo'] ?? ''} onChange={e => setForm(f => ({ ...f, 'URL Archivo': e.target.value }))} className="input-field" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea rows={3} value={form.Descripcion ?? ''} onChange={e => setForm(f => ({ ...f, Descripcion: e.target.value }))} className="input-field" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="confidencial" checked={!!form.Confidencial} onChange={e => setForm(f => ({ ...f, Confidencial: e.target.checked }))} className="w-4 h-4" />
              <label htmlFor="confidencial" className="text-sm text-gray-700">Documento confidencial</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={guardar} disabled={guardando || !form.Nombre || !form['Modulo Origen']} className="btn-primary text-sm">
              {guardando ? 'Guardando...' : 'Subir documento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
