'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { RegistroForm } from '@/components/sst/capacitaciones/RegistroForm'
import { ArrowLeft, ClipboardCheck, Plus, Users, Calendar } from 'lucide-react'
import type { CapActividadFields, CapProgramacionFields, CapRegistroFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>
type Registro = AirtableRecord<CapRegistroFields>

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

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
      fetch('/api/sst/capacitaciones/registros', { headers: authHeaders() }),
      fetch('/api/sst/capacitaciones', { headers: authHeaders() }),
      fetch('/api/sst/capacitaciones/programacion', { headers: authHeaders() }),
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
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error al guardar')
    }
    setModalNuevo(false)
    await cargar()
  }

  // Ãndice de actividades para lookup
  const actIdx = Object.fromEntries(actividades.map(a => [a.id, a.fields.tema]))

  const totalConvocados = registros.reduce((s, r) => s + (r.fields.asistentes_convocados ?? 0), 0)
  const totalPresentes  = registros.reduce((s, r) => s + (r.fields.asistentes_presentes ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-bold text-gray-900">Registros de EjecuciÃ³n</h1>
          </div>
          <p className="text-sm text-gray-500">Listado de todas las ejecuciones registradas</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo registro
        </button>
      </div>

      {/* KPIs rÃ¡pidos */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total registros</p>
          <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Convocados</p>
          <p className="text-2xl font-bold text-blue-600">{totalConvocados}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Presentes</p>
          <p className="text-2xl font-bold text-green-600">{totalPresentes}</p>
        </Card>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full" />
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Sin registros de ejecuciÃ³n</p>
            <button
              onClick={() => setModalNuevo(true)}
              className="mt-3 text-sm text-green-600 hover:underline"
            >
              Crear primer registro
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Actividad</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Facilitador</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Asistentes</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Evaluaciones</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Lugar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r, i) => {
                  const rf = r.fields
                  const pct = rf.asistentes_convocados && rf.asistentes_presentes
                    ? Math.round((rf.asistentes_presentes / rf.asistentes_convocados) * 100)
                    : null
                  const pctE = rf.evaluaciones_realizadas && rf.evaluaciones_aprobadas
                    ? Math.round((rf.evaluaciones_aprobadas / rf.evaluaciones_realizadas) * 100)
                    : null
                  return (
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px]">
                        <span className="line-clamp-2">
                          {rf.actividad_tema ?? actIdx[rf.actividad_id] ?? rf.actividad_id}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {rf.fecha_ejecucion}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{rf.facilitador ?? 'â€”'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {rf.asistentes_presentes != null ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            pct != null && pct >= 80 ? 'bg-green-100 text-green-700' :
                            pct != null && pct >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {rf.asistentes_presentes}/{rf.asistentes_convocados ?? '?'} ({pct ?? '?'}%)
                          </span>
                        ) : 'â€”'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {rf.evaluaciones_realizadas != null ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            pctE != null && pctE >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {rf.evaluaciones_aprobadas}/{rf.evaluaciones_realizadas} ({pctE ?? '?'}%)
                          </span>
                        ) : 'â€”'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell text-xs">{rf.lugar ?? 'â€”'}</td>
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

