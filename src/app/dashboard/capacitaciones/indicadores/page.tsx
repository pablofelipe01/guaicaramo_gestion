'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { KpiDashboard } from '@/components/sst/capacitaciones/KpiDashboard'
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react'
import { TRIMESTRES_CAP } from '@/lib/sst/cap-client'
import type { CapIndicadorFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Indicador = AirtableRecord<CapIndicadorFields>

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function IndicadoresPage() {
  const router = useRouter()
  const [trimestre, setTrimestre] = useState<string>('Q2 2026')
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [analisis, setAnalisis] = useState('')
  const [guardandoAnalisis, setGuardandoAnalisis] = useState(false)
  const [editandoAnalisis, setEditandoAnalisis] = useState(false)

  const indicadorActual = indicadores.find(i => i.fields.trimestre === trimestre) ?? null

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/sst/capacitaciones/indicadores', { headers: authHeaders() })
    if (res.ok) setIndicadores((await res.json()).records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    setAnalisis(indicadorActual?.fields.analisis ?? '')
    setEditandoAnalisis(false)
  }, [indicadorActual])

  const recalcular = async () => {
    setCalculando(true)
    try {
      const res = await fetch('/api/sst/capacitaciones/indicadores/calcular', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ trimestre }),
      })
      if (res.ok) await cargar()
    } catch (e) {
      console.error(e)
    }
    setCalculando(false)
  }

  const guardarAnalisis = async () => {
    setGuardandoAnalisis(true)
    try {
      await fetch('/api/sst/capacitaciones/indicadores/calcular', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ trimestre, analisis }),
      })
      await cargar()
      setEditandoAnalisis(false)
    } catch (e) {
      console.error(e)
    }
    setGuardandoAnalisis(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-bold text-gray-900">Dashboard de Indicadores</h1>
          </div>
          <p className="text-sm text-gray-500">KPIs trimestrales del plan de capacitaciones — Res. 0312</p>
        </div>
      </div>

      {/* Selector de trimestre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 font-medium">Trimestre:</span>
        <div className="flex gap-1.5">
          {TRIMESTRES_CAP.map(t => (
            <button
              key={t}
              onClick={() => setTrimestre(t)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                trimestre === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={recalcular}
          disabled={calculando}
          className="flex items-center gap-1.5 ml-2 text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${calculando ? 'animate-spin' : ''}`} />
          {calculando ? 'Calculando…' : 'Recalcular'}
        </button>
      </div>

      {/* Dashboard */}
      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <KpiDashboard indicador={indicadorActual} trimestre={trimestre} />
        )}
      </Card>

      {/* Análisis trimestral */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Análisis trimestral — {trimestre}</h3>
          {!editandoAnalisis ? (
            <button
              onClick={() => setEditandoAnalisis(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              Editar
            </button>
          ) : null}
        </div>
        {editandoAnalisis ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={5}
              value={analisis}
              onChange={e => setAnalisis(e.target.value)}
              placeholder="Ingresa el análisis de resultados del trimestre…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setEditandoAnalisis(false); setAnalisis(indicadorActual?.fields.analisis ?? '') }}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAnalisis}
                disabled={guardandoAnalisis}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {guardandoAnalisis ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {indicadorActual?.fields.analisis || (
              <span className="text-gray-400 italic">Sin análisis registrado para este trimestre.</span>
            )}
          </p>
        )}
      </Card>

      {/* Resumen histórico */}
      {indicadores.length > 1 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Comparativo anual</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Trimestre</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Cumplimiento</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Cobertura</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Eficacia</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {indicadores.map(ind => {
                  const fi = ind.fields
                  const activo = fi.trimestre === trimestre
                  return (
                    <tr
                      key={ind.id}
                      onClick={() => setTrimestre(fi.trimestre)}
                      className={`cursor-pointer transition-colors ${activo ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {fi.trimestre} {activo && <span className="text-xs text-blue-600">(actual)</span>}
                      </td>
                      {[fi.pct_cumplimiento, fi.pct_cobertura, fi.pct_eficacia].map((v, i) => (
                        <td key={i} className="px-3 py-2 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            v >= 80 ? 'bg-green-100 text-green-700' :
                            v >= 60 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {v}%
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          fi.estado_meta_cumplimiento === 'Cumple' ? 'bg-green-100 text-green-700' :
                          fi.estado_meta_cumplimiento === 'En riesgo' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {fi.estado_meta_cumplimiento ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
