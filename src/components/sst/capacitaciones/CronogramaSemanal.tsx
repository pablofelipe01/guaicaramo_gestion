'use client'

import { useMemo } from 'react'
import { getCategoriaColor, MESES_CAP, CATEGORIAS_CAP } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

interface Props {
  actividades: Actividad[]
  programaciones: Prog[]
  categoriaFiltro?: string
}

const HOY = new Date().toISOString().split('T')[0]

function cellColor(estado: Prog['fields']['estado'], fechaProg?: string): string {
  if (estado === 'Ejecutado')    return 'bg-green-500'
  if (estado === 'Cancelado')    return 'bg-gray-300'
  if (estado === 'Reprogramado') return 'bg-yellow-400'
  // Programado: verificar si está vencido
  if (fechaProg && fechaProg < HOY) return 'bg-red-400'
  return 'bg-blue-400'
}

export function CronogramaSemanal({ actividades, programaciones, categoriaFiltro }: Props) {
  // Construir índice: actividadId + mes + semana → programacion
  const idx = useMemo(() => {
    const map: Record<string, Prog> = {}
    for (const p of programaciones) {
      const key = `${p.fields.actividad_id}|${p.fields.mes}|${p.fields.semana}`
      map[key] = p
    }
    return map
  }, [programaciones])

  const actsFiltradas = useMemo(() =>
    categoriaFiltro
      ? actividades.filter(a => a.fields.categoria === categoriaFiltro)
      : actividades,
    [actividades, categoriaFiltro]
  )

  // Resumen mensual
  const resumenMensual = useMemo(() => {
    return MESES_CAP.map(mes => {
      const delMes = programaciones.filter(p => p.fields.mes === mes)
      return {
        mes,
        programadas: delMes.length,
        ejecutadas:  delMes.filter(p => p.fields.estado === 'Ejecutado').length,
      }
    })
  }, [programaciones])

  return (
    <div className="flex flex-col gap-4">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: 'bg-blue-400',   label: 'Programado' },
          { color: 'bg-green-500',  label: 'Ejecutado' },
          { color: 'bg-red-400',    label: 'Vencido' },
          { color: 'bg-yellow-400', label: 'Reprogramado' },
          { color: 'bg-gray-300',   label: 'Cancelado' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-gray-500 font-semibold border-b border-gray-200 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                Actividad
              </th>
              {MESES_CAP.map(mes => (
                <th
                  key={mes}
                  colSpan={4}
                  className="px-1 py-2 text-center text-gray-500 font-semibold border-b border-l border-gray-200 min-w-[80px]"
                >
                  {mes.slice(0, 3)}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50/60">
              <th className="sticky left-0 bg-gray-50/60 z-10 border-b border-gray-200" />
              {MESES_CAP.flatMap(mes =>
                [1, 2, 3, 4].map(s => (
                  <th key={`${mes}-${s}`} className="px-1 py-1 text-center text-gray-400 border-b border-l border-gray-100 font-normal">
                    S{s}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {CATEGORIAS_CAP
              .filter(cat => !categoriaFiltro || cat === categoriaFiltro)
              .flatMap(cat => {
                const acts = actsFiltradas.filter(a => a.fields.categoria === cat)
                if (acts.length === 0) return []
                return [
                  // Fila de categoría
                  <tr key={`cat-${cat}`} className="bg-gray-100">
                    <td
                      colSpan={MESES_CAP.length * 4 + 1}
                      className="px-3 py-1.5 font-bold text-xs sticky left-0 bg-gray-100"
                      style={{ color: getCategoriaColor(cat) }}
                    >
                      {cat}
                    </td>
                  </tr>,
                  // Filas de actividades
                  ...acts.map((a, i) => (
                    <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                      <td className="px-3 py-1.5 text-gray-700 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                        <span className="text-gray-400 mr-1">#{a.fields.item_numero}</span>
                        <span className="line-clamp-1">{a.fields.tema}</span>
                      </td>
                      {MESES_CAP.flatMap(mes =>
                        [1, 2, 3, 4].map(s => {
                          const prog = idx[`${a.id}|${mes}|${s}`]
                          return (
                            <td key={`${mes}-${s}`} className="border-l border-gray-100 p-0.5 text-center">
                              {prog ? (
                                <span
                                  className={`inline-block w-full h-4 rounded ${cellColor(prog.fields.estado, prog.fields.fecha_programada)}`}
                                  title={`${prog.fields.estado} — ${prog.fields.fecha_programada ?? ''}`}
                                />
                              ) : null}
                            </td>
                          )
                        })
                      )}
                    </tr>
                  )),
                ]
              })
            }
          </tbody>
          {/* Resumen mensual */}
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-3 py-1.5 text-gray-500 font-semibold sticky left-0 bg-gray-50 z-10">
                Prog. / Ejec.
              </td>
              {resumenMensual.flatMap(r =>
                [0, 1, 2, 3].map(i => (
                  <td key={`sum-${r.mes}-${i}`} className="border-l border-gray-200 text-center">
                    {i === 1 ? (
                      <span className="text-[10px] font-bold text-gray-600">
                        {r.programadas}/{r.ejecutadas}
                      </span>
                    ) : null}
                  </td>
                ))
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
