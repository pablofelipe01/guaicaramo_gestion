'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { CATEGORIAS_CAP } from '@/lib/sst/cap-client'
import { CronogramaCelda } from './CronogramaCelda'
import { CronogramaSeparadorCategoria } from './CronogramaSeparadorCategoria'
import { CronogramaActionSheet } from './CronogramaActionSheet'
import type { CapActividadFields, CapCategoria, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

const MESES_IDX = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

const HOY = new Date()
const HOY_STR = HOY.toISOString().split('T')[0]

/** Fecha de inicio de cada semana en un mes dado (año fijo 2026) */
function fechasSemana(mes: string): string[] {
  const mesIdx = MESES_IDX.indexOf(mes as typeof MESES_IDX[number])
  if (mesIdx === -1) return ['S1', 'S2', 'S3', 'S4']
  const results: string[] = []
  for (let s = 0; s < 4; s++) {
    const d = new Date(2026, mesIdx, 1 + s * 7)
    results.push(d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }))
  }
  return results
}

function esSemanaCurrent(mes: string, semana: number): boolean {
  const mesIdx = MESES_IDX.indexOf(mes as typeof MESES_IDX[number])
  if (mesIdx === -1) return false
  const semanaInicio = new Date(2026, mesIdx, 1 + (semana - 1) * 7)
  const semanaFin = new Date(2026, mesIdx, 7 + (semana - 1) * 7)
  return HOY >= semanaInicio && HOY <= semanaFin
}

interface Props {
  actividades: Actividad[]
  programaciones: Prog[]
  filtroEstados: string[]
  catFiltro: string
  onUpdate: () => void
}

