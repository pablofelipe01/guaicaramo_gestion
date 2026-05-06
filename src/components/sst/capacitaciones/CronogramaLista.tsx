/**
 * @file CronogramaLista.tsx
 * Vista de lista del cronograma, ordenada por fecha programada.
 * Muestra tarjetas de sesión con estado, actividad relacionada y acciones rápidas.
 * Al hacer clic en una sesión, abre el `CronogramaActionSheet` para gestionarla.
 */
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, User, Users, Clock, CheckCircle2, AlertCircle, RotateCcw, XCircle } from 'lucide-react'
import { getCategoriaColor } from '@/lib/sst/cap-client'
import { CronogramaActionSheet } from './CronogramaActionSheet'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

const HOY = new Date()
const HOY_STR = HOY.toISOString().split('T')[0]

/** Parsea "YYYY-MM-DD" como medianoche local (evita desplazamiento UTC→local) */
function parseFechaLocal(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Diferencia en días enteros entre una fecha y hoy (positivo = futuro) */
function diasDesde(fecha: string): number {
  const hoyLocal = new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate())
  return Math.round((parseFechaLocal(fecha).getTime() - hoyLocal.getTime()) / (1000 * 60 * 60 * 24))
}

function semanaRelativa(fecha: string): string {
  const diff = diasDesde(fecha)
  if (diff < 0) return 'VENCIDO'
  if (diff === 0) return 'HOY'
  if (diff === 1) return 'MAÑANA'
  if (diff <= 7) return 'ESTA SEMANA'
  if (diff <= 14) return 'PRÓXIMA SEMANA'
  const d = parseFechaLocal(fecha)
  const mes = d.toLocaleDateString('es-CO', { month: 'long' }).toUpperCase()
  return mes
}

const GRUPO_ORDEN = ['HOY', 'MAÑANA', 'ESTA SEMANA', 'PRÓXIMA SEMANA']

const ESTADO_CONFIG: Record<string, { color: string; Icon: React.FC<{ className?: string }> }> = {
  Ejecutado: { color: '#22C55E', Icon: CheckCircle2 },
  Programado: { color: '#3B82F6', Icon: Clock },
  Vencido: { color: '#EF4444', Icon: AlertCircle },
  Reprogramado: { color: '#F59E0B', Icon: RotateCcw },
  Cancelado: { color: '#DC3545', Icon: XCircle },
}

interface ItemLista {
  prog: Prog
  actividad: Actividad
  estadoVisual: string
  grupo: string
}

interface Props {
  actividades: Actividad[]
  programaciones: Prog[]
  filtroEstados: string[]
  catFiltro: string
  onUpdate: () => void
}

