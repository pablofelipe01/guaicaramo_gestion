'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EstadoGantt = 'completado' | 'en_progreso' | 'pendiente' | 'vencido'

export interface SubtareaGantt {
  nombre: string
  responsable: string
  estado: EstadoGantt
  semanas: boolean[] // 12 booleans
}

export interface ActividadGantt {
  id: string
  nombre: string
  responsable: string
  estado: EstadoGantt
  semanas: boolean[] // 12 booleans, índice 0 = semana 1
  subtareas?: SubtareaGantt[]
}

export interface CronogramaGanttProps {
  actividades: ActividadGantt[]
  /** Nombres de los 3 meses que agrupan las 12 semanas (4 semanas cada uno) */
  meses?: [string, string, string]
  /** Semana actualmente en curso, 1–12. Se resalta con subrayado azul. */
  semanaActual?: number
  /** Título opcional para el encabezado de nombre de actividad */
  etiquetaNombre?: string
}

// ─── Paleta de estados ────────────────────────────────────────────────────────

interface EstadoCfg {
  cellBg: string
  accent: string
  label: string
}

const ESTADO_CFG = {
  completado:  { cellBg: '#D4EDDA', accent: '#28A745', label: 'Completado'  },
  en_progreso: { cellBg: '#D0E4F5', accent: '#2C5F8D', label: 'En progreso' },
  pendiente:   { cellBg: '#F1F3F4', accent: '#6C757D', label: 'Pendiente'   },
  vencido:     { cellBg: '#F8D7DA', accent: '#DC3545', label: 'Vencido'     },
} satisfies Record<EstadoGantt, EstadoCfg>

// ─── Constantes de layout ─────────────────────────────────────────────────────

const COL_TEMPLATE = 'minmax(220px, 2fr) repeat(12, minmax(50px, 1fr))'
const SEMANAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const MESES_DEFAULT: [string, string, string] = ['Enero', 'Febrero', 'Marzo']

