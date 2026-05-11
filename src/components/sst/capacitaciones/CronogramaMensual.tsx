/**
 * @file CronogramaMensual.tsx
 * Vista mensual del cronograma: grilla de actividades (filas) x semanas del mes (columnas).
 * Cada celda es un `CronogramaCelda` que puede crear, editar o ejecutar una programación.
 * Permite navegar entre meses con los controles de paginación.
 */
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

/** Rango de fechas (inicio – fin) de cada semana en un mes dado (año fijo 2026) */
function fechasSemana(mes: string): string[] {
  const mesIdx = MESES_IDX.indexOf(mes as typeof MESES_IDX[number])
  if (mesIdx === -1) return ['S1', 'S2', 'S3', 'S4']
  const results: string[] = []
  // Último día del mes para no exceder en S4
  const ultimoDia = new Date(2026, mesIdx + 1, 0).getDate()
  for (let s = 0; s < 4; s++) {
    const inicioDia = 1 + s * 7
    const finDia = s === 3 ? ultimoDia : Math.min(inicioDia + 6, ultimoDia)
    const dIni = new Date(2026, mesIdx, inicioDia)
    const dFin = new Date(2026, mesIdx, finDia)
    const mesAbrev = dFin.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')
    results.push(`${dIni.getDate()} – ${dFin.getDate()} ${mesAbrev}`)
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
          className="p-2 rounded-lg disabled:opacity-30 transition-colors"
          style={{ color: 'var(--sst-dark-500)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold flex items-center justify-center gap-2" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>
            {mes} 2026
            {mesIdx === HOY.getMonth() && (
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--sst-green-500)' }} title="Mes actual" />
            )}
          </h2>
          <p className="text-xs font-medium" style={{ color: 'var(--sst-dark-700)' }}>{progDelMes.length} programaciones este mes</p>
        </div>
        <button
          onClick={() => setMesIdx(prev => Math.min(11, prev + 1))}
          disabled={mesIdx === 11}
          className="p-2 rounded-lg disabled:opacity-30 transition-colors"
          style={{ color: 'var(--sst-dark-500)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Resumen semanal — arriba para visión rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {resumenSemanal.map(r => {
          const pct = r.total > 0 ? Math.round((r.ejecutadas / r.total) * 100) : 0
          const esCurrent = esSemanaCurrent(mes, r.s)
          return (
            <div
              key={r.s}
              className="rounded-xl p-3 flex items-center gap-3 transition-all"
              style={{
                border: esCurrent ? '1.5px solid var(--sst-green-700)' : '1px solid var(--border)',
                background: esCurrent
                  ? 'linear-gradient(135deg, var(--sst-cumple-bg), rgba(255,255,255,0.6))'
                  : '#fff',
                boxShadow: esCurrent ? '0 4px 16px rgba(22,101,52,0.12)' : '0 1px 3px rgba(15,23,42,0.04)',
              }}
            >
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ background: esCurrent ? 'var(--sst-green-700)' : 'var(--sst-dark-100)' }}>
                <span className="text-[9px] font-semibold uppercase" style={{ color: esCurrent ? 'rgba(255,255,255,0.85)' : 'var(--sst-dark-500)' }}>Sem</span>
                <span className="text-sm font-bold leading-none" style={{ color: esCurrent ? '#fff' : 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>{r.s}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>{r.ejecutadas}</span>
                  <span className="text-xs" style={{ color: 'var(--sst-dark-500)' }}>/ {r.total}</span>
                  <span className="ml-auto text-[11px] font-bold" style={{ color: pct >= 80 ? 'var(--sst-cumple)' : pct >= 50 ? 'var(--sst-riesgo)' : 'var(--sst-critico)' }}>{pct}%</span>
                </div>
                <div className="mt-1 w-full rounded-full h-1" style={{ background: 'var(--sst-dark-200)' }}>
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 80 ? 'var(--sst-green-500)' : pct >= 50 ? 'var(--sst-riesgo)' : 'var(--sst-critico)',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: 'var(--sst-green-700)', borderBottom: '1px solid var(--border)' }}>
              <th
                className="px-3 sm:px-4 py-3 text-left font-semibold sticky left-0 z-10 min-w-[140px] sm:min-w-[220px] md:min-w-[260px]"
                style={{ color: '#fff', background: 'var(--sst-green-700)', borderRight: '1px solid rgba(255,255,255,0.2)' }}
              >
                <span className="text-[10px] uppercase tracking-wider">Actividad</span>
              </th>
              {[1, 2, 3, 4].map(s => {
                const esCurrent = esSemanaCurrent(mes, s)
                return (
                  <th
                    key={s}
                    className="px-1 sm:px-2 py-3 text-center font-semibold min-w-[80px] sm:min-w-[110px] md:min-w-[140px]"
                    style={{
                      color: '#fff',
                      background: 'var(--sst-green-700)',
                      borderLeft: '1px solid rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-poppins)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs sm:hidden">S{s}</span>
                      <span className="text-xs hidden sm:inline">Semana {s}</span>
                    </div>
                    <div className="text-[10px] font-medium mt-0.5 hidden sm:block" style={{ color: 'rgba(255,255,255,0.85)' }}>{semanaHeaders[s - 1]}</div>
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
                    <tr key={a.id} className="group transition-all duration-150" style={{ background: i % 2 !== 0 ? 'var(--sst-dark-100)' : '#fff' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--sst-cumple-bg)'
                        const firstTd = e.currentTarget.querySelector('td')
                        if (firstTd) firstTd.style.borderLeft = '3px solid #22C55E'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = i % 2 !== 0 ? 'var(--sst-dark-100)' : '#fff'
                        const firstTd = e.currentTarget.querySelector('td')
                        if (firstTd) firstTd.style.borderLeft = ''
                      }}
                    >
                      <td className="px-3 sm:px-4 py-3 sticky left-0 z-10 border-r" style={{ borderColor: 'var(--border)', background: 'inherit' }}>
                        <button
                          onClick={() => router.push(`/dashboard/capacitaciones/${a.id}`)}
                          className="flex items-start gap-2 w-full text-left transition-colors"
                          onMouseEnter={e => { const span = e.currentTarget.querySelectorAll('span')[1]; if (span) (span as HTMLElement).style.color = 'var(--sst-green-700)' }}
                          onMouseLeave={e => { const span = e.currentTarget.querySelectorAll('span')[1]; if (span) (span as HTMLElement).style.color = 'var(--sst-dark-700)' }}
                        >
                          <span className="text-[10px] font-semibold flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded hidden sm:inline" style={{ color: 'var(--sst-dark-500)', background: 'var(--sst-dark-100)' }}>#{a.fields.item_numero}</span>
                          <div className="flex-1 min-w-0">
                            <span className="line-clamp-2 leading-snug font-medium transition-colors block" style={{ color: 'var(--sst-dark-700)' }}>{a.fields.tema}</span>
                            {a.fields.responsable && (
                              <span className="text-[10px] block mt-0.5 truncate hidden sm:block" style={{ color: 'var(--sst-dark-500)' }}>{a.fields.responsable}</span>
                            )}
                          </div>
                          {a.fields.requiere_certificacion && (
                            <span className="font-bold flex-shrink-0" style={{ color: 'var(--sst-riesgo)' }} title="Requiere certificación">*</span>
                          )}
                        </button>
                      </td>
                      {[1, 2, 3, 4].map(s => {
                        const prog = idx[`${a.id}|${mes}|${s}`] ?? null
                        const mostrar = pasaFiltroEstado(prog)
                        return (
                          <td key={s} className="p-1 sm:p-2" style={{ borderLeft: '1px solid var(--sst-dark-100)' }}>
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
                              <div className="w-full h-9 rounded-md" style={{ background: 'var(--sst-dark-100)' }} />
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
