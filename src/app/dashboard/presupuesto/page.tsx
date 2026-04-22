'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Wallet, Plus, AlertTriangle, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import type { PptoPresupuestoFields, PptoRubroFields, PptoEjecucionFields } from '@/types/sst/ppto'
import type { AirtableRecord } from '@/lib/airtable-client'

type Presupuesto = AirtableRecord<PptoPresupuestoFields>
type Rubro = AirtableRecord<PptoRubroFields>
type Ejecucion = AirtableRecord<PptoEjecucionFields>

interface Alerta { rubro: Rubro; tipo: 'sobreejecucion' | 'subejecucion'; porcentaje: number }

const PPTO_ESTADO_VARIANT: Record<string, 'neutral' | 'primary' | 'success' | 'warning'> = {
  borrador: 'neutral', aprobado: 'primary', ejecutando: 'warning', cerrado: 'success',
}
const CAT_LABEL: Record<string, string> = {
  epps: 'EPPs', capacitacion: 'Capacitación', medico: 'Médico',
  consultoria: 'Consultoría', infraestructura: 'Infraestructura', otro: 'Otro',
}
const CATEGORIAS = ['epps','capacitacion','medico','consultoria','infraestructura','otro']

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function pct(ejecutado: number, presupuestado: number) {
  if (!presupuestado) return 0
  return Math.min((ejecutado / presupuestado) * 100, 999)
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-CO')
}