export function CronogramaMensual({ actividades, programaciones, filtroEstados, catFiltro, onUpdate }: Props) {
  const router = useRouter()
  const [mesIdx, setMesIdx] = useState(() => {
    const m = HOY.getMonth()
    return m < 12 ? m : 0
  })
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [actionProg, setActionProg] = useState<Prog | null>(null)
  const [actionAct, setActionAct] = useState<Actividad | null>(null)
  const [actionSheet, setActionSheet] = useState(false)

  const mes = MESES_IDX[mesIdx]
  const semanaHeaders = useMemo(() => fechasSemana(mes), [mes])

  // Índice prog por actividad+mes+semana
  const idx = useMemo(() => {
    const map: Record<string, Prog> = {}
    for (const p of programaciones) {
      map[`${p.fields.actividad_id}|${p.fields.mes}|${p.fields.semana}`] = p
    }
    return map
  }, [programaciones])

  // Filtro de estados aplicado
  const progDelMes = useMemo(() => programaciones.filter(p => p.fields.mes === mes), [programaciones, mes])

  function pasaFiltroEstado(prog: Prog | null): boolean {
    if (!prog || filtroEstados.length === 0) return true
    const esV = prog.fields.estado === 'Programado' && !!prog.fields.fecha_programada && prog.fields.fecha_programada < HOY_STR
    const estadoV = esV ? 'Vencido' : prog.fields.estado
    return filtroEstados.includes(estadoV)
  }

  const toggleCollapse = useCallback((cat: string) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }, [])

  function openAction(prog: Prog | null, actividad: Actividad) {
    setActionProg(prog)
    setActionAct(actividad)
    setActionSheet(true)
  }

  // Resumen semanal
  const resumenSemanal = useMemo(() => {
    return [1, 2, 3, 4].map(s => {
      const progs = progDelMes.filter(p => p.fields.semana === s)
      return {
        s,
        total: progs.length,
        ejecutadas: progs.filter(p => p.fields.estado === 'Ejecutado').length,
      }
    })
  }, [progDelMes])

  const catsFiltradas = catFiltro
    ? CATEGORIAS_CAP.filter(c => c === catFiltro)
    : CATEGORIAS_CAP

  return (
    <div className="flex flex-col gap-4">
      {/* Navegación mes */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMesIdx(prev => Math.max(0, prev - 1))}
          disabled={mesIdx === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-gray-900 flex items-center justify-center gap-2">
            {mes} 2026
            {mesIdx === HOY.getMonth() && (
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Mes actual" />
            )}
          </h2>
          <p className="text-xs text-gray-400">{progDelMes.length} programaciones este mes</p>
        </div>
        <button
          onClick={() => setMesIdx(prev => Math.min(11, prev + 1))}
          disabled={mesIdx === 11}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5 text-left text-gray-500 font-semibold sticky left-0 bg-gray-50 z-10 min-w-[220px] border-r border-gray-200">
                Actividad
              </th>
              {[1, 2, 3, 4].map(s => {
                const esCurrent = esSemanaCurrent(mes, s)
                return (
                  <th
                    key={s}
                    className={`px-2 py-2.5 text-center font-semibold border-l border-gray-200 min-w-[120px] ${
                      esCurrent ? 'text-blue-600 bg-blue-50/60' : 'text-gray-500'
                    }`}
                  >
                    <div>Semana {s}</div>
                    <div className="text-[10px] font-normal text-gray-400">{semanaHeaders[s - 1]}</div>
                    {esCurrent && (
                      <div className="mt-0.5 h-0.5 bg-blue-400 rounded-full mx-2" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {catsFiltradas.flatMap(cat => {
              const acts = actividades.filter(a => a.fields.categoria === cat)
              if (acts.length === 0) return []

              const isCollapsed = !!collapsed[cat]

              const rows = [
                <CronogramaSeparadorCategoria
                  key={`sep-${cat}`}
                  categoria={cat as CapCategoria}
                  count={acts.length}
                  collapsed={isCollapsed}
                  onToggle={() => toggleCollapse(cat)}
                />,
                ...(!isCollapsed ? acts.map((a, i) => {
                  const progsDeAct = [1, 2, 3, 4].map(s => idx[`${a.id}|${mes}|${s}`] ?? null)
                  const anyVisible = progsDeAct.some(p => pasaFiltroEstado(p))
                  if (filtroEstados.length > 0 && !anyVisible) return null
                  return (
                    <tr key={a.id} className={`group transition-colors ${i % 2 === 0 ? 'bg-white hover:bg-green-50/30' : 'bg-gray-50/40 hover:bg-green-50/30'}`}>
                      <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                        <button
                          onClick={() => router.push(`/dashboard/capacitaciones/${a.id}`)}
                          className="flex items-center gap-1.5 w-full text-left hover:underline"
                        >
                          <span className="text-gray-400 text-[10px] flex-shrink-0">#{a.fields.item_numero}</span>
                          <span className="text-gray-700 line-clamp-2 leading-tight">{a.fields.tema}</span>
                          {a.fields.requiere_certificacion && (
                            <span className="text-yellow-500 font-bold flex-shrink-0" title="Requiere certificación">*</span>
                          )}
                        </button>
                      </td>
                      {[1, 2, 3, 4].map(s => {
                        const prog = idx[`${a.id}|${mes}|${s}`] ?? null
                        const mostrar = pasaFiltroEstado(prog)
                        return (
                          <td key={s} className="p-1 border-l border-gray-100">
                            {mostrar ? (
                              <CronogramaCelda
                                prog={prog}
                                actividad={a}
                                semana={s}
                                mes={mes}
                                onAction={(p, act) => openAction(p, act)}
                                onSuccess={onUpdate}
                              />
                            ) : (
                              <div className="w-full h-9 rounded-md bg-gray-50" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                }).filter(Boolean) : []),
              ]
              return rows
            })}
          </tbody>
        </table>
      </div>

      {/* Resumen semanal */}
      <div className="grid grid-cols-4 gap-3">
        {resumenSemanal.map(r => {
          const pct = r.total > 0 ? Math.round((r.ejecutadas / r.total) * 100) : 0
          const esCurrent = esSemanaCurrent(mes, r.s)
          return (
            <div
              key={r.s}
              className={`rounded-xl border p-3 text-center transition-all ${
                esCurrent ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <p className={`text-xs font-semibold ${esCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                Semana {r.s}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-sm font-bold text-gray-700">{r.total}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">{r.ejecutadas}</span>
              </div>
              <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{pct}%</p>
            </div>
          )
        })}
      </div>

      {/* ActionSheet */}
      <CronogramaActionSheet
        open={actionSheet}
        prog={actionProg}
        actividad={actionAct}
        onClose={() => setActionSheet(false)}
        onSuccess={() => { setActionSheet(false); onUpdate() }}
      />
    </div>
  )
}
