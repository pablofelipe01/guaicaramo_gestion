'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { KPICard } from '@/components/dashboard/KPICard'
import { AlertasPanel } from '@/components/dashboard/AlertasPanel'
import { TendenciasChart } from '@/components/dashboard/TendenciasChart'
import { CumplimientoGauge } from '@/components/dashboard/CumplimientoGauge'
import { TareasPendientes } from '@/components/dashboard/TareasPendientes'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import type { IndKpiResult } from '@/types/sst/ind'
import type { AlertaDashboard } from '@/lib/sst/alertas'
import type { TareaDashboard } from '@/lib/sst/tareas'

interface TendenciasPoint {
  mes: string
  AT: number
  incidentes: number
  EL: number
}

interface DashboardData {
  kpis: IndKpiResult[]
  alertas: AlertaDashboard[]
  tareas: TareaDashboard[]
  tendencias: TendenciasPoint[]
}

const KPI_DESTACADOS = ['IF', 'COB_CAP', 'CUM_PLAN', 'CIERRE_AC']

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/sst/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al cargar datos del dashboard')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const kpisDestacados = data?.kpis.filter(k => KPI_DESTACADOS.includes(k.codigo)) ?? []
  const kpisSecundarios = data?.kpis.filter(k => !KPI_DESTACADOS.includes(k.codigo)) ?? []
  const kpiCumplan = data?.kpis.find(k => k.codigo === 'CUM_PLAN')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title={`Bienvenido${user?.name ? `, ${user.name}` : ''}`}
          description="Panel de control SG-SST — Ciclo PHVA | Res. 0312 de 2019"
          icon={LayoutDashboard}
        />
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mt-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={['w-3.5 h-3.5', loading ? 'animate-spin' : ''].join(' ')} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPIs destacados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpisDestacados.map(k => <KPICard key={k.codigo} kpi={k} />)}
      </div>

      {/* Gráficos */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TendenciasChart datos={data.tendencias} />
          </div>
          <div>
            <CumplimientoGauge
              valor={kpiCumplan?.valor ?? 0}
              meta={kpiCumplan?.meta ?? 80}
              nombre="Cumplimiento Plan Anual"
            />
          </div>
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-64 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />
              <div className="h-40 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-64 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6 mx-auto" />
            <div className="w-36 h-36 bg-gray-100 rounded-full mx-auto" />
          </div>
        </div>
      )}

      {/* Alertas + Tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-56 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded mb-2" />
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-56 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded mb-2" />
              ))}
            </div>
          </>
        ) : (
          <>
            <AlertasPanel alertas={data?.alertas ?? []} />
            <TareasPendientes tareas={data?.tareas ?? []} />
          </>
        )}
      </div>

      {/* KPIs secundarios */}
      {!loading && kpisSecundarios.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Indicadores adicionales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpisSecundarios.map(k => <KPICard key={k.codigo} kpi={k} />)}
          </div>
        </div>
      )}
    </div>
  )
}