export default function PresupuestoPage() {
  const { user } = useAuth()
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Presupuesto | null>(null)
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [rubroActivo, setRubroActivo] = useState<Rubro | null>(null)
  const [ejecuciones, setEjecuciones] = useState<Ejecucion[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [loadingEj, setLoadingEj] = useState(false)
  const [modalPpto, setModalPpto] = useState(false)
  const [modalEditPpto, setModalEditPpto] = useState(false)
  const [modalRubro, setModalRubro] = useState(false)
  const [modalEditRubro, setModalEditRubro] = useState(false)
  const [modalEjecucion, setModalEjecucion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formPpto, setFormPpto] = useState({ Titulo: '', 'Año': new Date().getFullYear(), 'Total Presupuestado': '' })
  const [formEditPpto, setFormEditPpto] = useState({ Titulo: '', 'Total Presupuestado': '' })
  const [formRubro, setFormRubro] = useState({ 'Nombre Rubro': '', Categoria: 'epps', 'Valor Presupuestado': '', Observaciones: '' })
  const [formEditRubro, setFormEditRubro] = useState({ 'Nombre Rubro': '', 'Valor Presupuestado': '' })
  const [formEj, setFormEj] = useState({ Descripcion: '', Valor: '', Fecha: '', Proveedor: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/presupuestos', { headers: authHeaders() })
    const data = await res.json()
    setPresupuestos(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback(async (p: Presupuesto) => {
    setSeleccionado(p)
    setRubroActivo(null)
    setEjecuciones([])
    setLoadingDetalle(true)
    try {
      const [rubsRes, altsRes] = await Promise.all([
        fetch(`/api/sst/presupuestos/${p.id}/rubros`, { headers: authHeaders() }),
        fetch(`/api/sst/presupuestos/${p.id}/rubros?alertas=true`, { headers: authHeaders() }),
      ])
      if (rubsRes.ok) {
        const rubs = await rubsRes.json()
        setRubros(rubs.records ?? [])
      }
      if (altsRes.ok) {
        const alts = await altsRes.json()
        setAlertas(alts.alertas ?? [])
      }
    } catch (error) {
      console.error('Error cargando presupuesto:', error)
    }
    setLoadingDetalle(false)
  }, [])

  const seleccionarRubro = useCallback(async (rubro: Rubro) => {
    setRubroActivo(rubro)
    setLoadingEj(true)
    try {
      const res = await fetch(`/api/sst/rubros/${rubro.id}/ejecuciones`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setEjecuciones(data.records ?? [])
      }
    } catch (error) {
      console.error('Error cargando ejecuciones:', error)
    }
    setLoadingEj(false)
  }, [])

  const crearPpto = async () => {
    if (!formPpto.Titulo || !formPpto['Total Presupuestado']) return
    setGuardando(true)
    await fetch('/api/sst/presupuestos', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formPpto, 'Total Presupuestado': Number(formPpto['Total Presupuestado']), Responsable: user?.name }),
    })
    setModalPpto(false)
    setFormPpto({ Titulo: '', 'Año': new Date().getFullYear(), 'Total Presupuestado': '' })
    await cargar()
    setGuardando(false)
  }

  const crearRubro = async () => {
    if (!formRubro['Nombre Rubro'] || !seleccionado) return
    setGuardando(true)
    await fetch(`/api/sst/presupuestos/${seleccionado.id}/rubros`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formRubro, 'Valor Presupuestado': Number(formRubro['Valor Presupuestado']) }),
    })
    setModalRubro(false)
    setFormRubro({ 'Nombre Rubro': '', Categoria: 'epps', 'Valor Presupuestado': '', Observaciones: '' })
    await seleccionar(seleccionado)
    setGuardando(false)
  }

  const registrarEjecucion = async () => {
    if (!formEj.Descripcion || !formEj.Valor || !rubroActivo) return
    setGuardando(true)
    await fetch(`/api/sst/rubros/${rubroActivo.id}/ejecuciones`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formEj, Valor: Number(formEj.Valor) }),
    })
    setModalEjecucion(false)
    setFormEj({ Descripcion: '', Valor: '', Fecha: '', Proveedor: '' })
    await seleccionarRubro(rubroActivo)
    if (seleccionado) await seleccionar(seleccionado)
    setGuardando(false)
  }

  const abrirEditPpto = () => {
    if (!seleccionado) return
    setFormEditPpto({ Titulo: seleccionado.fields.Titulo, 'Total Presupuestado': seleccionado.fields['Total Presupuestado'].toString() })
    setModalEditPpto(true)
  }

  const editarPpto = async () => {
    if (!seleccionado || !formEditPpto.Titulo) return
    setGuardando(true)
    await fetch(`/api/sst/presupuestos/${seleccionado.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ Titulo: formEditPpto.Titulo, 'Total Presupuestado': Number(formEditPpto['Total Presupuestado']) }),
    })
    setModalEditPpto(false)
    await cargar()
    if (seleccionado) await seleccionar(seleccionado)
    setGuardando(false)
  }

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!seleccionado) return
    setGuardando(true)
    await fetch(`/api/sst/presupuestos/${seleccionado.id}/estado`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ estadoActual: seleccionado.fields.Estado, estadoNuevo: nuevoEstado }),
    })
    await cargar()
    if (seleccionado.id) {
      const res = await fetch(`/api/sst/presupuestos/${seleccionado.id}`, { headers: authHeaders() })
      const data = await res.json()
      setSeleccionado(data.record)
    }
    setGuardando(false)
  }

  const eliminarRubro = async (rubro: Rubro) => {
    if (!confirm(`¿Eliminar rubro "${rubro.fields['Nombre Rubro']}"?`)) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/sst/rubros/${rubro.id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (res.ok) {
        if (seleccionado) await seleccionar(seleccionado)
      } else {
        alert('Error al eliminar el rubro')
      }
    } catch (error) {
      console.error('Error eliminando rubro:', error)
      alert('Error al eliminar el rubro')
    }
    setGuardando(false)
  }

  const abrirEditRubro = (r: Rubro) => {
    setFormEditRubro({ 'Nombre Rubro': r.fields['Nombre Rubro'], 'Valor Presupuestado': r.fields['Valor Presupuestado'].toString() })
    setRubroActivo(r)
    setModalEditRubro(true)
  }

  const editarRubro = async () => {
    if (!rubroActivo || !formEditRubro['Nombre Rubro']) return
    setGuardando(true)
    await fetch(`/api/sst/rubros/${rubroActivo.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ 'Nombre Rubro': formEditRubro['Nombre Rubro'], 'Valor Presupuestado': Number(formEditRubro['Valor Presupuestado']) }),
    })
    setModalEditRubro(false)
    if (seleccionado) await seleccionar(seleccionado)
    setGuardando(false)
  }

  const totalEjecutado = rubros.reduce((s, r) => s + (r.fields['Valor Ejecutado'] ?? 0), 0)
  const totalPresupuestado = seleccionado?.fields['Total Presupuestado'] ?? 0
  const pctGlobal = pct(totalEjecutado, totalPresupuestado)

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={Wallet}
        title="Presupuesto SST"
        description="Seguimiento financiero del sistema de gestión"
        actions={
          <button onClick={() => setModalPpto(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Nuevo presupuesto
          </button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista presupuestos */}
        <div className="w-60 flex-shrink-0">
          <Card className="h-full overflow-auto p-0">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
            ) : presupuestos.length === 0 ? (
              <EmptyState icon={Wallet} title="Sin presupuestos" description="Crea el primer presupuesto" />
            ) : (
              <ul>
                {presupuestos.map(p => (
                  <li key={p.id} onClick={() => seleccionar(p)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${seleccionado?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                    <div className="font-medium text-sm text-gray-900 truncate">{p.fields.Titulo}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge variant={PPTO_ESTADO_VARIANT[p.fields.Estado]} label={p.fields.Estado} />
                      <span className="text-xs text-gray-500">{p.fields['Año']}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{fmt(p.fields['Total Presupuestado'])}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Detalle */}
        {!seleccionado ? (
          <Card className="flex-1 flex items-center justify-center">
            <EmptyState icon={Wallet} title="Selecciona un presupuesto" description="Haz clic en un presupuesto para ver sus rubros" />
          </Card>
        ) : (
          <div className="flex-1 min-w-0 flex gap-3">
            {/* Rubros */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Resumen */}
              {!loadingDetalle && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{seleccionado.fields.Titulo}</h3>
                    <button onClick={abrirEditPpto} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">Editar</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <div className="text-xs text-gray-500">Presupuestado</div>
                      <div className="text-lg font-bold text-gray-800">{fmt(totalPresupuestado)}</div>
                    </Card>
                    <Card>
                      <div className="text-xs text-gray-500">Ejecutado</div>
                      <div className="text-lg font-bold text-blue-600">{fmt(totalEjecutado)}</div>
                    </Card>
                    <Card>
                      <div className="text-xs text-gray-500">% Ejecución</div>
                      <div className={`text-lg font-bold ${pctGlobal > 80 ? 'text-red-500' : pctGlobal < 50 ? 'text-yellow-500' : 'text-green-600'}`}>
                        {pctGlobal.toFixed(1)}%
                      </div>
                    </Card>
                  </div>
                  {seleccionado.fields.Estado !== 'cerrado' && (
                    <Card className="bg-blue-50 border-l-4 border-l-blue-400">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Cambiar estado: {seleccionado.fields.Estado}</div>
                      <div className="flex flex-wrap gap-2">
                        {seleccionado.fields.Estado === 'borrador' && (
                          <>
                            <button onClick={() => cambiarEstado('aprobado')} disabled={guardando}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">→ Aprobado</button>
                            <button onClick={() => cambiarEstado('cancelado')} disabled={guardando}
                              className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">→ Cancelado</button>
                          </>
                        )}
                        {seleccionado.fields.Estado === 'aprobado' && (
                          <>
                            <button onClick={() => cambiarEstado('ejecutando')} disabled={guardando}
                              className="text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">→ Ejecutando</button>
                            <button onClick={() => cambiarEstado('borrador')} disabled={guardando}
                              className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50">← Borrador</button>
                          </>
                        )}
                        {seleccionado.fields.Estado === 'ejecutando' && (
                          <>
                            <button onClick={() => cambiarEstado('cerrado')} disabled={guardando}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">→ Cerrado</button>
                            <button onClick={() => cambiarEstado('aprobado')} disabled={guardando}
                              className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50">← Aprobado</button>
                          </>
                        )}
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Alertas */}
              {alertas.length > 0 && (
                <Card className="border-l-4 border-l-orange-400 bg-orange-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">{alertas.length} alerta(s) de presupuesto</span>
                  </div>
                  {alertas.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-orange-700">
                      {a.tipo === 'sobreejecucion' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{a.rubro.fields['Nombre Rubro']}: {a.tipo} ({a.porcentaje.toFixed(0)}%)</span>
                    </div>
                  ))}
                </Card>
              )}

              {/* Lista rubros */}
              <Card className="flex-1 overflow-auto p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <span className="text-sm font-semibold text-gray-700">Rubros</span>
                  <button onClick={() => setModalRubro(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={12} /> Rubro
                  </button>
                </div>
                {loadingDetalle ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
                ) : rubros.length === 0 ? (
                  <EmptyState icon={Wallet} title="Sin rubros" description="Agrega rubros al presupuesto" />
                ) : (
                  <ul>
                    {rubros.map(r => {
                      const p = pct(r.fields['Valor Ejecutado'], r.fields['Valor Presupuestado'])
                      const color = p > 80 ? 'bg-red-500' : p < 50 && p > 0 ? 'bg-yellow-400' : 'bg-blue-500'
                      return (
                        <li key={r.id}
                          className={`p-4 border-b hover:bg-gray-50 transition-colors flex items-start justify-between gap-2 ${rubroActivo?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                          <div onClick={() => seleccionarRubro(r)} className="flex-1 cursor-pointer">
                            <div className="font-medium text-sm text-gray-800">{r.fields['Nombre Rubro']}</div>
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{CAT_LABEL[r.fields.Categoria]}</span>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-right text-xs text-gray-500">{fmt(r.fields['Valor Ejecutado'])} / {fmt(r.fields['Valor Presupuestado'])}</div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(p, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{p.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); abrirEditRubro(r) }}
                              className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Editar</button>
                            <button onClick={(e) => { e.stopPropagation(); eliminarRubro(r) }}
                              className="text-xs text-red-600 hover:bg-red-50 px-1.5 py-1 rounded" title="Eliminar rubro">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Ejecuciones del rubro */}
            {rubroActivo && (
              <div className="w-72 flex-shrink-0">
                <Card className="h-full flex flex-col p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <span className="text-sm font-semibold text-gray-700 truncate">{rubroActivo.fields['Nombre Rubro']}</span>
                    <button onClick={() => setModalEjecucion(true)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex-shrink-0">
                      <Plus size={12} /> Gasto
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {loadingEj ? (
                      <div className="p-4 text-center text-gray-500 text-sm">Cargando...</div>
                    ) : ejecuciones.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">Sin gastos registrados</div>
                    ) : (
                      <ul>
                        {ejecuciones.map(e => (
                          <li key={e.id} className="p-3 border-b">
                            <div className="text-sm font-medium text-gray-800">{e.fields.Descripcion}</div>
                            <div className="text-sm font-bold text-blue-600 mt-0.5">{fmt(e.fields.Valor)}</div>
                            <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                              {e.fields.Fecha && <span>{e.fields.Fecha}</span>}
                              {e.fields.Proveedor && <span>· {e.fields.Proveedor}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nuevo presupuesto */}
      <Modal open={modalPpto} onClose={() => setModalPpto(false)} title="Nuevo presupuesto" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formPpto.Titulo} onChange={e => setFormPpto(f => ({ ...f, Titulo: e.target.value }))}
              className="input-field"
              placeholder="Ej. Presupuesto SST 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" value={formPpto['Año']} onChange={e => setFormPpto(f => ({ ...f, 'Año': Number(e.target.value) }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total presupuestado *</label>
              <input type="number" value={formPpto['Total Presupuestado']} onChange={e => setFormPpto(f => ({ ...f, 'Total Presupuestado': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalPpto(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearPpto} disabled={guardando || !formPpto.Titulo || !formPpto['Total Presupuestado']}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal nuevo rubro */}
      <Modal open={modalRubro} onClose={() => setModalRubro(false)} title="Nuevo rubro" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={formRubro['Nombre Rubro']} onChange={e => setFormRubro(f => ({ ...f, 'Nombre Rubro': e.target.value }))}
              className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={formRubro.Categoria} onChange={e => setFormRubro(f => ({ ...f, Categoria: e.target.value }))}
                className="input-field">
                {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor presupuestado *</label>
              <input type="number" value={formRubro['Valor Presupuestado']} onChange={e => setFormRubro(f => ({ ...f, 'Valor Presupuestado': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalRubro(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearRubro} disabled={guardando || !formRubro['Nombre Rubro']}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal registrar ejecución */}
      <Modal open={modalEjecucion} onClose={() => setModalEjecucion(false)} title="Registrar gasto" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <input type="text" value={formEj.Descripcion} onChange={e => setFormEj(f => ({ ...f, Descripcion: e.target.value }))}
              className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <input type="number" value={formEj.Valor} onChange={e => setFormEj(f => ({ ...f, Valor: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={formEj.Fecha} onChange={e => setFormEj(f => ({ ...f, Fecha: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <input type="text" value={formEj.Proveedor} onChange={e => setFormEj(f => ({ ...f, Proveedor: e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalEjecucion(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={registrarEjecucion} disabled={guardando || !formEj.Descripcion || !formEj.Valor}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal editar presupuesto */}
      <Modal open={modalEditPpto} onClose={() => setModalEditPpto(false)} title="Editar presupuesto" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formEditPpto.Titulo} onChange={e => setFormEditPpto(f => ({ ...f, Titulo: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total presupuestado *</label>
            <input type="number" value={formEditPpto['Total Presupuestado']} onChange={e => setFormEditPpto(f => ({ ...f, 'Total Presupuestado': e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalEditPpto(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={editarPpto} disabled={guardando || !formEditPpto.Titulo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal editar rubro */}
      <Modal open={modalEditRubro} onClose={() => setModalEditRubro(false)} title="Editar rubro" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={formEditRubro['Nombre Rubro']} onChange={e => setFormEditRubro(f => ({ ...f, 'Nombre Rubro': e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor presupuestado *</label>
            <input type="number" value={formEditRubro['Valor Presupuestado']} onChange={e => setFormEditRubro(f => ({ ...f, 'Valor Presupuestado': e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalEditRubro(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={editarRubro} disabled={guardando || !formEditRubro['Nombre Rubro']}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
