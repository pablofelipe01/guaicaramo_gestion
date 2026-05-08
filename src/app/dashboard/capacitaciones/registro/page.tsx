'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { RegistroForm } from '@/components/sst/capacitaciones/RegistroForm'
import { ArrowLeft, ClipboardCheck, Plus, Users, Calendar } from 'lucide-react'
import type { CapActividadFields, CapProgramacionFields, CapRegistroFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { getAuthHeaders } from '@/lib/client/authFetch'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>
type Registro = AirtableRecord<CapRegistroFields>

export default function RegistrosPage() {
  const router = useRouter()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [programaciones, setProgramaciones] = useState<Prog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [regRes, actRes, progRes] = await Promise.all([
      fetch('/api/sst/capacitaciones/registros', { headers: getAuthHeaders() }),
      fetch('/api/sst/capacitaciones', { headers: getAuthHeaders() }),
      fetch('/api/sst/capacitaciones/programacion', { headers: getAuthHeaders() }),
    ])
    if (regRes.ok)  setRegistros((await regRes.json()).records ?? [])
    if (actRes.ok)  setActividades((await actRes.json()).records ?? [])
    if (progRes.ok) setProgramaciones((await progRes.json()).records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardarRegistro = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/sst/capacitaciones/registros', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error al guardar')
    }
    setModalNuevo(false)
    await cargar()
  }

  // Índice de actividades para lookup
  const actIdx = Object.fromEntries(actividades.map(a => [a.id, a.fields.tema]))

  const totalConvocados = registros.reduce((s, r) => s + (r.fields.convocados ?? 0), 0)
  const totalPresentes  = registros.reduce((s, r) => s + (r.fields.presentes ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--sst-dark-500)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)'; e.currentTarget.style.color = 'var(--sst-dark-900)' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--sst-dark-500)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--sst-cumple)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>Registros de Ejecución</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--sst-dark-500)' }}>Listado de todas las ejecuciones registradas</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo registro
        </button>
      </div>

      {/* ── KPIs rápidos ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Total registros</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--sst-dark-900)' }}>{registros.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Convocados</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--phase-planear)' }}>{totalConvocados}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Presentes</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--sst-cumple)' }}>{totalPresentes}</p>
        </Card>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--sst-green-700)', borderTopColor: 'transparent' }} />
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--sst-dark-300)' }} />
            <p style={{ color: 'var(--sst-dark-500)' }}>Sin registros de ejecución</p>
            <button
              onClick={() => setModalNuevo(true)}
              className="mt-3 text-sm hover:underline"
              style={{ color: 'var(--sst-cumple)' }}
            >
              Crear primer registro
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead style={{ background: 'var(--sst-dark-100)' }}>
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Actividad</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Fecha</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Facilitador</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Asistentes</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Evaluaciones</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Lugar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r, i) => {
                  const rf = r.fields
                  const pct = rf.convocados && rf.presentes
                    ? Math.round((rf.presentes / rf.convocados) * 100)
                    : null
                  const pctE = rf.evaluaciones_realizadas && rf.evaluaciones_aprobadas
                    ? Math.round((rf.evaluaciones_aprobadas / rf.evaluaciones_realizadas) * 100)
                    : null
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--sst-dark-100)' }}>
                      <td className="px-3 py-2.5 font-medium max-w-[140px] sm:max-w-[200px]" style={{ color: 'var(--sst-dark-800)' }}>
                        <span className="line-clamp-2">
                          {rf.actividad_tema ?? actIdx[rf.actividad_id] ?? rf.actividad_id}
                        </span>
                        {/* Fecha y facilitador visibles sólo en móvil bajo el tema */}
                        <span className="text-[10px] flex items-center gap-1 mt-0.5 sm:hidden" style={{ color: 'var(--sst-dark-500)' }}>
                          <Calendar className="w-3 h-3" />{rf.fecha_ejecucion ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell" style={{ color: 'var(--sst-dark-700)' }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--sst-dark-500)' }} />
                          {rf.fecha_ejecucion}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell" style={{ color: 'var(--sst-dark-700)' }}>{rf.facilitador ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {rf.presentes != null ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: pct != null && pct >= 80 ? 'var(--sst-cumple-bg)' : pct != null && pct >= 60 ? 'var(--sst-riesgo-bg)' : 'var(--sst-critico-bg)',
                              color: pct != null && pct >= 80 ? 'var(--sst-cumple)' : pct != null && pct >= 60 ? 'var(--sst-riesgo)' : 'var(--sst-critico)',
                              border: `1px solid ${pct != null && pct >= 80 ? 'rgba(22,101,52,0.2)' : pct != null && pct >= 60 ? 'rgba(217,119,6,0.2)' : 'rgba(220,53,69,0.2)'}`,
                            }}
                          >
                            <span className="hidden sm:inline">{rf.presentes}/{rf.convocados ?? '?'} ({pct ?? '?'}%)</span>
                            <span className="sm:hidden">{rf.presentes}/{rf.convocados ?? '?'}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                        {rf.evaluaciones_realizadas != null ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: pctE != null && pctE >= 80 ? 'var(--sst-cumple-bg)' : 'var(--sst-riesgo-bg)',
                              color: pctE != null && pctE >= 80 ? 'var(--sst-cumple)' : 'var(--sst-riesgo)',
                              border: `1px solid ${pctE != null && pctE >= 80 ? 'rgba(22,101,52,0.2)' : 'rgba(217,119,6,0.2)'}`,
                            }}
                          >
                            {rf.evaluaciones_aprobadas}/{rf.evaluaciones_realizadas} ({pctE ?? '?'}%)
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell text-xs" style={{ color: 'var(--sst-dark-500)' }}>{rf.lugar ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="">
        <RegistroForm
          actividades={actividades}
          programaciones={programaciones}
          onGuardar={guardarRegistro}
          onCancelar={() => setModalNuevo(false)}
        />
      </Modal>
    </div>
  )
}

