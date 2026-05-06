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
  { key: 'pct_cumplimiento',        label: 'Cumplimiento',   icon: BarChart3,     meta: 80  },
  { key: 'pct_cobertura',           label: 'Cobertura',      icon: Users,         meta: 80  },
  { key: 'pct_eficacia',            label: 'Eficacia',       icon: CheckCircle2,  meta: 80  },
  { key: 'pct_cobertura_induccion', label: 'Inducción',      icon: GraduationCap, meta: 100 },
] as const

const DETALLE_LIST = [
  { prog: 'programadas',             ejec: 'ejecutadas',               label: 'Actividades'   },
  { prog: 'trabajadores_objetivo',   ejec: 'trabajadores_capacitados', label: 'Trabajadores'  },
  { prog: 'evaluaciones_realizadas', ejec: 'evaluaciones_aprobadas',   label: 'Evaluaciones'  },
] as const

function estadoBadge(estado?: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    'Cumple':    { bg: 'rgba(22,101,52,0.08)',  text: '#166534', dot: '#166534' },
    'En riesgo': { bg: 'rgba(217,119,6,0.08)',  text: '#D97706', dot: '#D97706' },
    'Crítico':   { bg: 'rgba(220,53,69,0.08)',  text: '#DC3545', dot: '#DC3545' },
  }
  const s = map[estado ?? ''] ?? { bg: 'rgba(0,0,0,0.04)', text: '#64748B', dot: '#64748B' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {estado ?? '—'}
    </span>
  )
}

export function KpiDashboard({ indicador, trimestre }: Props) {
  const f = indicador?.fields

  const barLabels = DETALLE_LIST.map(d => d.label)
  const barProg   = DETALLE_LIST.map(d => f ? (f[d.prog] ?? 0) : 0)
  const barEjec   = DETALLE_LIST.map(d => f ? (f[d.ejec] ?? 0) : 0)

  const chartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Programado / Objetivo',
        data: barProg,
        backgroundColor: 'rgba(11,91,45,0.08)',
        borderColor: '#0B5B2D',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Ejecutado / Capacitado',
        data: barEjec,
        backgroundColor: 'rgba(22,101,52,0.7)',
        borderColor: '#166534',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 10, padding: 14, color: '#334155' } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748B' } },
      y: { beginAtZero: true, grid: { color: '#F1F5F3' }, ticks: { font: { size: 10 }, color: '#64748B' } },
    },
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Título + badge meta */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--sst-dark-700, #0F172A)' }}>
          KPIs — {trimestre}
        </h3>
        {f && estadoBadge(f.estado_meta_cumplimiento)}
      </div>

      {/* Rings */}
      {f ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KPI_LIST.map(({ key, label, icon: Icon, meta }) => {
            const val = (f[key] ?? 0) as number
            return (
              <div
                key={key}
                className="rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: '#FFFFFF',
                  border: '0.5px solid #E2E8E4',
                  borderTop: '3px solid #166534',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <KpiRing value={val} meta={meta} size={76} strokeWidth={6} />
                <div className="flex items-center gap-1 mt-0.5">
                  <Icon size={12} style={{ color: '#166534' }} strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: '#334155' }}>
                    {label}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: '#94A3B8' }}>meta {meta}%</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="rounded-xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: '#F8FAF9', border: '0.5px solid #E2E8E4' }}
        >
          <BarChart3 size={40} style={{ color: '#94A3B8', opacity: 0.5 }} strokeWidth={1.5} />
          <p className="text-sm font-medium" style={{ color: '#64748B' }}>Sin datos para {trimestre}</p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>Haz clic en <strong>Recalcular</strong> para generar los KPIs</p>
        </div>
      )}

      {/* Gráfico programado vs. ejecutado */}
      {f && (
        <div
          className="rounded-xl p-4"
          style={{ background: '#FFFFFF', border: '0.5px solid #E2E8E4' }}
        >
          <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
            Programado vs. Ejecutado
          </h4>
          <Bar data={chartData} options={chartOptions} height={130} />
        </div>
      )}

      {/* Análisis trimestral (si existe) */}
      {f?.analisis && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(22,101,52,0.04)', border: '0.5px solid rgba(22,101,52,0.2)' }}
        >
          <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#166534' }}>
            Análisis trimestral
          </h4>
          <p className="text-sm whitespace-pre-line" style={{ color: '#1A2332' }}>{f.analisis}</p>
        </div>
      )}
    </div>
  )
}
