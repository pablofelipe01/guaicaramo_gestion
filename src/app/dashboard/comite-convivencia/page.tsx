'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ComiteCasosList } from '@/components/sst/ComiteCasosList'
import { Users, Plus, CalendarDays, AlertTriangle, Lock, CheckCircle2, User } from 'lucide-react'
import type { CclComiteFields, CclReunionFields, CclCompromisoFields, CclIntegranteFields } from '@/types/sst/ccl'
import type { AirtableRecord } from '@/lib/airtable-client'

type Comite = AirtableRecord<CclComiteFields>
type Reunion = AirtableRecord<CclReunionFields>
type Compromiso = AirtableRecord<CclCompromisoFields>
type Integrante = AirtableRecord<CclIntegranteFields>

const REUNION_VARIANT: Record<string, 'primary' | 'success' | 'neutral'> = {
  programada: 'primary', realizada: 'success', cancelada: 'neutral',
}
const COMP_VARIANT: Record<string, 'neutral' | 'success' | 'error'> = {
  pendiente: 'neutral', cumplido: 'success', vencido: 'error',
}

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function diasRestantes(fechaFin: string) {
  return Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000)
}

export default function ComiteConvivenciaPage() {
  const { user } = useAuth()
  const [comite, setComite] = useState<Comite | null>(null)
  const [integrantes, setIntegrantes] = useState<Integrante[]>([])
  const [reuniones, setReuniones] = useState<Reunion[]>([])
  const [reunionActiva, setReunionActiva] = useState<Reunion | null>(null)
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'reuniones' | 'compromisos' | 'casos' | 'integrantes'>('reuniones')
  const [modalComite, setModalComite] = useState(false)
  const [modalReunion, setModalReunion] = useState(false)
  const [modalCompromiso, setModalCompromiso] = useState(false)
  const [modalIntegrante, setModalIntegrante] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formComite, setFormComite] = useState({ Nombre: '', 'Fecha Inicio': '', 'Fecha Fin': '' })
  const [formReunion, setFormReunion] = useState({ Tipo: 'ordinaria', Fecha: '', Lugar: '' })
  const [formComp, setFormComp] = useState({ Descripcion: '', Responsable: '', 'Fecha Limite': '' })
  const [formIntegrante, setFormIntegrante] = useState({ 'Nombre Completo': '', Rol: 'suplente', Cargo: '', Email: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sst/ccl/comite/activo', { headers: authHeaders() })
      if (!res.ok) {
        console.error('Error fetching comité:', res.status, res.statusText)
        setComite(null)
        setLoading(false)
        return
      }
      const data = await res.json()
      setComite(data.comite)
      if (data.comite) {
        // Cargar reuniones
        const r = await fetch(`/api/sst/ccl/reuniones?comiteId=${data.comite.id}`, { headers: authHeaders() })
        if (r.ok) {
          const rd = await r.json()
          setReuniones(rd.records ?? [])
        }
        
        // Cargar integrantes
        const i = await fetch(`/api/sst/ccl/comites/${data.comite.id}`, { headers: authHeaders() })
        if (i.ok) {
          const id = await i.json()
          setIntegrantes(id.integrantes ?? [])
        }
      }
    } catch (error) {
      console.error('Error en cargar:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionarReunion = useCallback(async (r: Reunion) => {
    setReunionActiva(r)
    setTab('compromisos')
    try {
      const res = await fetch(`/api/sst/ccl/reuniones/${r.id}/compromisos`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setCompromisos(data.records ?? [])
    } catch (error) {
      console.error('Error cargando compromisos:', error)
    }
  }, [])

  const crearComite = async () => {
    if (!formComite.Nombre) return
    setGuardando(true)
    try {
      await fetch('/api/sst/ccl/comites', { method: 'POST', headers: authHeaders(), body: JSON.stringify(formComite) })
      setModalComite(false)
      await cargar()
    } catch (error) {
      console.error('Error creando comité:', error)
    }
    setGuardando(false)
  }

  const crearReunion = async () => {
    if (!comite || !formReunion.Fecha) return
    setGuardando(true)
    try {
      await fetch('/api/sst/ccl/reuniones', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...formReunion, 'Comite ID': comite.id }),
      })
      setModalReunion(false)
      setFormReunion({ Tipo: 'ordinaria', Fecha: '', Lugar: '' })
      await cargar()
    } catch (error) {
      console.error('Error creando reunión:', error)
    }
    setGuardando(false)
  }

  const crearCompromiso = async () => {
    if (!reunionActiva || !formComp.Descripcion) return
    setGuardando(true)
    try {
      await fetch(`/api/sst/ccl/reuniones/${reunionActiva.id}/compromisos`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...formComp, Responsable: formComp.Responsable || user?.name }),
      })
      setModalCompromiso(false)
      setFormComp({ Descripcion: '', Responsable: '', 'Fecha Limite': '' })
      await seleccionarReunion(reunionActiva)
    } catch (error) {
      console.error('Error creando compromiso:', error)
    }
    setGuardando(false)
  }

  const crearIntegrante = async () => {
    if (!comite || !formIntegrante['Nombre Completo'] || !formIntegrante.Rol) return
    setGuardando(true)
    try {
      await fetch('/api/sst/ccl/integrantes', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          ...formIntegrante,
          'Comite ID': comite.id,
        }),
      })
      setModalIntegrante(false)
      setFormIntegrante({ 'Nombre Completo': '', Rol: 'suplente', Cargo: '', Email: '' })
      await cargar()
    } catch (error) {
      console.error('Error creando integrante:', error)
    }
    setGuardando(false)
  }

  const dias = comite ? diasRestantes(comite.fields['Fecha Fin']) : null

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={Users}
        title="Comité de Convivencia Laboral"
        description="Res. 652 y 1356 de 2012"
        actions={
          <button onClick={() => setModalComite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> {comite ? 'Nuevo comité' : 'Crear comité'}
          </button>
        }
      />

      {loading ? (
        <Card><div className="text-center text-gray-500 py-8">Cargando...</div></Card>
      ) : !comite ? (
        <Card className="flex-1 flex items-center justify-center">
          <EmptyState icon={Users} title="Sin comité activo" description="Crea el comité de convivencia para comenzar" />
        </Card>
      ) : (
        <>
          {/* Info comité */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{comite.fields.Nombre}</h2>
                <div className="text-sm text-gray-500 mt-1">
                  Vigencia: {comite.fields['Fecha Inicio']} → {comite.fields['Fecha Fin']}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {dias !== null && dias <= 30 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle size={14} className="text-orange-500" />
                    <span className="text-xs text-orange-700 font-medium">Vence en {dias} días</span>
                  </div>
                )}
                <StatusBadge variant={comite.fields.Estado === 'activo' ? 'success' : 'neutral'} label={comite.fields.Estado} />
              </div>
            </div>
          </Card>

          <div className="flex flex-1 gap-4 min-h-0">
            {/* Menú lateral */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-2">
              {/* Tabs */}
              <div className="flex flex-col gap-1 bg-white rounded-lg border p-1">
                <button
                  onClick={() => { setTab('reuniones'); setReunionActiva(null) }}
                  className={`w-full text-left px-3 py-2 text-xs rounded font-medium transition-colors ${
                    tab === 'reuniones'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CalendarDays size={14} className="inline mr-1" /> Reuniones
                </button>
                <button
                  onClick={() => setTab('integrantes')}
                  className={`w-full text-left px-3 py-2 text-xs rounded font-medium transition-colors ${
                    tab === 'integrantes'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User size={14} className="inline mr-1" /> Integrantes
                </button>
                <button
                  onClick={() => setTab('casos')}
                  className={`w-full text-left px-3 py-2 text-xs rounded font-medium transition-colors ${
                    tab === 'casos'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Lock size={14} className="inline mr-1" /> Casos
                </button>
              </div>

              {/* Contenido lateral según tab */}
              {tab === 'reuniones' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Reuniones</span>
                    <button onClick={() => setModalReunion(true)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus size={12} /> Nueva
                    </button>
                  </div>
                  <Card className="flex-1 overflow-auto p-0">
                    {reuniones.length === 0 ? (
                      <EmptyState icon={CalendarDays} title="Sin reuniones" description="Programa la primera reunión" />
                    ) : (
                      <ul>
                        {reuniones.map(r => (
                          <li key={r.id} onClick={() => seleccionarReunion(r)}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${reunionActiva?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded capitalize">{r.fields.Tipo}</span>
                              <StatusBadge variant={REUNION_VARIANT[r.fields.Estado]} label={r.fields.Estado} />
                            </div>
                            <div className="text-sm font-medium text-gray-800 mt-1">{r.fields.Fecha}</div>
                            {r.fields.Lugar && <div className="text-xs text-gray-400">{r.fields.Lugar}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </>
              ) : tab === 'integrantes' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Integrantes</span>
                    <button onClick={() => setModalIntegrante(true)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
                  <Card className="flex-1 overflow-auto p-0">
                    {integrantes.length === 0 ? (
                      <EmptyState icon={Users} title="Sin integrantes" description="Agrega los primeros integrantes" />
                    ) : (
                      <ul className="divide-y">
                        {integrantes.map(i => (
                          <li key={i.id} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800">{i.fields['Nombre Completo']}</div>
                                <div className="text-xs text-gray-500 capitalize mt-0.5">{i.fields.Rol}</div>
                                {i.fields.Cargo && <div className="text-xs text-gray-400">{i.fields.Cargo}</div>}
                              </div>
                              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{i.fields.Rol.replace('_', ' ')}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </>
              ) : (
                <Card className="flex-1 overflow-auto">
                  <ComiteCasosList comiteId={comite?.id} onSuccess={() => cargar()} />
                </Card>
              )}
            </div>

            {/* Contenido principal */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {tab === 'reuniones' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {reunionActiva ? `Compromisos — ${reunionActiva.fields.Fecha}` : 'Compromisos'}
                    </span>
                    {reunionActiva && (
                      <button onClick={() => setModalCompromiso(true)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Plus size={12} /> Compromiso
                      </button>
                    )}
                  </div>
                  <Card className="flex-1 overflow-auto p-0">
                {!reunionActiva ? (
                  <EmptyState icon={CalendarDays} title="Selecciona una reunión" description="Haz clic en una reunión para ver sus compromisos" />
                ) : compromisos.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="Sin compromisos" description="Agrega compromisos de esta reunión" />
                ) : (
                  <ul>
                    {compromisos.map(c => (
                      <li key={c.id} className="p-4 border-b">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">{c.fields.Descripcion}</div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{c.fields.Responsable}</span>
                              {c.fields['Fecha Limite'] && <span>· Límite: {c.fields['Fecha Limite']}</span>}
                            </div>
                          </div>
                          <StatusBadge variant={COMP_VARIANT[c.fields.Estado]} label={c.fields.Estado} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                  </Card>
                </>
              ) : (
                <Card className="flex-1 overflow-auto">
                  <ComiteCasosList comiteId={comite?.id} onSuccess={() => cargar()} />
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      <Modal open={modalComite} onClose={() => setModalComite(false)} title="Nuevo comité de convivencia" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={formComite.Nombre} onChange={e => setFormComite(f => ({ ...f, Nombre: e.target.value }))}
              className="input-field"
              placeholder="Comité de Convivencia Laboral 2026-2028" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
              <input type="date" value={formComite['Fecha Inicio']} onChange={e => setFormComite(f => ({ ...f, 'Fecha Inicio': e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
              <input type="date" value={formComite['Fecha Fin']} onChange={e => setFormComite(f => ({ ...f, 'Fecha Fin': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalComite(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearComite} disabled={guardando || !formComite.Nombre}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalReunion} onClose={() => setModalReunion(false)} title="Nueva reunión" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={formReunion.Tipo} onChange={e => setFormReunion(f => ({ ...f, Tipo: e.target.value }))}
                className="input-field">
                <option value="ordinaria">Ordinaria</option>
                <option value="extraordinaria">Extraordinaria</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="date" value={formReunion.Fecha} onChange={e => setFormReunion(f => ({ ...f, Fecha: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
            <input type="text" value={formReunion.Lugar} onChange={e => setFormReunion(f => ({ ...f, Lugar: e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalReunion(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearReunion} disabled={guardando || !formReunion.Fecha}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalCompromiso} onClose={() => setModalCompromiso(false)} title="Nuevo compromiso" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea value={formComp.Descripcion} onChange={e => setFormComp(f => ({ ...f, Descripcion: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descripción del compromiso" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <input type="text" value={formComp.Responsable} onChange={e => setFormComp(f => ({ ...f, Responsable: e.target.value }))}
                placeholder={user?.name} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input type="date" value={formComp['Fecha Limite']} onChange={e => setFormComp(f => ({ ...f, 'Fecha Limite': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalCompromiso(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearCompromiso} disabled={guardando || !formComp.Descripcion}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalIntegrante} onClose={() => setModalIntegrante(false)} title="Agregar integrante" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input type="text" value={formIntegrante['Nombre Completo']} onChange={e => setFormIntegrante(f => ({ ...f, 'Nombre Completo': e.target.value }))}
              className="input-field"
              placeholder="Ej. Juan Pérez García" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select value={formIntegrante.Rol} onChange={e => setFormIntegrante(f => ({ ...f, Rol: e.target.value }))}
                className="input-field">
                <option value="presidente">Presidente</option>
                <option value="secretario">Secretario</option>
                <option value="rep_empleador">Rep. Empleador</option>
                <option value="rep_trabajador">Rep. Trabajador</option>
                <option value="suplente">Suplente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input type="text" value={formIntegrante.Cargo} onChange={e => setFormIntegrante(f => ({ ...f, Cargo: e.target.value }))}
                className="input-field"
                placeholder="Ej. Gerente" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formIntegrante.Email} onChange={e => setFormIntegrante(f => ({ ...f, Email: e.target.value }))}
              className="input-field"
              placeholder="juan@empresa.com" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalIntegrante(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearIntegrante} disabled={guardando || !formIntegrante['Nombre Completo']}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
