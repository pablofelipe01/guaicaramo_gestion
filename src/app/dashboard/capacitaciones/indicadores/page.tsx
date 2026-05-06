'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { KpiDashboard } from '@/components/sst/capacitaciones/KpiDashboard'
import { ArrowLeft, BarChart3, RefreshCw, PenLine, Check, X } from 'lucide-react'
import { TRIMESTRES_CAP } from '@/lib/sst/cap-client'
import type { CapIndicadorFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { getAuthHeaders } from '@/lib/client/authFetch'

type Indicador = AirtableRecord<CapIndicadorFields>

/* ─── helpers visuales ────────────────────────────────────────────────────── */
function PctBadge({ v }: { v: number }) {
  const color = v >= 80 ? 'var(--sst-cumple)' : v >= 60 ? 'var(--sst-riesgo)' : 'var(--sst-critico)'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {v}%
    </span>
  )
}

function MetaBadge({ estado }: { estado?: string }) {
  const color = estado === 'Cumple' ? 'var(--sst-cumple)' : estado === 'En riesgo' ? 'var(--sst-riesgo)' : estado === 'Crítico' ? 'var(--sst-critico)' : 'var(--sst-dark-400)'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {estado ?? '—'}
    </span>
  )
}

/* ─── page ────────────────────────────────────────────────────────────────── */
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
    const res = await fetch('/api/sst/capacitaciones/indicadores', { headers: getAuthHeaders() })
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ trimestre }),
      })
      if (res.ok) await cargar()
    } catch (e) { console.error(e) }
    setCalculando(false)
  }

  const guardarAnalisis = async () => {
    setGuardandoAnalisis(true)
    try {
      await fetch('/api/sst/capacitaciones/indicadores/calcular', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ trimestre, analisis }),
      })
      await cargar()
      setEditandoAnalisis(false)
    } catch (e) { console.error(e) }
    setGuardandoAnalisis(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
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
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--sst-green-700)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>Dashboard de Indicadores</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--sst-dark-500)' }}>KPIs trimestrales del plan de capacitaciones — Res. 0312 de 2019</p>
        </div>
        <button onClick={recalcular} disabled={calculando} className="btn btn-secondary">
          <RefreshCw className={`w-4 h-4 ${calculando ? 'animate-spin' : ''}`} />
          {calculando ? 'Calculando…' : 'Recalcular'}
        </button>
      </div>

      {/* ── Selector de trimestre ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sst-dark-400)' }}>
          Trimestre:
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {TRIMESTRES_CAP.map(t => (
            <button
              key={t}
              onClick={() => setTrimestre(t)}
              className={trimestre === t ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Dashboard ────────────────────────────────────────────── */}
      <Card className="p-4">
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl h-28 bg-gray-100" />
              ))}
            </div>
            <div className="rounded-xl h-40 bg-gray-100" />
          </div>
        ) : (
          <KpiDashboard indicador={indicadorActual} trimestre={trimestre} />
        )}
      </Card>

      {/* ── Análisis trimestral ───────────────────────────────────────── */}
      <Card className="p-4" style={{ borderTop: '3px solid var(--sst-cumple)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Análisis trimestral — {trimestre}
          </h2>
          {!editandoAnalisis && (
            <button onClick={() => setEditandoAnalisis(true)} className="btn btn-ghost text-xs gap-1">
              <PenLine className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>

        {editandoAnalisis ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={5}
              value={analisis}
              onChange={e => setAnalisis(e.target.value)}
              placeholder="Ingresa el análisis de resultados del trimestre…"
              className="w-full rounded-lg px-3 py-2 text-sm resize-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition-all"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditandoAnalisis(false); setAnalisis(indicadorActual?.fields.analisis ?? '') }}
                className="btn btn-ghost text-xs gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                onClick={guardarAnalisis}
                disabled={guardandoAnalisis}
                className="btn btn-primary text-xs gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {guardandoAnalisis ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line" style={{ color: indicadorActual?.fields.analisis ? 'var(--sst-dark-700)' : 'var(--sst-dark-300)' }}>
            {indicadorActual?.fields.analisis || 'Sin análisis registrado para este trimestre.'}
          </p>
        )}
      </Card>

      {/* ── Comparativo anual ─────────────────────────────────────────── */}
      {indicadores.length > 1 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Comparativo anual</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--sst-dark-100)' }}>
                  {['Trimestre', 'Cumplimiento', 'Cobertura', 'Eficacia', 'Meta'].map(col => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--sst-dark-500)' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {indicadores.map(ind => {
                  const fi = ind.fields
                  const activo = fi.trimestre === trimestre
                  return (
                    <tr
                      key={ind.id}
                      onClick={() => setTrimestre(fi.trimestre)}
                      className="cursor-pointer transition-all duration-150"
                      style={{
                        borderLeft: activo ? '3px solid var(--sst-cumple)' : '3px solid transparent',
                        background: activo ? 'color-mix(in srgb, var(--sst-cumple) 4%, transparent)' : undefined,
                      }}
                      onMouseEnter={e => { if (!activo) { (e.currentTarget as HTMLElement).style.background = 'var(--sst-dark-50)' } }}
                      onMouseLeave={e => { if (!activo) { (e.currentTarget as HTMLElement).style.background = '' } }}
                    >
                      <td className="px-3 py-2.5 text-[13px] font-medium" style={{ color: 'var(--sst-dark-700)' }}>
                        {fi.trimestre}
                        {activo && <span className="ml-2 text-[10px]" style={{ color: 'var(--sst-cumple)' }}>● actual</span>}
                      </td>
                      {[fi.pct_cumplimiento, fi.pct_cobertura, fi.pct_eficacia].map((v, i) => (
                        <td key={i} className="px-3 py-2.5">
                          <PctBadge v={v ?? 0} />
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <MetaBadge estado={fi.estado_meta_cumplimiento} />
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

