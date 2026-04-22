'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { RefreshCw, Plus, CheckCircle2, XCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import type { CambioFields, CambioAprobacionFields, CambioControlFields } from '@/types/sst/cambio'
import type { AirtableRecord } from '@/lib/airtable-client'

type Cambio = AirtableRecord<CambioFields>
type Aprobacion = AirtableRecord<CambioAprobacionFields>
type Control = AirtableRecord<CambioControlFields>

const ESTADO_VARIANT: Record<string, 'neutral' | 'primary' | 'success' | 'error' | 'warning'> = {
  borrador: 'neutral', en_revision: 'primary', aprobado: 'success', rechazado: 'error', implementado: 'warning',
}
const TIPOS_CAMBIO = ['organizacional', 'tecnologico', 'proceso', 'infraestructura', 'otro']
const TIPOS_CONTROL = ['eliminacion', 'sustitucion', 'control_ingenieria', 'administrativo', 'epp']

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function GestionCambioPage() {
  const { user } = useAuth()
  const [cambios, setCambios] = useState<Cambio[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Cambio | null>(null)
  const [aprobaciones, setAprobaciones] = useState<Aprobacion[]>([])
  const [controles, setControles] = useState<Control[]>([])
  const [tab, setTab] = useState<'aprobaciones' | 'controles'>('aprobaciones')
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalCambio, setModalCambio] = useState(false)
  const [modalAprobacion, setModalAprobacion] = useState(false)
  const [modalControl, setModalControl] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formCambio, setFormCambio] = useState({ Titulo: '', Descripcion: '', Tipo: 'organizacional', Justificacion: '', 'Area Afectada': '', 'Requiere Analisis Riesgo': false })
  const [formAprob, setFormAprob] = useState({ Decision: 'aprobado', Rol: 'coordinador_sst', Observaciones: '' })
  const [formControl, setFormControl] = useState({ Descripcion: '', Tipo: 'administrativo', Responsable: '', 'Fecha Limite': '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/cambios', { headers: authHeaders() })
    const data = await res.json()
    setCambios(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback(async (c: Cambio) => {
    setSeleccionado(c)
    setLoadingDetalle(true)
    try {
      const [aprsRes, ctrlsRes] = await Promise.all([
        fetch(`/api/sst/cambios/${c.id}/aprobaciones`, { headers: authHeaders() }),
        fetch(`/api/sst/cambios/${c.id}/controles`, { headers: authHeaders() }),
      ])
      if (aprsRes.ok) {
        const aprs = await aprsRes.json()
        setAprobaciones(aprs.records ?? [])
      }
      if (ctrlsRes.ok) {
        const ctrls = await ctrlsRes.json()
        setControles(ctrls.records ?? [])
      }
    } catch (error) {
      console.error('Error cargando cambio:', error)
    }
    setLoadingDetalle(false)
  }, [])

  const crearCambio = async () => {
    if (!formCambio.Titulo) return
    setGuardando(true)
    await fetch('/api/sst/cambios', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formCambio, Solicitante: user?.name }),
    })
    setModalCambio(false)
    setFormCambio({ Titulo: '', Descripcion: '', Tipo: 'organizacional', Justificacion: '', 'Area Afectada': '', 'Requiere Analisis Riesgo': false })
    await cargar()
    setGuardando(false)
  }

  const registrarAprobacion = async () => {
    if (!seleccionado) return
    setGuardando(true)
    await fetch(`/api/sst/cambios/${seleccionado.id}/aprobaciones`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify(formAprob),
    })
    setModalAprobacion(false)
    setFormAprob({ Decision: 'aprobado', Rol: 'coordinador_sst', Observaciones: '' })
    await seleccionar(seleccionado)
    await cargar()
    setGuardando(false)
  }

  const crearControl = async () => {
    if (!seleccionado || !formControl.Descripcion) return
    setGuardando(true)
    await fetch(`/api/sst/cambios/${seleccionado.id}/controles`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formControl, Responsable: formControl.Responsable || user?.name }),
    })
    setModalControl(false)
    setFormControl({ Descripcion: '', Tipo: 'administrativo', Responsable: '', 'Fecha Limite': '' })
    await seleccionar(seleccionado)
    setGuardando(false)
  }

  const enviarRevision = async (cambio: Cambio) => {
    await fetch(`/api/sst/cambios/${cambio.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ Estado: 'en_revision' }),
    })
    await cargar()
    if (seleccionado?.id === cambio.id) await seleccionar({ ...cambio, fields: { ...cambio.fields, Estado: 'en_revision' } })
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={RefreshCw}
        title="Gestión del Cambio"
        description="Control de cambios organizacionales y tecnológicos en el SG-SST"
        actions={
          <button onClick={() => setModalCambio(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Nuevo cambio
          </button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista cambios */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full overflow-auto p-0">
            {loading ? <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
              : cambios.length === 0 ? <EmptyState icon={RefreshCw} title="Sin cambios registrados" description="Registra el primer cambio" />
              : <ul>
                  {cambios.map(c => (
                    <li key={c.id} onClick={() => seleccionar(c)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${seleccionado?.id === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                      <div className="font-medium text-sm text-gray-900 truncate">{c.fields.Titulo}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge variant={ESTADO_VARIANT[c.fields.Estado]} label={c.fields.Estado} />
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded capitalize">{c.fields.Tipo}</span>
                      </div>
                      {c.fields['Requiere Analisis Riesgo'] && (
                        <div className="text-xs text-orange-600 mt-1">⚠ Requiere análisis de riesgo</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{c.fields.Solicitante}</div>
                    </li>
                  ))}
                </ul>
            }
          </Card>
        </div>

        {/* Detalle */}
        {!seleccionado ? (
          <Card className="flex-1 flex items-center justify-center">
            <EmptyState icon={RefreshCw} title="Selecciona un cambio" description="Haz clic para ver aprobaciones y controles" />
          </Card>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Header cambio */}
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900">{seleccionado.fields.Titulo}</h2>
                  {seleccionado.fields.Descripcion && <p className="text-sm text-gray-500 mt-1">{seleccionado.fields.Descripcion}</p>}
                  <div className="flex gap-2 mt-2">
                    <StatusBadge variant={ESTADO_VARIANT[seleccionado.fields.Estado]} label={seleccionado.fields.Estado} />
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{seleccionado.fields.Tipo}</span>
                    {seleccionado.fields['Area Afectada'] && <span className="text-xs text-gray-500">{seleccionado.fields['Area Afectada']}</span>}
                  </div>
                </div>
                {seleccionado.fields.Estado === 'borrador' && (
                  <button onClick={() => enviarRevision(seleccionado)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex-shrink-0">
                    <RotateCcw size={14} /> Enviar a revisión
                  </button>
                )}
              </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2">
              {(['aprobaciones', 'controles'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
              <div className="flex-1" />
              {tab === 'aprobaciones' && seleccionado.fields.Estado === 'en_revision' && (
                <button onClick={() => setModalAprobacion(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={12} /> Decisión
                </button>
              )}
              {tab === 'controles' && seleccionado.fields.Estado === 'aprobado' && (
                <button onClick={() => setModalControl(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Plus size={12} /> Control
                </button>
              )}
            </div>

            <Card className="flex-1 overflow-auto p-0">
              {loadingDetalle ? <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
                : tab === 'aprobaciones' ? (
                  aprobaciones.length === 0
                    ? <EmptyState icon={ShieldCheck} title="Sin aprobaciones" description={seleccionado.fields.Estado === 'en_revision' ? 'Registra la decisión del coordinador SST' : 'Envía el cambio a revisión primero'} />
                    : <ul>
                        {aprobaciones.map(a => (
                          <li key={a.id} className="p-4 border-b">
                            <div className="flex items-center gap-3">
                              {a.fields.Decision === 'aprobado' ? <CheckCircle2 size={18} className="text-green-500" />
                                : a.fields.Decision === 'rechazado' ? <XCircle size={18} className="text-red-500" />
                                : <RotateCcw size={18} className="text-yellow-500" />}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm capitalize">{a.fields.Decision}</span>
                                  <span className="text-xs text-gray-500">— {a.fields.Aprobador}</span>
                                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.fields.Rol}</span>
                                </div>
                                {a.fields.Observaciones && <p className="text-xs text-gray-600 mt-1">{a.fields.Observaciones}</p>}
                              </div>
                              <span className="text-xs text-gray-400">{a.fields['Fecha Decision']}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                ) : (
                  controles.length === 0
                    ? <EmptyState icon={ShieldCheck} title="Sin controles" description={seleccionado.fields.Estado === 'aprobado' ? 'Agrega los controles a implementar' : 'El cambio debe estar aprobado'} />
                    : <ul>
                        {controles.map(c => (
                          <li key={c.id} className="p-4 border-b">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800">{c.fields.Descripcion}</div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded capitalize">{c.fields.Tipo}</span>
                                  <span>{c.fields.Responsable}</span>
                                  {c.fields['Fecha Limite'] && <span>· {c.fields['Fecha Limite']}</span>}
                                </div>
                              </div>
                              <StatusBadge variant={c.fields.Estado === 'implementado' ? 'success' : c.fields.Estado === 'verificado' ? 'primary' : 'neutral'} label={c.fields.Estado} />
                            </div>
                          </li>
                        ))}
                      </ul>
                )
              }
            </Card>
          </div>
        )}
      </div>

      <Modal open={modalCambio} onClose={() => setModalCambio(false)} title="Nuevo cambio" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formCambio.Titulo} onChange={e => setFormCambio(f => ({ ...f, Titulo: e.target.value }))}
              className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select value={formCambio.Tipo} onChange={e => setFormCambio(f => ({ ...f, Tipo: e.target.value }))}
                className="input-field">
                {TIPOS_CAMBIO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área afectada</label>
              <input type="text" value={formCambio['Area Afectada']} onChange={e => setFormCambio(f => ({ ...f, 'Area Afectada': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={formCambio.Descripcion} onChange={e => setFormCambio(f => ({ ...f, Descripcion: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justificación</label>
            <textarea value={formCambio.Justificacion} onChange={e => setFormCambio(f => ({ ...f, Justificacion: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="analisis" checked={formCambio['Requiere Analisis Riesgo']}
              onChange={e => setFormCambio(f => ({ ...f, 'Requiere Analisis Riesgo': e.target.checked }))} className="rounded" />
            <label htmlFor="analisis" className="text-sm text-gray-700">Requiere análisis de riesgo (IPVR)</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalCambio(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearCambio} disabled={guardando || !formCambio.Titulo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalAprobacion} onClose={() => setModalAprobacion(false)} title="Registrar decisión" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decisión</label>
              <select value={formAprob.Decision} onChange={e => setFormAprob(f => ({ ...f, Decision: e.target.value }))}
                className="input-field">
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="devuelto">Devuelto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select value={formAprob.Rol} onChange={e => setFormAprob(f => ({ ...f, Rol: e.target.value }))}
                className="input-field">
                <option value="coordinador_sst">Coordinador SST</option>
                <option value="gerencia">Gerencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea value={formAprob.Observaciones} onChange={e => setFormAprob(f => ({ ...f, Observaciones: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalAprobacion(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={registrarAprobacion} disabled={guardando}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalControl} onClose={() => setModalControl(false)} title="Agregar control" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea value={formControl.Descripcion} onChange={e => setFormControl(f => ({ ...f, Descripcion: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={formControl.Tipo} onChange={e => setFormControl(f => ({ ...f, Tipo: e.target.value }))}
                className="input-field">
                {TIPOS_CONTROL.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <input type="text" value={formControl.Responsable} onChange={e => setFormControl(f => ({ ...f, Responsable: e.target.value }))}
                placeholder={user?.name} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
            <input type="date" value={formControl['Fecha Limite']} onChange={e => setFormControl(f => ({ ...f, 'Fecha Limite': e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalControl(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearControl} disabled={guardando || !formControl.Descripcion}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
