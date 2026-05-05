'use client'

import { useMemo, useRef, useEffect } from 'react'
import { getCategoriaColor, CATEGORIAS_CAP, calcularPct } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapCategoria, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

const HOY = new Date()
const HOY_STR = HOY.toISOString().split('T')[0]
const MES_ACTUAL_IDX = HOY.getMonth() // 0-based

const MESES_IDX = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

interface CatMesData {
  categoria: CapCategoria
  total: number
  ejecutadas: number
  vencidas: number
  pct: number
}

interface MesData {
  mes: string
  cats: CatMesData[]
  totalMes: number
  ejecutadasMes: number
}

interface Props {
  actividades: Actividad[]
  programaciones: Prog[]
  catFiltro: string
}

function BarraAnimada({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          el.style.width = `${pct}%`
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pct])

  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        ref={ref}
        className="h-2 rounded-full transition-all duration-700 ease-out"
        style={{ width: '0%', backgroundColor: color }}
      />
    </div>
  )
}

export function CronogramaTrimestral({ actividades, programaciones, catFiltro }: Props) {
  // Calcular el trimestre actual (0-based quarter index)
  const trimIdx = Math.floor(MES_ACTUAL_IDX / 3)
  const mesesTrimestre = [0, 1, 2].map(i => MESES_IDX[trimIdx * 3 + i]).filter(Boolean) as string[]

  const actMap = useMemo(() => {
    const m: Record<string, Actividad> = {}
    for (const a of actividades) m[a.id] = a
    return m
  }, [actividades])

  const mesesData: MesData[] = useMemo(() => {
    return mesesTrimestre.map(mes => {
      const progsMes = programaciones.filter(p => p.fields.mes === mes)
      const cats: CatMesData[] = CATEGORIAS_CAP
        .filter(c => !catFiltro || c === catFiltro)
        .map(cat => {
          const progs = progsMes.filter(p => {
            const act = actMap[p.fields.actividad_id]
            return act?.fields.categoria === cat
          })
          const ejecutadas = progs.filter(p => p.fields.estado === 'Ejecutado').length
          const vencidas = progs.filter(
            p => p.fields.estado === 'Programado' && !!p.fields.fecha_programada && p.fields.fecha_programada < HOY_STR
          ).length
          return {
            categoria: cat as CapCategoria,
            total: progs.length,
            ejecutadas,
            vencidas,
            pct: calcularPct(ejecutadas, progs.length),
          }
        })
        .filter(c => c.total > 0)

      const totalMes = progsMes.length
      const ejecutadasMes = progsMes.filter(p => p.fields.estado === 'Ejecutado').length
      return { mes, cats, totalMes, ejecutadasMes }
    })
  }, [programaciones, actMap, catFiltro, mesesTrimestre])

  // KPIs del trimestre
  const totalTri = mesesData.reduce((s, m) => s + m.totalMes, 0)
  const ejecutadasTri = mesesData.reduce((s, m) => s + m.ejecutadasMes, 0)
  const pctTri = calcularPct(ejecutadasTri, totalTri)

  return (
    <div className="flex flex-col gap-6">
      {/* KPI banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalTri}</p>
          <p className="text-xs text-blue-500 mt-0.5">Programadas</p>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-700">{ejecutadasTri}</p>
          <p className="text-xs text-green-500 mt-0.5">Ejecutadas</p>
        </div>
        <div className="rounded-xl border px-4 py-3 text-center"
          style={{
            backgroundColor: pctTri >= 80 ? '#f0fdf4' : pctTri >= 50 ? '#fffbeb' : '#fef2f2',
            borderColor: pctTri >= 80 ? '#86efac' : pctTri >= 50 ? '#fcd34d' : '#fca5a5',
          }}
        >
          <p className="text-2xl font-bold"
            style={{ color: pctTri >= 80 ? '#16a34a' : pctTri >= 50 ? '#d97706' : '#dc2626' }}
          >
            {pctTri}%
          </p>
          <p className="text-xs mt-0.5"
            style={{ color: pctTri >= 80 ? '#15803d' : pctTri >= 50 ? '#b45309' : '#b91c1c' }}
          >
            Cumplimiento
          </p>
        </div>
      </div>

      {/* 3 columnas — una por mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mesesData.map(({ mes, cats, totalMes, ejecutadasMes }) => {
          const pctMes = calcularPct(ejecutadasMes, totalMes)
          const esMesActual = mes === MESES_IDX[MES_ACTUAL_IDX]
          return (
            <div
              key={mes}
              className={`rounded-xl border p-4 flex flex-col gap-3 ${
                esMesActual ? 'border-blue-300 shadow-md' : 'border-gray-200'
              }`}
            >
              {/* Header mes */}
              <div className="flex items-center justify-between">
                <h3 className={`font-bold text-sm ${esMesActual ? 'text-blue-700' : 'text-gray-700'}`}>
                  {mes}
                  {esMesActual && (
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Actual</span>
                  )}
                </h3>
                <span className="text-xs font-bold" style={{
                  color: pctMes >= 80 ? '#16a34a' : pctMes >= 50 ? '#d97706' : '#dc2626'
                }}>
                  {pctMes}%
                </span>
              </div>

              {/* Barra global del mes */}
              <BarraAnimada
                pct={pctMes}
                color={pctMes >= 80 ? '#22C55E' : pctMes >= 50 ? '#F59E0B' : '#EF4444'}
              />

              <p className="text-xs text-gray-400">{ejecutadasMes}/{totalMes} actividades</p>

              {/* Por categoría */}
              <div className="flex flex-col gap-2 pt-1">
                {cats.map(c => {
                  const color = getCategoriaColor(c.categoria)
                  return (
                    <div key={c.categoria}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-semibold line-clamp-1" style={{ color }}>
                          {c.categoria.split(' ')[0]}…
                        </span>
                        <span className="text-[10px] text-gray-500">{c.ejecutadas}/{c.total}</span>
                      </div>
                      <BarraAnimada pct={c.pct} color={color} />
                      {c.vencidas > 0 && (
                        <p className="text-[10px] text-red-500 mt-0.5">{c.vencidas} vencida{c.vencidas > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
