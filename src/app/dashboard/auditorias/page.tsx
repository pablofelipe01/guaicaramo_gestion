'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Plus, X, Loader2, CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react'
import type { AudAuditoriaFields } from '@/types/sst/aud'
import type { AirtableRecord } from '@/lib/airtable-client'

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  planificada:   { label: 'Planificada',    color: 'bg-blue-50 text-blue-700' },
  en_ejecucion:  { label: 'En ejecución',   color: 'bg-yellow-50 text-yellow-700' },
  cerrada:       { label: 'Cerrada',         color: 'bg-green-50 text-green-700' },
}

const TIPO_LABELS: Record<string, string> = {
  interna: 'Interna',
  externa: 'Externa',
}

interface Stats {
  total: number
  planificadas: number
  enEjecucion: number
  cerradas: number
  noConformidadesAbiertas: number
  noConformidadesMayores: number
}

export default function AuditoriasPage() {
  const [auditorias, setAuditorias] = useState<AirtableRecord<AudAuditoriaFields>[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [form, setForm] = useState<Partial<AudAuditoriaFields>>({
    Tipo: 'interna',
    Estado: 'planificada',
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const [aRes, sRes] = await Promise.all([
      fetch('/api/sst/auditorias', { headers: getHeaders() }),
      fetch('/api/sst/auditorias?vista=estadisticas', { headers: getHeaders() }),
    ])
    const aData = await aRes.json()
    const sData = await sRes.json()
    setAuditorias(aData.records ?? [])
    if (sRes.ok) setStats(sData)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function crear() {
    setError('')
    if (!form.Titulo || !form['Auditor Nombre'] || !form['Fecha Inicio'] || !form.Alcance) {
      setError('Todos los campos obligatorios son requeridos')
      return
    }
    const res = await fetch('/api/sst/auditorias', {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message ?? 'Error al crear'); return }
    setModalAbierto(false)
    setForm({ Tipo: 'interna', Estado: 'planificada' })
    setExito('Auditoría creada correctamente')
    setTimeout(() => setExito(''), 3000)
    cargar()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Auditorías</h1>
            <p className="text-sm text-gray-500">Ciclo PHVA · Verificar</p>
          </div>
        </div>
        <button
          onClick={() => { setError(''); setModalAbierto(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva auditoría
        </button>
      </div>

      {exito && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {exito}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Planificadas', value: stats.planificadas, color: 'text-blue-600' },
            { label: 'En ejecución', value: stats.enEjecucion, color: 'text-yellow-600' },
            { label: 'Cerradas', value: stats.cerradas, color: 'text-green-600' },
            { label: 'NC abiertas', value: stats.noConformidadesAbiertas, color: 'text-red-500' },
            { label: 'NC mayores', value: stats.noConformidadesMayores, color: 'text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={['text-2xl font-bold mt-1', color].join(' ')}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : auditorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <ClipboardList className="w-8 h-8" />
            <p className="text-sm">Sin auditorías registradas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Título', 'Tipo', 'Auditor', 'Fecha Inicio', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditorias.map(a => {
                const est = ESTADO_LABELS[a.fields.Estado] ?? { label: a.fields.Estado, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.fields.Titulo}</td>
                    <td className="px-4 py-3 text-gray-500">{TIPO_LABELS[a.fields.Tipo] ?? a.fields.Tipo}</td>
                    <td className="px-4 py-3 text-gray-500">{a.fields['Auditor Nombre']}</td>
                    <td className="px-4 py-3 text-gray-500">{a.fields['Fecha Inicio']}</td>
                    <td className="px-4 py-3">
                      <span className={['px-2 py-0.5 rounded text-xs font-medium', est.color].join(' ')}>
                        {est.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Nueva auditoría</h2>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título *" value={form.Titulo ?? ''}
                  onChange={e => setForm(f => ({ ...f, Titulo: e.target.value }))} />
              </div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form.Tipo} onChange={e => setForm(f => ({ ...f, Tipo: e.target.value as 'interna' | 'externa' }))}>
                <option value="interna">Interna</option>
                <option value="externa">Externa</option>
              </select>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre auditor *" value={form['Auditor Nombre'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Auditor Nombre': e.target.value }))} />
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={form['Fecha Inicio'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Inicio': e.target.value }))} />
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fecha fin"
                value={form['Fecha Fin'] ?? ''}
                onChange={e => setForm(f => ({ ...f, 'Fecha Fin': e.target.value }))} />
              <div className="col-span-2">
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3} placeholder="Alcance *" value={form.Alcance ?? ''}
                  onChange={e => setForm(f => ({ ...f, Alcance: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                Cancelar
              </button>
              <button onClick={crear} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
