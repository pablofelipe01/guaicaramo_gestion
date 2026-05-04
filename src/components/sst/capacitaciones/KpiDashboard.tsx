'use client'

import { BarChart3, Users, CheckCircle2, GraduationCap } from 'lucide-react'
import { KpiCard } from './KpiCard'
import type { CapIndicadorFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

interface Props {
  indicador: AirtableRecord<CapIndicadorFields> | null
  trimestre: string
}

export function KpiDashboard({ indicador, trimestre }: Props) {
  const f = indicador?.fields

  const pctCumplimiento     = f?.pct_cumplimiento      ?? 0
  const pctCobertura        = f?.pct_cobertura         ?? 0
  const pctEficacia         = f?.pct_eficacia          ?? 0
  const pctCoberturaInd     = f?.pct_cobertura_induccion ?? 0

  return (
    <div className="flex flex-col gap-4">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="% Cumplimiento"
          value={pctCumplimiento}
          meta={80}
          icon={BarChart3}
          description={f ? `${f.ejecutadas} / ${f.programadas} actividades` : 'Sin datos'}
        />
        <KpiCard
          label="% Cobertura"
          value={pctCobertura}
          meta={80}
          icon={Users}
          description={f ? `${f.trabajadores_capacitados} / ${f.trabajadores_objetivo} trabajadores` : 'Sin datos'}
        />
        <KpiCard
          label="% Eficacia"
          value={pctEficacia}
          meta={80}
          icon={CheckCircle2}
          description={f ? `${f.evaluaciones_aprobadas} / ${f.evaluaciones_realizadas} evaluaciones` : 'Sin datos'}
        />
        <KpiCard
          label="% Inducción"
          value={pctCoberturaInd}
          meta={100}
          icon={GraduationCap}
          description={f ? `${f.inducciones_realizadas} / ${f.ingresos_periodo} ingresos` : 'Sin datos'}
        />
      </div>

      {/* Barra comparativa programadas vs ejecutadas */}
      {f && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Programadas vs. Ejecutadas
          </h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24 text-right">Programadas</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                <div className="h-4 rounded-full bg-blue-400" style={{ width: '100%' }} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {f.programadas}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24 text-right">Ejecutadas</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className="h-4 rounded-full bg-green-500"
                  style={{ width: f.programadas > 0 ? `${(f.ejecutadas / f.programadas) * 100}%` : '0%' }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {f.ejecutadas}
                </span>
              </div>
            </div>
          </div>
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
