'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListChecks, Plus, BarChart2, ChevronRight } from 'lucide-react'
import type { PlanPlanFields, PlanActividadFields } from '@/types/sst/plan'
import type { AirtableRecord } from '@/lib/airtable-client'

type Plan = AirtableRecord<PlanPlanFields>
type Actividad = AirtableRecord<PlanActividadFields>

interface Dashboard {
  total: number; completadas: number; enProgreso: number; pendientes: number
  cumplimiento: number; porCiclo: Record<string, number>; costoTotal: number
}

const ESTADO_VARIANT: Record<string, 'success' | 'primary' | 'neutral' | 'error'> = {
  completada: 'success', en_progreso: 'primary', pendiente: 'neutral', cancelada: 'error',
}
const PLAN_ESTADO_VARIANT: Record<string, 'neutral' | 'primary' | 'success'> = {
  borrador: 'neutral', activo: 'primary', cerrado: 'success',
}
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const CICLOS = ['Planear','Hacer','Verificar','Actuar']

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function PlanTrabajoPage() {
  const { user } = useAuth()
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Plan | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [tab, setTab] = useState<'actividades' | 'dashboard'>('actividades')
  const [modalPlan, setModalPlan] = useState(false)
  const [modalEditarPlan, setModalEditarPlan] = useState(false)
  const [modalActividad, setModalActividad] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formPlan, setFormPlan] = useState({ Titulo: '', 'Año': new Date().getFullYear(), Descripcion: '', 'Evaluacion ID': '' })
  const [formEditarPlan, setFormEditarPlan] = useState({ Titulo: '', Descripcion: '', Estado: 'borrador' })
  const [formAct, setFormAct] = useState({
    Descripcion: '', Responsable: '', Mes: '', 'Ciclo PHVA': '', 'Costo Estimado': '', 'Fecha Limite': '',
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/planes', { headers: authHeaders() })
    const data = await res.json()
    setPlanes(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionar = useCallback(async (plan: Plan) => {
    setSeleccionado(plan)
    setLoadingDetalle(true)
    try {
      const [actsRes, dashRes] = await Promise.all([
        fetch(`/api/sst/planes/${plan.id}/actividades`, { headers: authHeaders() }),
        fetch(`/api/sst/planes/${plan.id}/actividades?dashboard=true`, { headers: authHeaders() }),
      ])
      if (actsRes.ok) {
        const acts = await actsRes.json()
        setActividades(acts.records ?? [])
      }
      if (dashRes.ok) {
        const dash = await dashRes.json()
        setDashboard(dash)
      }
    } catch (error) {
      console.error('Error cargando actividades:', error)
    }
    setLoadingDetalle(false)
  }, [])

  const crearPlan = async () => {
    if (!formPlan.Titulo) return
    setGuardando(true)
    await fetch('/api/sst/planes', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formPlan, Responsable: user?.name }),
    })
    setModalPlan(false)
    setFormPlan({ Titulo: '', 'Año': new Date().getFullYear(), Descripcion: '', 'Evaluacion ID': '' })
    await cargar()
    setGuardando(false)
  }

  const editarPlan = async () => {
    if (!seleccionado || !formEditarPlan.Titulo) return
    setGuardando(true)
    await fetch(`/api/sst/planes/${seleccionado.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify(formEditarPlan),
    })
    setModalEditarPlan(false)
    await cargar()
    if (seleccionado) await seleccionar(seleccionado)
    setGuardando(false)
  }

  const cerrarPlan = async () => {
    if (!seleccionado) return
    if (!confirm('¿Cerrar este plan? Se calculará el cumplimiento final.')) return
    setGuardando(true)
    await fetch(`/api/sst/planes/${seleccionado.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ Estado: 'cerrado' }),
    })
    await cargar()
    setSeleccionado(null)
    setGuardando(false)
  }

  const crearActividad = async () => {
    if (!formAct.Descripcion || !seleccionado) return
    setGuardando(true)
    await fetch(`/api/sst/planes/${seleccionado.id}/actividades`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        ...formAct,
        Responsable: formAct.Responsable || user?.name,
        'Costo Estimado': formAct['Costo Estimado'] ? Number(formAct['Costo Estimado']) : undefined,
        'Porcentaje Avance': 0,
      }),
    })
    setModalActividad(false)
    setFormAct({ Descripcion: '', Responsable: '', Mes: '', 'Ciclo PHVA': '', 'Costo Estimado': '', 'Fecha Limite': '' })
    await seleccionar(seleccionado)
    setGuardando(false)
  }

  const actualizarAvance = async (id: string, avance: number) => {
    await fetch(`/api/sst/actividades/${id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ 'Porcentaje Avance': avance, Estado: avance === 100 ? 'completada' : avance > 0 ? 'en_progreso' : 'pendiente' }),
    })
    if (seleccionado) await seleccionar(seleccionado)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={ListChecks}
        title="Plan de Trabajo Anual"
        description="Planificación y seguimiento del SG-SST"
        actions={
          <button onClick={() => setModalPlan(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Nuevo plan
          </button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista planes */}
        <div className="w-72 flex-shrink-0">
          <Card className="h-full overflow-auto p-0">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
            ) : planes.length === 0 ? (
              <EmptyState icon={ListChecks} title="Sin planes" description="Crea el primer plan de trabajo anual" />
            ) : (
              <ul>
                {planes.map(p => (
                  <li
                    key={p.id}
                    onClick={() => seleccionar(p)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${seleccionado?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">{p.fields.Titulo}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge variant={PLAN_ESTADO_VARIANT[p.fields.Estado]} label={p.fields.Estado} />
                      <span className="text-xs text-gray-500">{p.fields['Año']}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{p.fields.Responsable}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Detalle */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {!seleccionado ? (
            <Card className="h-full flex items-center justify-center">
              <EmptyState icon={ListChecks} title="Selecciona un plan" description="Haz clic en un plan para ver sus actividades" />
            </Card>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('actividades')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'actividades' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                >
                  <ChevronRight size={15} /> Actividades
                </button>
                <button
                  onClick={() => setTab('dashboard')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                >
                  <BarChart2 size={15} /> Dashboard
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setFormEditarPlan({ Titulo: seleccionado.fields.Titulo, Descripcion: seleccionado.fields.Descripcion || '', Estado: seleccionado.fields.Estado })
                    setModalEditarPlan(true)
                  }}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Editar
                </button>
                {seleccionado.fields.Estado !== 'cerrado' && (
                  <button
                    onClick={cerrarPlan}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cerrar
                  </button>
                )}
                <button
                  onClick={() => setModalActividad(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={15} /> Actividad
                </button>
              </div>

              {tab === 'actividades' ? (
                <Card className="flex-1 overflow-auto p-0">
                  {loadingDetalle ? (
                    <div className="p-6 text-center text-gray-500 text-sm">Cargando...</div>
                  ) : actividades.length === 0 ? (
                    <EmptyState icon={ListChecks} title="Sin actividades" description="Agrega la primera actividad al plan" />
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {['Actividad','Responsable','Ciclo','Mes','Avance','Estado'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {actividades.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{a.fields.Descripcion}</td>
                            <td className="px-4 py-3 text-gray-600">{a.fields.Responsable}</td>
                            <td className="px-4 py-3">
                              {a.fields['Ciclo PHVA'] && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.fields['Ciclo PHVA']}</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{a.fields.Mes ?? '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${a.fields['Porcentaje Avance']}%` }} />
                                </div>
                                <span className="text-xs text-gray-600 w-8">{a.fields['Porcentaje Avance']}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={a.fields['Porcentaje Avance']}
                                onChange={e => actualizarAvance(a.id, Number(e.target.value))}
                                className="text-xs border rounded px-1.5 py-1"
                              >
                                {[0,25,50,75,100].map(v => <option key={v} value={v}>{v}%</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
              ) : (
                <div className="flex-1 overflow-auto">
                  {loadingDetalle || !dashboard ? (
                    <div className="text-center text-gray-500 text-sm py-8">Cargando...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <div className="text-3xl font-bold text-blue-600">{dashboard.cumplimiento.toFixed(0)}%</div>
                        <div className="text-sm text-gray-500 mt-1">Cumplimiento general</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${dashboard.cumplimiento}%` }} />
                        </div>
                      </Card>
                      <Card>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><div className="text-2xl font-bold text-green-600">{dashboard.completadas}</div><div className="text-xs text-gray-500">Completadas</div></div>
                          <div><div className="text-2xl font-bold text-blue-600">{dashboard.enProgreso}</div><div className="text-xs text-gray-500">En progreso</div></div>
                          <div><div className="text-2xl font-bold text-gray-400">{dashboard.pendientes}</div><div className="text-xs text-gray-500">Pendientes</div></div>
                        </div>
                        <div className="text-xs text-gray-400 text-center mt-2">{dashboard.total} actividades total</div>
                      </Card>
                      <Card className="col-span-2">
                        <div className="text-sm font-semibold text-gray-700 mb-3">Cumplimiento por ciclo PHVA</div>
                        <div className="grid grid-cols-4 gap-3">
                          {CICLOS.map(c => {
                            const pct = dashboard.porCiclo[c] ?? 0
                            return (
                              <div key={c} className="text-center">
                                <div className="text-xl font-bold text-blue-600">{pct.toFixed(0)}%</div>
                                <div className="text-xs text-gray-500">{c}</div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                      {dashboard.costoTotal > 0 && (
                        <Card>
                          <div className="text-sm text-gray-500">Costo total estimado</div>
                          <div className="text-2xl font-bold text-gray-800 mt-1">
                            ${dashboard.costoTotal.toLocaleString('es-CO')}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal nuevo plan */}
      <Modal open={modalPlan} onClose={() => setModalPlan(false)} title="Nuevo plan de trabajo" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formPlan.Titulo} onChange={e => setFormPlan(f => ({ ...f, Titulo: e.target.value }))}
              className="input-field"
              placeholder="Ej. Plan de trabajo SST 2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
            <input type="number" value={formPlan['Año']} onChange={e => setFormPlan(f => ({ ...f, 'Año': Number(e.target.value) }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={formPlan.Descripcion} onChange={e => setFormPlan(f => ({ ...f, Descripcion: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vinculado a Evaluación (opcional)</label>
            <input type="text" value={formPlan['Evaluacion ID']} onChange={e => setFormPlan(f => ({ ...f, 'Evaluacion ID': e.target.value }))}
              placeholder="ID de la evaluación inicial"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalPlan(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearPlan} disabled={guardando || !formPlan.Titulo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal editar plan */}
      <Modal open={modalEditarPlan} onClose={() => setModalEditarPlan(false)} title="Editar plan" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formEditarPlan.Titulo} onChange={e => setFormEditarPlan(f => ({ ...f, Titulo: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={formEditarPlan.Descripcion} onChange={e => setFormEditarPlan(f => ({ ...f, Descripcion: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={formEditarPlan.Estado} onChange={e => setFormEditarPlan(f => ({ ...f, Estado: e.target.value as 'borrador' | 'activo' | 'cerrado' }))}
              className="input-field">
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalEditarPlan(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={editarPlan} disabled={guardando || !formEditarPlan.Titulo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={modalActividad} onClose={() => setModalActividad(false)} title="Nueva actividad" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea value={formAct.Descripcion} onChange={e => setFormAct(f => ({ ...f, Descripcion: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <input type="text" value={formAct.Responsable} onChange={e => setFormAct(f => ({ ...f, Responsable: e.target.value }))}
                placeholder={user?.name} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo PHVA</label>
              <select value={formAct['Ciclo PHVA']} onChange={e => setFormAct(f => ({ ...f, 'Ciclo PHVA': e.target.value }))}
                className="input-field">
                <option value="">Seleccionar</option>
                {CICLOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select value={formAct.Mes} onChange={e => setFormAct(f => ({ ...f, Mes: e.target.value }))}
                className="input-field">
                <option value="">Seleccionar</option>
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo estimado ($)</label>
              <input type="number" value={formAct['Costo Estimado']} onChange={e => setFormAct(f => ({ ...f, 'Costo Estimado': e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
            <input type="date" value={formAct['Fecha Limite']} onChange={e => setFormAct(f => ({ ...f, 'Fecha Limite': e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalActividad(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearActividad} disabled={guardando || !formAct.Descripcion}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
