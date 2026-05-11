/**
 * @file TimelineActividad.tsx
 * Timeline vertical de los registros de ejecución de una actividad.
 * Muestra cada sesión ejecutada con fecha, duración, facilitador y métricas.
 * Permite eliminar un registro (solo coordinador SST / admin) con confirmación.
 */
'use client'

import { useState } from 'react'
import type { CapRegistroFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { CheckCircle2, Clock, Users, MapPin, FileText, Trash2, BookOpen, Award } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { calcularPct } from '@/lib/sst/cap-client'

type Registro = AirtableRecord<CapRegistroFields>

interface Props {
  registros: Registro[]
  emptyText?: string
  onDelete?: (id: string) => Promise<void>
}

function CoberturaChip({ presentes, convocados }: { presentes: number; convocados: number }) {
  if (!convocados) return null
  const pct = calcularPct(presentes, convocados)
  let bg = 'rgba(40,167,69,0.10)'
  let color = '#166534'
  let border = 'rgba(40,167,69,0.30)'
  if (pct < 60) { bg = 'rgba(220,53,69,0.10)'; color = '#7F1D1D'; border = 'rgba(220,53,69,0.30)' }
  else if (pct < 80) { bg = 'rgba(255,140,66,0.10)'; color = '#7C2D12'; border = 'rgba(255,140,66,0.30)' }

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      <Users className="w-3 h-3" />
      {presentes}/{convocados} · {pct}%
    </span>
  )
}

function EvalChip({ aprobadas, realizadas }: { aprobadas: number; realizadas: number }) {
  if (!realizadas) return null
  const pct = calcularPct(aprobadas, realizadas)
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(44,95,141,0.10)', color: '#1E3A5F', border: '1px solid rgba(44,95,141,0.25)' }}
    >
      <Award className="w-3 h-3" />
      {aprobadas}/{realizadas} aprobados
    </span>
  )
}

function formatFecha(iso: string): { dia: string; mes: string; anio: string } {
  const d = new Date(iso + 'T00:00:00')
  return {
    dia: d.toLocaleDateString('es-CO', { day: '2-digit' }),
    mes: d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
    anio: d.toLocaleDateString('es-CO', { year: 'numeric' }),
  }
}

export function TimelineActividad({ registros, emptyText = 'No hay registros de ejecución aún.', onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sorted = [...registros].sort((a, b) => {
    const fa = a.fields.fecha_ejecucion ?? ''
    const fb = b.fields.fecha_ejecucion ?? ''
    return fa.localeCompare(fb)
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(40,167,69,0.08)' }}>
          <FileText className="w-5 h-5" style={{ color: '#28A745', opacity: 0.5 }} />
        </div>
        <p className="text-sm text-gray-400 text-center max-w-xs">{emptyText}</p>
      </div>
    )
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {sorted.map((r, idx) => {
          const f = r.fields
          const presentes = f.presentes ?? 0
          const convocados = f.convocados ?? 0
          const aprobadas = f.evaluaciones_aprobadas ?? 0
          const realizadas = f.evaluaciones_realizadas ?? 0
          const fecha = f.fecha_ejecucion ? formatFecha(f.fecha_ejecucion) : null
          const isLast = idx === sorted.length - 1

          return (
            <li key={r.id} className="flex gap-3">
              {/* Fecha lateral */}
              <div className="flex flex-col items-center shrink-0 w-12">
                {fecha ? (
                  <div
                    className="w-12 rounded-xl flex flex-col items-center justify-center py-2 text-center"
                    style={{ background: 'rgba(40,167,69,0.08)', border: '1px solid rgba(40,167,69,0.18)' }}
                  >
                    <span className="text-xs font-black leading-none" style={{ color: '#166534' }}>{fecha.dia}</span>
                    <span className="text-[10px] font-semibold uppercase leading-tight mt-0.5" style={{ color: '#16a34a' }}>{fecha.mes}</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#4ade80' }}>{fecha.anio}</span>
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(40,167,69,0.08)', border: '1px solid rgba(40,167,69,0.18)' }}
                  >
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#28A745' }} />
                  </div>
                )}
                {/* Conector vertical */}
                {!isLast && (
                  <div className="w-px flex-1 mt-2 mb-0" style={{ background: 'rgba(40,167,69,0.15)', minHeight: 16 }} />
                )}
              </div>

              {/* Tarjeta de sesión */}
              <div
                className="flex-1 min-w-0 rounded-xl border bg-white transition-shadow hover:shadow-md mb-3"
                style={{ borderColor: 'var(--border)' }}
              >
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(40,167,69,0.12)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#28A745' }} />
                    </div>
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--sst-dark-800)' }}>
                      {f.lugar ?? 'Sesión ejecutada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {f.duracion_horas != null && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--sst-dark-100)', color: 'var(--sst-dark-600)' }}
                      >
                        <Clock className="w-3 h-3" />
                        {f.duracion_horas}h
                      </span>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setConfirmId(r.id)}
                        className="p-1 rounded-md transition-colors"
                        style={{ color: 'var(--sst-dark-300)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#DC3545'; e.currentTarget.style.background = 'rgba(220,53,69,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--sst-dark-300)'; e.currentTarget.style.background = '' }}
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Facilitador */}
                {f.facilitador && (
                  <div className="px-4 pb-2">
                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--sst-dark-500)' }}>
                      <BookOpen className="w-3 h-3" />
                      {f.facilitador}
                    </span>
                  </div>
                )}

                {/* Pills de métricas */}
                {(convocados > 0 || realizadas > 0) && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                    <CoberturaChip presentes={presentes} convocados={convocados} />
                    <EvalChip aprobadas={aprobadas} realizadas={realizadas} />
                  </div>
                )}

                {/* Observaciones */}
                {f.observaciones && (
                  <div
                    className="mx-3 mb-3 px-3 py-2 rounded-lg text-xs italic"
                    style={{ background: 'var(--sst-dark-50, #f8fafc)', border: '1px solid var(--border)', color: 'var(--sst-dark-500)' }}
                  >
                    <MapPin className="w-3 h-3 inline mr-1 opacity-50" />
                    {f.observaciones}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {onDelete && (
        <ConfirmModal
          open={!!confirmId}
          title="Eliminar registro de ejecución"
          description="Se eliminará este registro de ejecución. Esta acción no se puede deshacer."
          confirmLabel="Eliminar registro"
          loading={deleting}
          onCancel={() => setConfirmId(null)}
          onConfirm={async () => {
            if (!confirmId) return
            setDeleting(true)
            await onDelete(confirmId)
            setDeleting(false)
            setConfirmId(null)
          }}
        />
      )}
    </>
  )
}

