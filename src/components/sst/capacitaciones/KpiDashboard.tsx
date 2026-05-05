'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'
import { Users, CheckCircle2, GraduationCap, BarChart3 } from 'lucide-react'
import { KpiRing } from './KpiRing'
import type { CapIndicadorFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props {
  indicador: AirtableRecord<CapIndicadorFields> | null
  trimestre: string
}

const KPI_LIST = [
  { key: 'pct_cumplimiento',       label: '% Cumplimiento',   icon: BarChart3,   meta: 80,  color: '#2C5F8D' },
  { key: 'pct_cobertura',          label: '% Cobertura',      icon: Users,       meta: 80,  color: '#28A745' },
  { key: 'pct_eficacia',           label: '% Eficacia',       icon: CheckCircle2, meta: 80, color: '#FF8C42' },
  { key: 'pct_cobertura_induccion',label: '% Inducción',      icon: GraduationCap, meta: 100, color: '#534AB7' },
] as const

const DETALLE_LIST = [
  { prog: 'programadas',           ejec: 'ejecutadas',           label: 'Actividades',   color: '#2C5F8D' },
  { prog: 'trabajadores_objetivo', ejec: 'trabajadores_capacitados', label: 'Trabajadores', color: '#28A745' },
  { prog: 'evaluaciones_realizadas', ejec: 'evaluaciones_aprobadas', label: 'Evaluaciones', color: '#FF8C42' },
] as const

export function KpiDashboard({ indicador, trimestre }: Props) {
  const f = indicador?.fields

  // ── Datos para Chart.js ──────────────────────────────────────────────────
  const barLabels = DETALLE_LIST.map(d => d.label)
  const barProg   = DETALLE_LIST.map(d => f ? (f[d.prog] ?? 0) : 0)
  const barEjec   = DETALLE_LIST.map(d => f ? (f[d.ejec] ?? 0) : 0)

  const chartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Programado / Objetivo',
        data: barProg,
        backgroundColor: 'rgba(44, 95, 141, 0.15)',
        borderColor: '#2C5F8D',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Ejecutado / Capacitado',
        data: barEjec,
        backgroundColor: 'rgba(40, 167, 69, 0.7)',
        borderColor: '#28A745',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { font: { size: 10 } } },
    },
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Título + semáforo meta */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">KPIs — {trimestre}</h3>
        {f && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
            f.estado_meta_cumplimiento === 'Cumple'
              ? 'bg-green-100 text-green-700 border-green-200'
              : f.estado_meta_cumplimiento === 'En riesgo'
              ? 'bg-orange-100 text-orange-700 border-orange-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            {f.estado_meta_cumplimiento ?? '—'}
          </span>
        )}
      </div>

      {/* Rings de KPI */}
      {f ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KPI_LIST.map(({ key, label, meta }) => {
            const val = (f[key] ?? 0) as number
            return (
              <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-shadow">
                <KpiRing value={val} meta={meta} size={80} strokeWidth={7} />
                <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
                <span className="text-[10px] text-gray-400">meta {meta}%</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-400">Sin datos para {trimestre}. Haz clic en <b>Recalcular</b> para generar los KPIs.</p>
        </div>
      )}

      {/* Gráfico de barras */}
      {f && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Programado vs. Ejecutado
          </h4>
          <Bar data={chartData} options={chartOptions} height={140} />
        </div>
      )}

      {/* Análisis trimestral */}
      {f?.analisis && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Análisis trimestral</h4>
          <p className="text-sm text-blue-800 whitespace-pre-line">{f.analisis}</p>
        </div>
      )}
    </div>
  )
}