export function CronogramaLista({ actividades, programaciones, filtroEstados, catFiltro, onUpdate }: Props) {
  const router = useRouter()
  const [actionProg, setActionProg] = useState<Prog | null>(null)
  const [actionAct, setActionAct] = useState<Actividad | null>(null)
  const [actionSheet, setActionSheet] = useState(false)

  const actMap = useMemo(() => {
    const m: Record<string, Actividad> = {}
    for (const a of actividades) m[a.id] = a
    return m
  }, [actividades])

  const items: ItemLista[] = useMemo(() => {
    return programaciones
      .filter(p => {
        const act = actMap[p.fields.actividad_id]
        if (!act) return false
        if (catFiltro && act.fields.categoria !== catFiltro) return false
        return true
      })
      .map(p => {
        const act = actMap[p.fields.actividad_id]
        const esV = p.fields.estado === 'Programado' && !!p.fields.fecha_programada && p.fields.fecha_programada < HOY_STR
        const estadoVisual = esV ? 'Vencido' : p.fields.estado
        const grupo = p.fields.fecha_programada ? semanaRelativa(p.fields.fecha_programada) : 'Sin fecha'
        return { prog: p, actividad: act, estadoVisual, grupo }
      })
      .filter(item => filtroEstados.length === 0 || filtroEstados.includes(item.estadoVisual))
      .sort((a, b) => {
        const fa = a.prog.fields.fecha_programada ?? '9999'
        const fb = b.prog.fields.fecha_programada ?? '9999'
        return fa.localeCompare(fb)
      })
  }, [programaciones, actMap, catFiltro, filtroEstados])

  // Agrupar
  const grupos = useMemo(() => {
    const m: Record<string, ItemLista[]> = {}
    for (const item of items) {
      if (!m[item.grupo]) m[item.grupo] = []
      m[item.grupo].push(item)
    }
    // Ordenar grupos: primeros los conocidos, luego meses
    const known = GRUPO_ORDEN.filter(g => m[g])
    const meses = Object.keys(m).filter(g => !GRUPO_ORDEN.includes(g) && g !== 'VENCIDO' && g !== 'Sin fecha')
    const vencidos = m['VENCIDO'] ? ['VENCIDO'] : []
    const sinFecha = m['Sin fecha'] ? ['Sin fecha'] : []
    return [...vencidos, ...known, ...meses, ...sinFecha].map(g => ({ grupo: g, items: m[g] }))
  }, [items])

  function openAction(prog: Prog, actividad: Actividad) {
    setActionProg(prog)
    setActionAct(actividad)
    setActionSheet(true)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--sst-dark-300)' }} />
        <p className="text-sm" style={{ color: 'var(--sst-dark-500)' }}>No hay programaciones con los filtros seleccionados</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {grupos.map(({ grupo, items: gItems }) => (
        <div key={grupo}>
          {/* Encabezado de grupo */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: grupo === 'VENCIDO' ? 'var(--sst-critico-bg)' :
                  grupo === 'HOY' || grupo === 'MAÑANA' ? 'rgba(59,130,246,0.1)' :
                  grupo === 'ESTA SEMANA' ? 'rgba(59,130,246,0.06)' :
                  'var(--sst-dark-100)',
                color: grupo === 'VENCIDO' ? 'var(--sst-critico)' :
                  grupo === 'HOY' || grupo === 'MAÑANA' || grupo === 'ESTA SEMANA' ? 'var(--phase-planear)' :
                  'var(--sst-dark-700)',
              }}
            >
              {grupo}
            </span>
            <span className="text-xs" style={{ color: 'var(--sst-dark-500)' }}>{gItems.length} actividades</span>
            <div className="flex-1 h-px" style={{ background: 'var(--sst-dark-200)' }} />
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-2">
            {gItems.map(({ prog, actividad, estadoVisual }) => {
              const catColor = getCategoriaColor(actividad.fields.categoria)
              const cfg = ESTADO_CONFIG[estadoVisual] ?? ESTADO_CONFIG['Programado']
              const diff = prog.fields.fecha_programada ? diasDesde(prog.fields.fecha_programada) : null

              return (
                <div
                  key={prog.id}
                  className="rounded-xl bg-white hover:shadow-md transition-all duration-150 overflow-hidden"
                  style={{ border: '1px solid var(--border)', borderLeft: `3px solid ${catColor}` }}
                >
                  <div className="px-4 py-3 flex items-start gap-3">
                    {/* Estado icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${cfg.color}15` }}
                    >
                      <span style={{ color: cfg.color }}><cfg.Icon className="w-4 h-4" /></span>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: catColor }}>
                            {actividad.fields.categoria}
                          </p>
                          <button
                            onClick={() => router.push(`/dashboard/capacitaciones/${actividad.id}`)}
                            className="text-sm font-semibold line-clamp-2 hover:underline text-left"
                            style={{ color: 'var(--sst-dark-800)' }}
                          >
                            {actividad.fields.tema}
                          </button>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                        >
                          {estadoVisual}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--sst-dark-500)' }}>
                        {prog.fields.fecha_programada && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {prog.fields.fecha_programada}
                            {diff !== null && diff >= 0 && diff <= 14 && (
                              <span className="font-medium" style={{ color: 'var(--phase-planear)' }}>
                                {diff === 0 ? '(hoy)' : `(en ${diff}d)`}
                              </span>
                            )}
                          </span>
                        )}
                        {actividad.fields.responsable && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {actividad.fields.responsable}
                          </span>
                        )}
                        {actividad.fields.dirigido_a && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {actividad.fields.dirigido_a}
                          </span>
                        )}
                        <span className="text-gray-400">{prog.fields.mes} S{prog.fields.semana}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                      <button
                        onClick={() => openAction(prog, actividad)}
                        className="btn btn-secondary text-xs px-3 py-1.5"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/capacitaciones/${actividad.id}`)}
                        className="btn btn-ghost text-xs px-3 py-1.5"
                        style={{ color: 'var(--phase-planear)' }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

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
