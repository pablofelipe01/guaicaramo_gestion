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
  UserCog, Plus, Shield, HardHat, Stethoscope,
  AlertTriangle, ChevronRight, X,
} from 'lucide-react'
import type { CargoPerfilFields, CargoPeligroFields, CargoEppFields, CargoExamenFields } from '@/types/sst/cargo'
import type { AirtableRecord } from '@/lib/airtable-client'

type Perfil = AirtableRecord<CargoPerfilFields>
type Peligro = AirtableRecord<CargoPeligroFields>
type Epp = AirtableRecord<CargoEppFields>
type Examen = AirtableRecord<CargoExamenFields>

const NIVEL_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  '1': 'success', '2': 'success', '3': 'warning', '4': 'error', '5': 'error',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function PerfilesCargoPage() {
  const { user } = useAuth()
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Perfil | null>(null)
  const [tab, setTab] = useState<'peligros' | 'epps' | 'examenes'>('peligros')
  const [detalle, setDetalle] = useState<{ peligros: Peligro[]; epps: Epp[]; examenes: Examen[] }>({ peligros: [], epps: [], examenes: [] })
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalSubrecurso, setModalSubrecurso] = useState(false)
  const [form, setForm] = useState({ 'Nombre Cargo': '', Codigo: '', Area: '', 'Nivel Riesgo ARL': '1', Descripcion: '' })
  const [formSub, setFormSub] = useState<Record<string, string | boolean | number>>({})
  const [guardando, setGuardando] = useState(false)

  const cargarPerfiles = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/cargo/perfiles', { headers: authHeaders() })
    const data = await res.json()
    setPerfiles(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarPerfiles() }, [cargarPerfiles])

  const seleccionarPerfil = useCallback(async (perfil: Perfil) => {
    setSeleccionado(perfil)
    setLoadingDetalle(true)
    const [p, e, ex] = await Promise.all([
      fetch(`/api/sst/cargo/perfiles/${perfil.id}/peligros`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`/api/sst/cargo/perfiles/${perfil.id}/epps`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`/api/sst/cargo/perfiles/${perfil.id}/examenes`, { headers: authHeaders() }).then(r => r.json()),
    ])
    setDetalle({ peligros: p.records ?? [], epps: e.records ?? [], examenes: ex.records ?? [] })
    setLoadingDetalle(false)
  }, [])

  const guardarPerfil = async () => {
    setGuardando(true)
    await fetch('/api/sst/cargo/perfiles', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
    })
    setModalPerfil(false)
    setForm({ 'Nombre Cargo': '', Codigo: '', Area: '', 'Nivel Riesgo ARL': '1', Descripcion: '' })
    await cargarPerfiles()
    setGuardando(false)
  }

  const guardarSubrecurso = async () => {
    if (!seleccionado) return
    setGuardando(true)
    const endpoint = `/api/sst/cargo/perfiles/${seleccionado.id}/${tab}`
    await fetch(endpoint, { method: 'POST', headers: authHeaders(), body: JSON.stringify(formSub) })
    setModalSubrecurso(false)
    setFormSub({})
    await seleccionarPerfil(seleccionado)
    setGuardando(false)
  }

  const colsPerfiles: Column<Perfil & { id: string }>[] = [
    { key: 'Nombre Cargo', header: 'Cargo', render: (r) => <span className="font-medium">{r.fields['Nombre Cargo']}</span> },
    { key: 'Codigo', header: 'Código', render: (r) => r.fields.Codigo },
    { key: 'Area', header: 'Área', render: (r) => r.fields.Area },
    { key: 'Nivel Riesgo ARL', header: 'Riesgo ARL', render: (r) => <StatusBadge label={`Nivel ${r.fields['Nivel Riesgo ARL']}`} variant={NIVEL_VARIANT[r.fields['Nivel Riesgo ARL']]} /> },
    { key: 'Activo', header: 'Estado', render: (r) => <StatusBadge label={r.fields.Activo ? 'Activo' : 'Inactivo'} variant={r.fields.Activo ? 'success' : 'neutral'} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Perfiles de Cargo"
        description="Fuente de verdad para EPPs, exámenes médicos y capacitaciones por cargo"
        icon={UserCog}
        iconColor="text-green-600"
        actions={
          <button onClick={() => setModalPerfil(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Nuevo cargo
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">{perfiles.length} cargos registrados</p>
            </div>
            <DataTable
              columns={colsPerfiles}
              data={perfiles.map(p => ({ ...p, id: p.id }))}
              isLoading={loading}
              emptyMessage="No hay perfiles de cargo"
              actions={(row) => (
                <button onClick={() => seleccionarPerfil(row as unknown as Perfil)} className="text-blue-600 hover:text-blue-800">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            />
          </Card>
        </div>

        <div className="lg:col-span-3">
          {!seleccionado ? (
            <Card>
              <EmptyState icon={UserCog} title="Selecciona un cargo" description="Haz clic en un cargo de la lista para ver sus peligros, EPPs y exámenes." />
            </Card>
          ) : (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{seleccionado.fields['Nombre Cargo']}</p>
                  <p className="text-xs text-gray-500">{seleccionado.fields.Area} — Código {seleccionado.fields.Codigo}</p>
                </div>
                <button onClick={() => setSeleccionado(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex border-b border-gray-200">
                {([
                  { key: 'peligros', label: 'Peligros', icon: AlertTriangle, count: detalle.peligros.length },
                  { key: 'epps', label: 'EPPs', icon: HardHat, count: detalle.epps.length },
                  { key: 'examenes', label: 'Exámenes', icon: Stethoscope, count: detalle.examenes.length },
                ] as const).map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={['flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px', tab === key ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'].join(' ')}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                ))}
              </div>

              <div className="p-4">
                <div className="flex justify-end mb-3">
                  <button onClick={() => { setFormSub({}); setModalSubrecurso(true) }} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>

                {tab === 'peligros' && (
                  <div className="space-y-2">
                    {loadingDetalle ? <p className="text-sm text-gray-400">Cargando...</p> : detalle.peligros.length === 0 ? <p className="text-sm text-gray-400">Sin peligros registrados</p> : detalle.peligros.map(p => (
                      <div key={p.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.fields.Descripcion}</p>
                          <div className="flex gap-2 mt-1">
                            <StatusBadge label={p.fields.Clasificacion} variant="info" />
                            <StatusBadge label={p.fields['Nivel Probabilidad']} variant={p.fields['Nivel Probabilidad'] === 'alto' ? 'error' : p.fields['Nivel Probabilidad'] === 'medio' ? 'warning' : 'success'} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'epps' && (
                  <div className="space-y-2">
                    {loadingDetalle ? <p className="text-sm text-gray-400">Cargando...</p> : detalle.epps.length === 0 ? <p className="text-sm text-gray-400">Sin EPPs registrados</p> : detalle.epps.map(e => (
                      <div key={e.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{e.fields['Nombre EPP']}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <StatusBadge label={e.fields.Tipo} variant="neutral" />
                            {e.fields.Obligatorio && <StatusBadge label="Obligatorio" variant="error" />}
                            <span className="text-xs text-gray-400">Reposición: {e.fields['Frecuencia Reposicion Meses']} meses</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'examenes' && (
                  <div className="space-y-2">
                    {loadingDetalle ? <p className="text-sm text-gray-400">Cargando...</p> : detalle.examenes.length === 0 ? <p className="text-sm text-gray-400">Sin exámenes registrados</p> : detalle.examenes.map(ex => (
                      <div key={ex.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Stethoscope className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{ex.fields['Tipo Examen']}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <StatusBadge label={ex.fields.Tipo} variant="primary" />
                            <span className="text-xs text-gray-400">Periodicidad: {ex.fields['Periodicidad Meses']} meses</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={modalPerfil} onClose={() => setModalPerfil(false)} title="Nuevo perfil de cargo">
        <div className="space-y-4">
          {[
            { label: 'Nombre del cargo *', key: 'Nombre Cargo', type: 'text' },
            { label: 'Código *', key: 'Codigo', type: 'text' },
            { label: 'Área *', key: 'Area', type: 'text' },
            { label: 'Descripción', key: 'Descripcion', type: 'textarea' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {type === 'textarea'
                ? <textarea rows={3} value={form[key as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
                : <input type="text" value={form[key as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
              }
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de riesgo ARL *</label>
            <select value={form['Nivel Riesgo ARL']} onChange={e => setForm(f => ({ ...f, 'Nivel Riesgo ARL': e.target.value }))} className="input-field">
              {['1', '2', '3', '4', '5'].map(n => <option key={n} value={n}>Nivel {n}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalPerfil(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={guardarPerfil} disabled={guardando} className="btn-primary text-sm">
              {guardando ? 'Guardando...' : 'Guardar cargo'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalSubrecurso}
        onClose={() => setModalSubrecurso(false)}
        title={tab === 'peligros' ? 'Agregar peligro' : tab === 'epps' ? 'Agregar EPP' : 'Agregar examen'}
      >
        <SubrecursoForm tab={tab} form={formSub} setForm={setFormSub} onSave={guardarSubrecurso} onCancel={() => setModalSubrecurso(false)} guardando={guardando} />
      </Modal>
    </div>
  )
}

function SubrecursoForm({ tab, form, setForm, onSave, onCancel, guardando }: {
  tab: 'peligros' | 'epps' | 'examenes'
  form: Record<string, string | boolean | number>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string | boolean | number>>>
  onSave: () => void
  onCancel: () => void
  guardando: boolean
}) {
  const field = (key: string, label: string, type: string, options?: string[]) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'select' && options
        ? <select value={form[key] as string ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field">
            <option value="">Seleccionar...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : type === 'number'
        ? <input type="number" value={form[key] as number ?? ''} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} className="input-field" />
        : type === 'checkbox'
        ? <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 mt-1" />
        : <input type="text" value={form[key] as string ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
      }
    </div>
  )

  return (
    <div className="space-y-4">
      {tab === 'peligros' && <>
        {field('Descripcion', 'Descripción *', 'text')}
        {field('Clasificacion', 'Clasificación *', 'select', ['biologico', 'fisico', 'quimico', 'psicosocial', 'biomecanico', 'condiciones_seguridad', 'fenomenos_naturales'])}
        {field('Nivel Probabilidad', 'Nivel de probabilidad *', 'select', ['bajo', 'medio', 'alto'])}
        {field('Fuente', 'Fuente del peligro', 'text')}
      </>}
      {tab === 'epps' && <>
        {field('Nombre EPP', 'Nombre del EPP *', 'text')}
        {field('Tipo', 'Tipo *', 'select', ['cabeza', 'ojos_cara', 'oidos', 'respiratorio', 'manos', 'pies', 'cuerpo_completo', 'altura'])}
        {field('Frecuencia Reposicion Meses', 'Frecuencia de reposición (meses) *', 'number')}
        {field('Norma Referencia', 'Norma de referencia', 'text')}
        <div className="flex items-center gap-2">
          {field('Obligatorio', 'Obligatorio', 'checkbox')}
          <label className="text-sm text-gray-700">Obligatorio</label>
        </div>
      </>}
      {tab === 'examenes' && <>
        {field('Tipo Examen', 'Tipo de examen *', 'text')}
        {field('Tipo', 'Momento del examen *', 'select', ['ingreso', 'periodico', 'retiro', 'post_incapacidad', 'cambio_cargo'])}
        {field('Periodicidad Meses', 'Periodicidad (meses)', 'number')}
        {field('Descripcion', 'Descripción', 'text')}
        <div className="flex items-center gap-2">
          {field('Obligatorio', 'Obligatorio', 'checkbox')}
          <label className="text-sm text-gray-700">Obligatorio</label>
        </div>
      </>}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
        <button onClick={onSave} disabled={guardando} className="btn-primary text-sm">
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
