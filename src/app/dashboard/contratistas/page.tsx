'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { HardHat, Plus, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react'
import type { ContContratistaFields, ContDocumentoFields, ContTrabajadorFields } from '@/types/sst/cont'
import type { AirtableRecord } from '@/lib/airtable-client'

type Contratista = AirtableRecord<ContContratistaFields>
type Documento = AirtableRecord<ContDocumentoFields>
type Trabajador = AirtableRecord<ContTrabajadorFields>
interface Semaforo { color: 'verde' | 'amarillo' | 'rojo'; vencidos: number; proximosVencer: number; sinInduccion: number; totalDocumentos: number; totalTrabajadores: number }

const SEMAFORO_COLOR: Record<string, string> = {
  verde: 'bg-green-500', amarillo: 'bg-yellow-400', rojo: 'bg-red-500',
}
const DOC_ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  vigente: 'success', proximo_vencer: 'warning', vencido: 'error',
}
const TIPOS_DOC = ['arl', 'eps', 'pension', 'sgsst', 'rut', 'camara_comercio', 'otro']

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function ContratistasPage() {
  const { user } = useAuth()
  const [contratistas, setContratistas] = useState<Contratista[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Contratista | null>(null)
  const [semaforo, setSemaforo] = useState<Semaforo | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [tab, setTab] = useState<'documentos' | 'trabajadores'>('documentos')
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalContratista, setModalContratista] = useState(false)
  const [modalDoc, setModalDoc] = useState(false)
  const [modalTrabajador, setModalTrabajador] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formCont, setFormCont] = useState({ 'Nombre Empresa': '', NIT: '', 'Representante Legal': '', Email: '', Telefono: '', Actividad: '' })
  const [formDoc, setFormDoc] = useState({ Tipo: 'arl', 'Fecha Vencimiento': '', 'URL Documento': '' })
  const [formTrab, setFormTrab] = useState({ 'Nombre Completo': '', Identificacion: '', Cargo: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/contratistas', { headers: authHeaders() })
    const data = await res.json()
    setContratistas(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback(async (c: Contratista) => {
    setSeleccionado(c)
    setLoadingDetalle(true)
    try {
      const [semRes, docsRes, trabsRes] = await Promise.all([
        fetch(`/api/sst/contratistas/${c.id}/semaforo`, { headers: authHeaders() }),
        fetch(`/api/sst/contratistas/${c.id}/documentos`, { headers: authHeaders() }),
        fetch(`/api/sst/contratistas/${c.id}/trabajadores`, { headers: authHeaders() }),
      ])
      if (semRes.ok) {
        const sem = await semRes.json()
        setSemaforo(sem)
      }
      if (docsRes.ok) {
        const docs = await docsRes.json()
        setDocumentos(docs.records ?? [])
      }
      if (trabsRes.ok) {
        const trabs = await trabsRes.json()
        setTrabajadores(trabs.records ?? [])
      }
    } catch (error) {
      console.error('Error cargando contratista:', error)
    }
    setLoadingDetalle(false)
  }, [])

  const crearContratista = async () => {
    if (!formCont['Nombre Empresa'] || !formCont.NIT) return
    setGuardando(true)
    await fetch('/api/sst/contratistas', { method: 'POST', headers: authHeaders(), body: JSON.stringify(formCont) })
    setModalContratista(false)
    setFormCont({ 'Nombre Empresa': '', NIT: '', 'Representante Legal': '', Email: '', Telefono: '', Actividad: '' })
    await cargar()
    setGuardando(false)
  }

  const crearDocumento = async () => {
    if (!seleccionado || !formDoc['Fecha Vencimiento']) return
    setGuardando(true)
    await fetch(`/api/sst/contratistas/${seleccionado.id}/documentos`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(formDoc),
    })
    setModalDoc(false)
    setFormDoc({ Tipo: 'arl', 'Fecha Vencimiento': '', 'URL Documento': '' })
    await seleccionar(seleccionado)
    setGuardando(false)
  }

  const crearTrabajador = async () => {
    if (!seleccionado || !formTrab['Nombre Completo']) return
    setGuardando(true)
    await fetch(`/api/sst/contratistas/${seleccionado.id}/trabajadores`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(formTrab),
    })
    setModalTrabajador(false)
    setFormTrab({ 'Nombre Completo': '', Identificacion: '', Cargo: '' })
    await seleccionar(seleccionado)
    setGuardando(false)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={HardHat}
        title="Gestión de Contratistas"
        description="Control de requisitos SST y semáforo de cumplimiento"
        actions={
          <button onClick={() => setModalContratista(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Nuevo contratista
          </button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista contratistas */}
        <div className="w-72 flex-shrink-0">
          <Card className="h-full overflow-auto p-0">
            {loading ? <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
              : contratistas.length === 0 ? <EmptyState icon={HardHat} title="Sin contratistas" description="Registra el primer contratista" />
              : <ul>
                  {contratistas.map(c => (
                    <li key={c.id} onClick={() => seleccionar(c)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${seleccionado?.id === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                      <div className="font-medium text-sm text-gray-900 truncate">{c.fields['Nombre Empresa']}</div>
                      <div className="text-xs text-gray-500 mt-0.5">NIT: {c.fields.NIT}</div>
                      {c.fields.Actividad && <div className="text-xs text-gray-400 truncate mt-0.5">{c.fields.Actividad}</div>}
                    </li>
                  ))}
                </ul>
            }
          </Card>
        </div>

        {/* Detalle */}
        {!seleccionado ? (
          <Card className="flex-1 flex items-center justify-center">
            <EmptyState icon={HardHat} title="Selecciona un contratista" description="Haz clic para ver documentos y trabajadores" />
          </Card>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Semáforo */}
            {semaforo && (
              <Card>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${SEMAFORO_COLOR[semaforo.color]} flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 capitalize">Semáforo: {semaforo.color}</div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      {semaforo.vencidos > 0 && <span className="text-red-600">{semaforo.vencidos} doc(s) vencido(s)</span>}
                      {semaforo.proximosVencer > 0 && <span className="text-yellow-600">{semaforo.proximosVencer} próximo(s) a vencer</span>}
                      {semaforo.sinInduccion > 0 && <span className="text-orange-600">{semaforo.sinInduccion} sin inducción</span>}
                      {semaforo.color === 'verde' && <span className="text-green-600">Todos los documentos vigentes</span>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{semaforo.totalDocumentos} docs · {semaforo.totalTrabajadores} trabajadores</div>
                </div>
              </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setTab('documentos')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'documentos' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                Documentos
              </button>
              <button onClick={() => setTab('trabajadores')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'trabajadores' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                Trabajadores
              </button>
              <div className="flex-1" />
              {tab === 'documentos' ? (
                <button onClick={() => setModalDoc(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={12} /> Documento
                </button>
              ) : (
                <button onClick={() => setModalTrabajador(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Plus size={12} /> Trabajador
                </button>
              )}
            </div>

            <Card className="flex-1 overflow-auto p-0">
              {loadingDetalle ? <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
                : tab === 'documentos' ? (
                  documentos.length === 0 ? <EmptyState icon={AlertTriangle} title="Sin documentos" description="Agrega los documentos del contratista" />
                    : <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>{['Tipo', 'Vencimiento', 'Estado', 'Documento'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {documentos.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium uppercase text-gray-800">{d.fields.Tipo}</td>
                              <td className="px-4 py-3 text-gray-600">{d.fields['Fecha Vencimiento']}</td>
                              <td className="px-4 py-3"><StatusBadge variant={DOC_ESTADO_VARIANT[d.fields.Estado]} label={d.fields.Estado} /></td>
                              <td className="px-4 py-3">
                                {d.fields['URL Documento']
                                  ? <a href={d.fields['URL Documento']} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">Ver</a>
                                  : <span className="text-gray-400 text-xs">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                ) : (
                  trabajadores.length === 0 ? <EmptyState icon={UserCheck} title="Sin trabajadores" description="Registra el personal del contratista" />
                    : <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>{['Nombre', 'Identificación', 'Cargo', 'Inducción'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {trabajadores.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{t.fields['Nombre Completo']}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{t.fields.Identificacion ?? '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{t.fields.Cargo ?? '—'}</td>
                              <td className="px-4 py-3">
                                {t.fields['Induccion Realizada']
                                  ? <CheckCircle2 size={16} className="text-green-500" />
                                  : <AlertTriangle size={16} className="text-orange-400" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                )
              }
            </Card>
          </div>
        )}
      </div>

      <Modal open={modalContratista} onClose={() => setModalContratista(false)} title="Nuevo contratista" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre empresa *</label>
              <input type="text" value={formCont['Nombre Empresa']} onChange={e => setFormCont(f => ({ ...f, 'Nombre Empresa': e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIT *</label>
              <input type="text" value={formCont.NIT} onChange={e => setFormCont(f => ({ ...f, NIT: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Representante legal</label>
              <input type="text" value={formCont['Representante Legal']} onChange={e => setFormCont(f => ({ ...f, 'Representante Legal': e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formCont.Email} onChange={e => setFormCont(f => ({ ...f, Email: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actividad económica</label>
            <input type="text" value={formCont.Actividad} onChange={e => setFormCont(f => ({ ...f, Actividad: e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalContratista(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearContratista} disabled={guardando || !formCont['Nombre Empresa'] || !formCont.NIT}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalDoc} onClose={() => setModalDoc(false)} title="Agregar documento" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select value={formDoc.Tipo} onChange={e => setFormDoc(f => ({ ...f, Tipo: e.target.value }))}
                className="input-field">
                {TIPOS_DOC.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento *</label>
              <input type="date" value={formDoc['Fecha Vencimiento']} onChange={e => setFormDoc(f => ({ ...f, 'Fecha Vencimiento': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del documento</label>
            <input type="url" value={formDoc['URL Documento']} onChange={e => setFormDoc(f => ({ ...f, 'URL Documento': e.target.value }))}
              placeholder="https://" className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalDoc(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearDocumento} disabled={guardando || !formDoc['Fecha Vencimiento']}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalTrabajador} onClose={() => setModalTrabajador(false)} title="Registrar trabajador" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input type="text" value={formTrab['Nombre Completo']} onChange={e => setFormTrab(f => ({ ...f, 'Nombre Completo': e.target.value }))}
              className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identificación</label>
              <input type="text" value={formTrab.Identificacion} onChange={e => setFormTrab(f => ({ ...f, Identificacion: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input type="text" value={formTrab.Cargo} onChange={e => setFormTrab(f => ({ ...f, Cargo: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalTrabajador(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearTrabajador} disabled={guardando || !formTrab['Nombre Completo']}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