/** Calcula la semana del trimestre actual (1-12) basado en la fecha. */
function calcSemanaActual(): number {
  const now = new Date()
  const diaDelAnio = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000,
  )
  // Semana global del año → mapear a 1-12 dentro del trimestre activo
  const semanaAnio = Math.floor(diaDelAnio / 7) + 1
  const trimestreOffset = Math.floor((now.getMonth() / 3)) * 13
  return Math.min(Math.max(semanaAnio - trimestreOffset, 1), 12)
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CronogramaGantt({
  actividades,
  meses = MESES_DEFAULT,
  semanaActual = calcSemanaActual(),
  etiquetaNombre = 'Actividad / Responsable',
}: CronogramaGanttProps) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [hovered, setHovered] = useState<string | null>(null)

  const toggle = (id: string) =>
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-3">

      {/* ── Leyenda de estados ────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(ESTADO_CFG) as [EstadoGantt, EstadoCfg][]).map(([estado, cfg]) => (
          <span
            key={estado}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              background: cfg.cellBg,
              color: cfg.accent,
              border: `1px solid ${cfg.accent}33`,
            }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.accent }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* ── Cronograma ────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-x-auto"
        style={{
          borderColor: 'var(--sst-dark-200)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/*
          Grid plano de 13 columnas: [nombre] + [12 semanas]
          Cada fila (actividad, subtarea, encabezado) es un conjunto de 13 celdas consecutivas.
          Las subtareas se agrupan en un motion.div con gridColumn 1/-1 que crea un
          sub-grid con la misma plantilla de columnas.
        */}
        <div
          className="min-w-[800px]"
          style={{ display: 'grid', gridTemplateColumns: COL_TEMPLATE }}
        >

          {/* ════════════════════════════════════════════════════
              FILA DE ENCABEZADO 1 — Meses (span de 4 cols c/u)
          ════════════════════════════════════════════════════ */}
          <div
            className="sticky left-0 z-20 border-b border-r"
            style={{
              background: 'var(--sst-dark-100)',
              borderColor: 'var(--sst-dark-200)',
            }}
          />
          {meses.map((mes, mi) => (
            <div
              key={mes}
              className="text-center border-b border-r py-2 text-[11px] font-bold uppercase"
              style={{
                gridColumn: `${mi * 4 + 2} / span 4`,
                background: 'var(--sst-dark-100)',
                borderColor: 'var(--sst-dark-200)',
                color: 'var(--sst-dark-700)',
                letterSpacing: '0.07em',
              }}
            >
              {mes}
            </div>
          ))}

          {/* ════════════════════════════════════════════════════
              FILA DE ENCABEZADO 2 — Semanas S1–S12
          ════════════════════════════════════════════════════ */}
          <div
            className="sticky left-0 z-20 border-b border-r px-3 py-2 text-[11px] font-semibold"
            style={{
              background: 'var(--sst-dark-100)',
              borderColor: 'var(--sst-dark-200)',
              color: 'var(--sst-dark-500)',
            }}
          >
            {etiquetaNombre}
          </div>
          {SEMANAS.map(s => {
            const esCurrent = s === semanaActual
            return (
              <div
                key={`wh-${s}`}
                className="text-center border-b border-r py-2 text-[11px]"
                style={{
                  background: 'var(--sst-dark-100)',
                  borderColor: 'var(--sst-dark-200)',
                  color: esCurrent ? '#2C5F8D' : 'var(--sst-dark-500)',
                  fontWeight: esCurrent ? 700 : 400,
                  boxShadow: esCurrent ? 'inset 0 -2px 0 #2C5F8D' : undefined,
                }}
              >
                S{s}
              </div>
            )
          })}

          {/* ════════════════════════════════════════════════════
              FILAS DE ACTIVIDADES
          ════════════════════════════════════════════════════ */}
          {actividades.map(act => {
            const cfg = ESTADO_CFG[act.estado]
            const isExpanded = expandidos.has(act.id)
            const hasSubs = (act.subtareas?.length ?? 0) > 0
            const isHovered = hovered === act.id

            return (
              <>
                {/* ── Celda de nombre (sticky) ── */}
                <div
                  key={`name-${act.id}`}
                  className="sticky left-0 z-10 flex items-center gap-2 px-3 border-b border-r"
                  style={{
                    minHeight: '40px',
                    background: isHovered ? '#F0F4FF' : 'white',
                    borderLeft: `3px solid ${cfg.accent}`,
                    borderColor: 'var(--sst-dark-200)',
                    cursor: hasSubs ? 'pointer' : 'default',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={() => setHovered(act.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => hasSubs && toggle(act.id)}
                  role={hasSubs ? 'button' : undefined}
                  aria-expanded={hasSubs ? isExpanded : undefined}
                >
                  {hasSubs ? (
                    <span style={{ color: cfg.accent, flexShrink: 0 }}>
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  ) : (
                    <span className="w-3.5 flex-shrink-0" aria-hidden />
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-[11px] leading-tight truncate"
                      style={{ fontWeight: 600, color: 'var(--sst-dark-900)' }}
                    >
                      {act.nombre}
                    </span>
                    <span
                      className="text-[10px] leading-tight truncate mt-0.5"
                      style={{ color: 'var(--sst-dark-500)' }}
                    >
                      {act.responsable}
                    </span>
                  </div>
                </div>

                {/* ── Celdas de semana ── */}
                {SEMANAS.map(s => (
                  <div
                    key={`cell-${act.id}-${s}`}
                    className="border-b border-r flex items-center justify-center"
                    style={{
                      minHeight: '40px',
                      background: isHovered
                        ? '#F0F4FF'
                        : (act.semanas[s - 1] ?? false) ? cfg.cellBg : 'white',
                      borderColor: 'var(--sst-dark-200)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={() => setHovered(act.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {(act.semanas[s - 1] ?? false) && (
                      <span
                        style={{
                          display: 'block',
                          width: '65%',
                          height: '4px',
                          borderRadius: '2px',
                          background: cfg.accent,
                          opacity: isHovered ? 0.95 : 0.72,
                          transition: 'opacity var(--transition-fast)',
                        }}
                      />
                    )}
                  </div>
                ))}

                {/* ── Subtareas animadas ── */}
                <AnimatePresence>
                  {isExpanded && hasSubs && (
                    <motion.div
                      key={`subs-${act.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{
                        gridColumn: '1 / -1',
                        overflow: 'hidden',
                        display: 'grid',
                        gridTemplateColumns: COL_TEMPLATE,
                      }}
                    >
                      {act.subtareas!.map((sub, si) => {
                        const subCfg = ESTADO_CFG[sub.estado] ?? ESTADO_CFG.pendiente
                        const subId = `${act.id}-sub-${si}`
                        const isSubHovered = hovered === subId

                        return (
                          <>
                            {/* Sub celda de nombre */}
                            <div
                              key={`sn-${subId}`}
                              className="flex items-center border-b border-r"
                              style={{
                                minHeight: '32px',
                                paddingLeft: '2.5rem',
                                paddingRight: '0.75rem',
                                background: isSubHovered ? '#F0F4FF' : '#FAFAFA',
                                borderColor: 'var(--sst-dark-200)',
                                transition: 'background var(--transition-fast)',
                              }}
                              onMouseEnter={() => setHovered(subId)}
                              onMouseLeave={() => setHovered(null)}
                            >
                              <span
                                className="mr-1.5 select-none flex-shrink-0"
                                style={{ fontSize: '11px', color: 'var(--sst-dark-300)', lineHeight: 1 }}
                                aria-hidden
                              >
                                └
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="text-[10px] leading-tight truncate"
                                  style={{ fontWeight: 400, color: 'var(--sst-dark-700)' }}
                                >
                                  {sub.nombre}
                                </span>
                                <span
                                  className="text-[9px] leading-tight truncate"
                                  style={{ color: 'var(--sst-dark-500)' }}
                                >
                                  {sub.responsable}
                                </span>
                              </div>
                            </div>

                            {/* Sub celdas de semana */}
                            {SEMANAS.map(s => (
                              <div
                                key={`sc-${subId}-${s}`}
                                className="border-b border-r flex items-center justify-center"
                                style={{
                                  minHeight: '32px',
                                  background: isSubHovered
                                    ? '#F0F4FF'
                                    : (sub.semanas[s - 1] ?? false) ? subCfg.cellBg : '#FAFAFA',
                                  borderColor: 'var(--sst-dark-200)',
                                  transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={() => setHovered(subId)}
                                onMouseLeave={() => setHovered(null)}
                              >
                                {(sub.semanas[s - 1] ?? false) && (
                                  <span
                                    style={{
                                      display: 'block',
                                      width: '55%',
                                      height: '3px',
                                      borderRadius: '1.5px',
                                      background: subCfg.accent,
                                      opacity: 0.6,
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )
          })}

        </div>
      </div>
    </div>
  )
}
