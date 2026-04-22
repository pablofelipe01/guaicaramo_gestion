'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { GraduationCap, Plus, BarChart2, CheckCircle2, XCircle } from 'lucide-react'
import type { CapProgramaFields, CapCapacitacionFields, CapAsistenciaFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Programa = AirtableRecord<CapProgramaFields>
type Capacitacion = AirtableRecord<CapCapacitacionFields>
type Asistencia = AirtableRecord<CapAsistenciaFields>
interface Cobertura { totalAsistencias: number; asistieron: number; cobertura: number; totalCapacitaciones: number; realizadas: number; porCargo: Record<string, { total: number; asistieron: number }> }

const CAP_ESTADO_VARIANT: Record<string, 'primary' | 'success' | 'neutral'> = {
  programada: 'primary', realizada: 'success', cancelada: 'neutral',
}
const TIPOS_CAP = ['induccion', 'reinduccion', 'periodica', 'especifica']
const MODALIDADES = ['presencial', 'virtual', 'mixta']

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function CapacitacionesPage() {
  const { user } = useAuth()
  const [programas, setProgramas] = useState<Programa[]>([])
  const [programaActivo, setProgramaActivo] = useState<Programa | null>(null)
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([])
  const [capActiva, setCapActiva] = useState<Capacitacion | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [cobertura, setCobertura] = useState<Cobertura | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'lista' | 'cobertura'>('lista')
  const [modalPrograma, setModalPrograma] = useState(false)
  const [modalCap, setModalCap] = useState(false)
  const [modalAsistencia, setModalAsistencia] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formProg, setFormProg] = useState({ Titulo: '', 'Año': new Date().getFullYear() })
  const [formCap, setFormCap] = useState({ Tema: '', Tipo: 'induccion', Modalidad: 'presencial', Instructor: '', 'Fecha Programada': '', Duracion: '' })
  const [formAsist, setFormAsist] = useState({ 'Nombre Trabajador': '', 'Cargo Trabajador': '', Asistio: true })

  const cargar = useCallback(async () => {
    setLoading(true)
    const [progs, cob] = await Promise.all([
      fetch('/api/sst/capacitaciones/programas', { headers: authHeaders() }).then(r => r.json()),
      fetch('/api/sst/capacitaciones?cobertura=true', { headers: authHeaders() }).then(r => r.json()),
    ])
    setProgramas(progs.records ?? [])
    setCobertura(cob)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seleccionarPrograma = useCallback(async (p: Programa) => {
    setProgramaActivo(p)
    setCapActiva(null)
    setAsistencias([])
    const res = await fetch(`/api/sst/capacitaciones?programaId=${p.id}`, { headers: authHeaders() })
    const data = await res.json()
    setCapacitaciones(data.records ?? [])
  }, [])

  const seleccionarCap = useCallback(async (c: Capacitacion) => {
    setCapActiva(c)
    const res = await fetch(`/api/sst/capacitaciones/${c.id}/asistencias`, { headers: authHeaders() })
    const data = await res.json()
    setAsistencias(data.records ?? [])
  }, [])

  const crearPrograma = async () => {
    if (!formProg.Titulo) return
    setGuardando(true)
    await fetch('/api/sst/capacitaciones/programas', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...formProg, Responsable: user?.name }),
    })
    setModalPrograma(false)
    await cargar()
    setGuardando(false)
  }

  const crearCapacitacion = async () => {
    if (!programaActivo || !formCap.Tema) return
    setGuardando(true)
    await fetch('/api/sst/capacitaciones', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        ...formCap,
        'Programa ID': programaActivo.id,
        'Programa Titulo': programaActivo.fields.Titulo,
        Duracion: formCap.Duracion ? Number(formCap.Duracion) : undefined,
      }),
    })
    setModalCap(false)
    setFormCap({ Tema: '', Tipo: 'induccion', Modalidad: 'presencial', Instructor: '', 'Fecha Programada': '', Duracion: '' })
    await seleccionarPrograma(programaActivo)
    setGuardando(false)
  }

  const registrarAsistencia = async () => {
    if (!capActiva || !formAsist['Nombre Trabajador']) return
    setGuardando(true)
    await fetch(`/api/sst/capacitaciones/${capActiva.id}/asistencias`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify(formAsist),
    })
    setModalAsistencia(false)
    setFormAsist({ 'Nombre Trabajador': '', 'Cargo Trabajador': '', Asistio: true })
    await seleccionarCap(capActiva)
    await cargar()
    setGuardando(false)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        icon={GraduationCap}
        title="Programa de Capacitaciones"
        description="Planeación y control del programa anual SST"
        actions={
          <button onClick={() => setModalPrograma(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Nuevo programa
          </button>
        }
      />

      <div className="flex gap-2">
        {['lista', 'cobertura'].map(t => (
          <button key={t} onClick={() => setTab(t as 'lista' | 'cobertura')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {t === 'lista' ? <><GraduationCap size={15} /> Capacitaciones</> : <><BarChart2 size={15} /> Cobertura</>}
          </button>
        ))}
      </div>

      {tab === 'cobertura' ? (
        <div className="flex-1 overflow-auto">
          {!cobertura ? (
            <div className="text-center text-gray-500 py-8">Cargando...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <div className="text-3xl font-bold text-blue-600">{cobertura.cobertura}%</div>
                <div className="text-sm text-gray-500 mt-1">Cobertura general</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${cobertura.cobertura}%` }} />
                </div>
              </Card>
              <Card>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div><div className="text-2xl font-bold text-green-600">{cobertura.realizadas}</div><div className="text-xs text-gray-500">Realizadas</div></div>
                  <div><div className="text-2xl font-bold text-gray-400">{cobertura.totalCapacitaciones - cobertura.realizadas}</div><div className="text-xs text-gray-500">Pendientes</div></div>
                  <div><div className="text-2xl font-bold text-blue-600">{cobertura.asistieron}</div><div className="text-xs text-gray-500">Asistieron</div></div>
                  <div><div className="text-2xl font-bold text-gray-400">{cobertura.totalAsistencias}</div><div className="text-xs text-gray-500">Registrados</div></div>
                </div>
              </Card>
              {Object.keys(cobertura.porCargo).length > 0 && (
                <Card className="col-span-2">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Cobertura por cargo</div>
                  <div className="space-y-2">
                    {Object.entries(cobertura.porCargo).map(([cargo, data]) => {
                      const pct = data.total > 0 ? Math.round((data.asistieron / data.total) * 100) : 0
                      return (
                        <div key={cargo} className="flex items-center gap-3">
                          <div className="w-36 text-sm text-gray-600 truncate">{cargo}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-16 text-right">{data.asistieron}/{data.total} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Programas */}
          <div className="w-56 flex-shrink-0">
            <Card className="h-full overflow-auto p-0">
              {loading ? <div className="p-4 text-center text-gray-500 text-sm">Cargando...</div>
                : programas.length === 0 ? <EmptyState icon={GraduationCap} title="Sin programas" description="Crea el primer programa" />
                : <ul>
                    {programas.map(p => (
                      <li key={p.id} onClick={() => seleccionarPrograma(p)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${programaActivo?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                        <div className="font-medium text-sm text-gray-900 truncate">{p.fields.Titulo}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.fields['Año']}</div>
                      </li>
                    ))}
                  </ul>
              }
            </Card>
          </div>

          {/* Capacitaciones */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-2">
            {programaActivo && (
              <div className="flex justify-end">
                <button onClick={() => setModalCap(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={12} /> Capacitación
                </button>
              </div>
            )}
            <Card className="flex-1 overflow-auto p-0">
              {!programaActivo ? <EmptyState icon={GraduationCap} title="Selecciona un programa" description="" />
                : capacitaciones.length === 0 ? <EmptyState icon={GraduationCap} title="Sin capacitaciones" description="Agrega la primera capacitación" />
                : <ul>
                    {capacitaciones.map(c => (
                      <li key={c.id} onClick={() => seleccionarCap(c)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${capActiva?.id === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                        <div className="font-medium text-sm text-gray-800 truncate">{c.fields.Tema}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge variant={CAP_ESTADO_VARIANT[c.fields.Estado]} label={c.fields.Estado} />
                          <span className="text-xs text-gray-400 capitalize">{c.fields.Tipo}</span>
                        </div>
                        {c.fields['Fecha Programada'] && <div className="text-xs text-gray-400 mt-0.5">{c.fields['Fecha Programada']}</div>}
                      </li>
                    ))}
                  </ul>
              }
            </Card>
          </div>

          {/* Asistencias */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {capActiva && (
              <div className="flex justify-end">
                <button onClick={() => setModalAsistencia(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Plus size={12} /> Asistente
                </button>
              </div>
            )}
            <Card className="flex-1 overflow-auto p-0">
              {!capActiva ? <EmptyState icon={GraduationCap} title="Selecciona una capacitación" description="" />
                : asistencias.length === 0 ? <EmptyState icon={GraduationCap} title="Sin asistentes" description="Registra los asistentes" />
                : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {['Trabajador', 'Cargo', 'Asistió', 'Nota'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {asistencias.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{a.fields['Nombre Trabajador']}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{a.fields['Cargo Trabajador'] ?? '—'}</td>
                          <td className="px-4 py-3">
                            {a.fields.Asistio ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{a.fields['Nota Evaluacion'] ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </Card>
          </div>
        </div>
      )}

      <Modal open={modalPrograma} onClose={() => setModalPrograma(false)} title="Nuevo programa de capacitación" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" value={formProg.Titulo} onChange={e => setFormProg(f => ({ ...f, Titulo: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Programa de Capacitaciones SST 2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <input type="number" value={formProg['Año']} onChange={e => setFormProg(f => ({ ...f, 'Año': Number(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalPrograma(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearPrograma} disabled={guardando || !formProg.Titulo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalCap} onClose={() => setModalCap(false)} title="Nueva capacitación" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema *</label>
            <input type="text" value={formCap.Tema} onChange={e => setFormCap(f => ({ ...f, Tema: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={formCap.Tipo} onChange={e => setFormCap(f => ({ ...f, Tipo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS_CAP.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
              <select value={formCap.Modalidad} onChange={e => setFormCap(f => ({ ...f, Modalidad: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha programada</label>
              <input type="date" value={formCap['Fecha Programada']} onChange={e => setFormCap(f => ({ ...f, 'Fecha Programada': e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
              <input type="number" value={formCap.Duracion} onChange={e => setFormCap(f => ({ ...f, Duracion: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <input type="text" value={formCap.Instructor} onChange={e => setFormCap(f => ({ ...f, Instructor: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalCap(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={crearCapacitacion} disabled={guardando || !formCap.Tema}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modalAsistencia} onClose={() => setModalAsistencia(false)} title="Registrar asistente" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre trabajador *</label>
            <input type="text" value={formAsist['Nombre Trabajador']} onChange={e => setFormAsist(f => ({ ...f, 'Nombre Trabajador': e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input type="text" value={formAsist['Cargo Trabajador']} onChange={e => setFormAsist(f => ({ ...f, 'Cargo Trabajador': e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="asistio" checked={formAsist.Asistio} onChange={e => setFormAsist(f => ({ ...f, Asistio: e.target.checked }))}
              className="rounded" />
            <label htmlFor="asistio" className="text-sm text-gray-700">Asistió a la capacitación</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalAsistencia(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={registrarAsistencia} disabled={guardando || !formAsist['Nombre Trabajador']}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
