'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Scale, Plus, Bell, CheckCircle2, Clock, XCircle, MinusCircle } from 'lucide-react'
import type { LegalRequisitoFields, LegalCumplimientoFields } from '@/types/sst/legal'
import type { AirtableRecord } from '@/lib/airtable-client'

type Requisito = AirtableRecord<LegalRequisitoFields>
type Cumplimiento = AirtableRecord<LegalCumplimientoFields>

interface Resumen { total: number; cumple: number; parcial: number; no_cumple: number; en_proceso: number }

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'neutral'> = {
  cumple: 'success', parcial: 'warning', no_cumple: 'error', en_proceso: 'primary', no_aplica: 'neutral',
}
const ESTADO_ICON: Record<string, React.ReactNode> = {
  cumple: <CheckCircle2 size={14} className="text-green-500" />,
  parcial: <MinusCircle size={14} className="text-yellow-500" />,
  no_cumple: <XCircle size={14} className="text-red-500" />,
  en_proceso: <Clock size={14} className="text-blue-500" />,
  no_aplica: <MinusCircle size={14} className="text-gray-400" />,
}
const TIPOS = ['ley','decreto','resolucion','circular','norma_tecnica']
const AMBITOS = ['nacional','sectorial','empresa']
const ESTADOS_CUMPL = ['cumple','parcial','no_cumple','en_proceso','no_aplica']

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function MatrizLegalPage() {
  const { user } = useAuth()
  const [requisitos, setRequisitos] = useState<Requisito[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Requisito | null>(null)
  const [cumplimientos, setCumplimientos] = useState<Cumplimiento[]>([])
  const [alertas, setAlertas] = useState<Cumplimiento[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [verAlertas, setVerAlertas] = useState(false)
  const [filtroTodos, setFiltroTodos] = useState(false)
  const [modalRequisito, setModalRequisito] = useState(false)
  const [modalCumplimiento, setModalCumplimiento] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formReq, setFormReq] = useState({ Norma: '', Articulo: '', Descripcion: '', Tipo: 'decreto', Ambito: 'nacional', 'Fecha Vigencia': '' })
  const [formCumpl, setFormCumpl] = useState({ Estado: 'en_proceso', Responsable: '', Observaciones: '', 'Proxima Revision': '', 'Evidencia URL': '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    const [reqs, alts, res] = await Promise.all([
      fetch(`/api/sst/legal/requisitos${filtroTodos ? '?todos=true' : ''}`, { headers: authHeaders() }).then(r => r.json()),
      fetch('/api/sst/legal/requisitos?alertas=true', { headers: authHeaders() }).then(r => r.json()),
      fetch('/api/sst/legal/requisitos?resumen=true', { headers: authHeaders() }).then(r => r.json()),
    ])
    setRequisitos(reqs.records ?? [])
    setAlertas(alts.alertas ?? [])
    setResumen(res)
    setLoading(false)
  }, [filtroTodos])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback(async (req: Requisito) => {
    setSeleccionado(req)
    setLoadingDetalle(true)
    const res = await fetch(`/api/sst/legal/requisitos/${req.id}/cumplimientos`, { headers: authHeaders() })
    const data = await res.json()
    setCumplimientos(data.records ?? [])
    setLoadingDetalle(false)
  }, [])

  const crearRequisito = async () => {
    if (!formReq.Norma) return
    setGuardando(true)
    await fetch('/api/sst/legal/requisitos', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formReq, Activo: true }),
    })
    setModalRequisito(false)
    setFormReq({ Norma: '', Articulo: '', Descripcion: '', Tipo: 'decreto', Ambito: 'nacional', 'Fecha Vigencia': '' })
    await cargar()
    setGuardando(false)
  }

  const crearCumplimiento = async () => {
    if (!seleccionado) return
    setGuardando(true)
    await fetch(`/api/sst/legal/requisitos/${seleccionado.id}/cumplimientos`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formCumpl, Responsable: formCumpl.Responsable || user?.name }),
    })
    setModalCumplimiento(false)
    setFormCumpl({ Estado: 'en_proceso', Responsable: '', Observaciones: '', 'Proxima Revision': '', 'Evidencia URL': '' })
    await seleccionar(seleccionado)
    setGuardando(false)
  }

  const ultimoCumplimiento = cumplimientos[0]

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={Scale}
        title="Matriz Legal"
        description="Requisitos legales aplicables al SG-SST"
        actions={
          <div className="flex gap-2">
            {alertas.length > 0 && (
              <button onClick={() => setVerAlertas(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
                <Bell size={15} /> {alertas.length} vencimiento(s)
              </button>
            )}
            <button onClick={() => setModalRequisito(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={16} /> Nuevo requisito
            </button>
          </div>
        }
      />

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', value: resumen.total, color: 'text-gray-700' },
            { label: 'Cumple', value: resumen.cumple, color: 'text-green-600' },
            { label: 'Parcial', value: resumen.parcial, color: 'text-yellow-600' },
            { label: 'No cumple', value: resumen.no_cumple, color: 'text-red-600' },
            { label: 'En proceso', value: resumen.en_proceso, color: 'text-blue-600' },
          ].map(item => (
            <Card key={item.label} className="text-center py-3">
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista requisitos */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={filtroTodos} onChange={e => setFiltroTodos(e.target.checked)} className="rounded" />
              Ver todos (incl. inactivos)
            </label>
          </div>
          <Card className="flex-1 overflow-auto p-0">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
            ) : requisitos.length === 0 ? (
              <EmptyState icon={Scale} title="Sin requisitos" description="Agrega el primer requisito legal" />
            ) : (
              <ul>
                {requisitos.map(r => (
                  <li key={r.id} onClick={() => seleccionar(r)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${seleccionado?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                    <div className="font-medium text-sm text-gray-900 truncate">{r.fields.Norma}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded capitalize">{r.fields.Tipo}</span>
                      <span className="text-xs text-gray-500 capitalize">{r.fields.Ambito}</span>
                    </div>
                    {r.fields.Articulo && <div className="text-xs text-gray-400 mt-0.5">Art. {r.fields.Articulo}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Detalle */}
        <div className="flex-1 min-w-0">
          {!seleccionado ? (
            <Card className="h-full flex items-center justify-center">
              <EmptyState icon={Scale} title="Selecciona un requisito" description="Haz clic para ver el estado de cumplimiento" />
            </Card>
          ) : (
            <Card className="h-full flex flex-col overflow-auto">
              {/* Header requisito */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{seleccionado.fields.Norma}</h2>
                  {seleccionado.fields.Articulo && (
                    <div className="text-sm text-gray-500 mt-0.5">Artículo {seleccionado.fields.Articulo}</div>
                  )}
                  {seleccionado.fields.Descripcion && (
                    <p className="text-sm text-gray-600 mt-2">{seleccionado.fields.Descripcion}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{seleccionado.fields.Tipo}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{seleccionado.fields.Ambito}</span>
                    {seleccionado.fields['Fecha Vigencia'] && (
                      <span className="text-xs text-gray-500">Vigente desde: {seleccionado.fields['Fecha Vigencia']}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setModalCumplimiento(true)}
                  className="flex items-center gap-1.5 ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex-shrink-0">
                  <Plus size={14} /> Registrar cumplimiento
                </button>
              </div>

              {/* Estado actual */}
              {ultimoCumplimiento ? (
                <div className="mb-4 p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-3 mb-2">
                    {ESTADO_ICON[ultimoCumplimiento.fields.Estado]}
                    <span className="font-semibold text-gray-800 capitalize">{ultimoCumplimiento.fields.Estado.replace('_', ' ')}</span>
                    <StatusBadge variant={ESTADO_VARIANT[ultimoCumplimiento.fields.Estado]} label="Estado actual" />
                  </div>
                  {ultimoCumplimiento.fields.Responsable && (
                    <div className="text-xs text-gray-500">Responsable: {ultimoCumplimiento.fields.Responsable}</div>
                  )}
                  {ultimoCumplimiento.fields['Proxima Revision'] && (
                    <div className="text-xs text-gray-500 mt-0.5">Próxima revisión: {ultimoCumplimiento.fields['Proxima Revision']}</div>
                  )}
                  {ultimoCumplimiento.fields.Observaciones && (
                    <p className="text-sm text-gray-600 mt-2">{ultimoCumplimiento.fields.Observaciones}</p>
                  )}
                </div>
              ) : (
                <div className="mb-4 p-4 rounded-lg border border-dashed bg-yellow-50 text-center">
                  <Clock size={20} className="mx-auto text-yellow-500 mb-1" />
                  <p className="text-sm text-yellow-700">Sin registros de cumplimiento</p>
                </div>
              )}

              {/* Historial */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700 mb-3">Historial ({cumplimientos.length})</div>
                {loadingDetalle ? (
                  <div className="text-center text-gray-500 text-sm">Cargando...</div>
                ) : cumplimientos.length === 0 ? null : (
                  <div className="space-y-2">
                    {cumplimientos.map(c => (
                      <div key={c.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-0.5">{ESTADO_ICON[c.fields.Estado]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusBadge variant={ESTADO_VARIANT[c.fields.Estado]} label={c.fields.Estado} />
                            {c.fields['Fecha Revision'] && (
                              <span className="text-xs text-gray-400">{c.fields['Fecha Revision']}</span>
                            )}
                          </div>
                          {c.fields.Observaciones && <p className="text-xs text-gray-600 mt-1">{c.fields.Observaciones}</p>}
                          {c.fields.Responsable && <div className="text-xs text-gray-400 mt-0.5">{c.fields.Responsable}</div>}
                        </div>
                        {c.fields['Evidencia URL'] && (
                          <a href={c.fields['Evidencia URL']} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex-shrink-0">
                            Evidencia
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal alertas */}
      <Modal open={verAlertas} onClose={() => setVerAlertas(false)} title="Revisiones vencidas o próximas" size="md">
        <div className="space-y-2 max-h-80 overflow-auto">
          {alertas.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg bg-orange-50">
              <Bell size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-800">{a.fields['Requisito Nombre']}</div>
                <div className="text-xs text-orange-600 mt-0.5">Próxima revisión: {a.fields['Proxima Revision']}</div>
                {a.fields.Responsable && <div className="text-xs text-gray-500">{a.fields.Responsable}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={() => setVerAlertas(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Cerrar</button>
        </div>
      </Modal>

      {/* Modal nuevo requisito */}
      <Modal open={modalRequisito} onClose={() => setModalRequisito(false)} title="Nuevo requisito legal" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Norma *</label>
            <input type="text" value={formReq.Norma} onChange={e => setFormReq(f => ({ ...f, Norma: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Decreto 1072 de 2015" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artículo</label>
              <input type="text" value={formReq.Articulo} onChange={e => setFormReq(f => ({ ...f, Articulo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={formReq.Tipo} onChange={e => setFormReq(f => ({ ...f, Tipo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ámbito</label>
              <select value={formReq.Ambito} onChange={e => setFormReq(f => ({ ...f, Ambito: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                {AMBITOS.map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={formReq.Descripcion} onChange={e => setFormReq(f => ({ ...f, Descripcion: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vigencia</label>
            <input type="date" value={formReq['Fecha Vigencia']} onChange={e => setFormReq(f => ({ ...f, 'Fecha Vigencia': e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalRequisito(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearRequisito} disabled={guardando || !formReq.Norma}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal registrar cumplimiento */}
      <Modal open={modalCumplimiento} onClose={() => setModalCumplimiento(false)} title="Registrar cumplimiento" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
            <select value={formCumpl.Estado} onChange={e => setFormCumpl(f => ({ ...f, Estado: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {ESTADOS_CUMPL.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <input type="text" value={formCumpl.Responsable} onChange={e => setFormCumpl(f => ({ ...f, Responsable: e.target.value }))}
                placeholder={user?.name}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próxima revisión</label>
              <input type="date" value={formCumpl['Proxima Revision']} onChange={e => setFormCumpl(f => ({ ...f, 'Proxima Revision': e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea value={formCumpl.Observaciones} onChange={e => setFormCumpl(f => ({ ...f, Observaciones: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de evidencia</label>
            <input type="url" value={formCumpl['Evidencia URL']} onChange={e => setFormCumpl(f => ({ ...f, 'Evidencia URL': e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalCumplimiento(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearCumplimiento} disabled={guardando}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
