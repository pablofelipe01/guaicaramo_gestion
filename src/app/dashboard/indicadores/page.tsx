'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { TrendingUp, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import type { IndKpiResult } from '@/types/sst/ind'

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function SemaforoCircle({ cumple, valor, meta, unidad }: { cumple: boolean; valor: number | null; meta: number; unidad: string }) {
  const color = valor === null ? 'bg-gray-200' : cumple ? 'bg-green-500' : 'bg-red-500'
  return (
    <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shrink-0 ${color}`}>
      <span className="text-lg leading-none">{valor ?? '—'}</span>
      <span className="text-[9px] leading-tight text-center px-1 opacity-90">{unidad.split(' ')[0]}</span>
    </div>
  )
}

function KpiCard({ kpi }: { kpi: IndKpiResult }) {
  const borderColor = kpi.valor === null ? 'border-gray-200' : kpi.cumpleMeta ? 'border-green-400' : 'border-red-400'
  return (
    <div className={`bg-white rounded-xl border-l-4 ${borderColor} shadow-sm p-4 flex gap-4 items-start`}>
      <SemaforoCircle cumple={kpi.cumpleMeta} valor={kpi.valor} meta={kpi.meta} unidad={kpi.unidad} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{kpi.codigo}</span>
          {kpi.valor !== null && (
            kpi.cumpleMeta
              ? <CheckCircle size={14} className="text-green-500 shrink-0" />
              : <XCircle size={14} className="text-red-500 shrink-0" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-1">{kpi.nombre}</h3>
        <p className="text-xs text-gray-500">Meta: {kpi.meta} {kpi.unidad}</p>
        <p className="text-xs text-gray-400 mt-1">Fórmula: {kpi.formula}</p>
        <p className="text-xs text-gray-300 mt-0.5">Fuente: {kpi.fuente}</p>
      </div>
    </div>
  )
}

export default function IndicadoresPage() {
  useAuth()
  const [kpis, setKpis] = useState<IndKpiResult[]>([])
  const [loading, setLoading] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear())

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/sst/indicadores?vista=kpis&anio=${anio}`, { headers: authHeaders() })
    if (res.ok) setKpis((await res.json()).kpis)
    setLoading(false)
  }, [anio])

  useEffect(() => { load() }, [load])

  const cumpliendo = kpis.filter(k => k.valor !== null && k.cumpleMeta).length
  const incumpliendo = kpis.filter(k => k.valor !== null && !k.cumpleMeta).length

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Indicadores del SG-SST"
        description="Dashboard de KPIs — Resolución 0312 de 2019"
        icon={TrendingUp}
        actions={
          <div className="flex items-center gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={load}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>
        }
      />

      {/* Resumen semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{cumpliendo}</p>
            <p className="text-sm text-gray-500 mt-1">Indicadores en meta</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{incumpliendo}</p>
            <p className="text-sm text-gray-500 mt-1">Por debajo de meta</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-700">{kpis.length}</p>
            <p className="text-sm text-gray-500 mt-1">KPIs Res. 0312</p>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Accidentalidad */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Accidentalidad y Enfermedad Laboral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kpis.filter(k => ['IF', 'IS', 'ILT'].includes(k.codigo)).map(k => <KpiCard key={k.codigo} kpi={k} />)}
            </div>
          </div>

          {/* Gestión */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Gestión del SG-SST</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kpis.filter(k => ['COB_CAP', 'CUM_PLAN', 'EJEC_PPTO', 'CIERRE_AC', 'INSP'].includes(k.codigo)).map(k => <KpiCard key={k.codigo} kpi={k} />)}
            </div>
          </div>
        </>
      )}

      <Card>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Leyenda</h3>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Cumple meta (≥ valor objetivo)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Por debajo de meta</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /> Sin datos en el período</div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Para IF e IS, menor es mejor — se cumple meta cuando el valor está <em>por debajo</em> del umbral.</p>
        </div>
      </Card>
    </div>
  )
}
