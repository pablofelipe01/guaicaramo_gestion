'use client'

import { CheckCircle, FileText, Lock, Users } from 'lucide-react'
import { CAP_COLORS, ALERTA_COLOR } from '@/lib/sst/cap-client'
import type { AlertaCobertura } from '@/lib/sst/cap-client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FaltanteItem {
  nombre_empleado: string
  descripcion_cargo: string | null
  numero_documento: string
  iniciales: string
}

export interface PanelDerechoProps {
  actividadId: string
  estadoActividad: string
  alertaCobertura: AlertaCobertura
  pctCobertura: number
  asistidos: number
  faltantes: FaltanteItem[]
  loadingFaltantes: boolean
  dirigidoA: string | null | undefined
  tieneRegistros: boolean
}

// ─── Ring Chart SVG ───────────────────────────────────────────────────────────

function RingChart({ value, color }: { value: number; color: string }) {
  const r   = 34
  const c   = 2 * Math.PI * r          // ≈ 213.6
  const pct = Math.min(100, Math.max(0, value))
  const dash = (pct / 100) * c

  return (
    <svg width={100} height={100} viewBox="0 0 100 100" aria-label={`Cobertura: ${pct}%`}>
      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      {/* Progress */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x="50" y="47" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 15, fontWeight: 700, fill: '#111827' }}>
        {pct}%
      </text>
      <text x="50" y="60" textAnchor="middle"
        style={{ fontSize: 8, fill: '#6b7280' }}>
        cobertura
      </text>
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PanelDerecho({
  actividadId,
  estadoActividad,
  alertaCobertura,
  pctCobertura,
  asistidos,
  faltantes,
  loadingFaltantes,
  dirigidoA,
  tieneRegistros,
}: PanelDerechoProps) {
  const alertaColor = ALERTA_COLOR[alertaCobertura] ?? CAP_COLORS.gris
  const completado  = estadoActividad === 'Completado'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Card 1: Cobertura ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Cobertura
        </h3>

        <div className="flex flex-col items-center gap-3">
          <RingChart value={pctCobertura} color={alertaColor} />

          {loadingFaltantes && !tieneRegistros && (
            <div
              className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"
              style={{ borderColor: CAP_COLORS.verde, borderTopColor: 'transparent' }}
            />
          )}

          {tieneRegistros && (
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="rounded-lg border border-gray-100 bg-gray-50 py-2 px-3 text-center">
                <p className="text-[10px] text-gray-400">Asistidos</p>
                <p className="text-lg font-bold tabular-nums text-gray-800">{asistidos}</p>
              </div>
              <div
                className="rounded-lg border py-2 px-3 text-center"
                style={{
                  borderColor:  faltantes.length === 0 ? '#b7dfbf' : '#f5c6cb',
                  background:   faltantes.length === 0 ? '#f0fff4' : '#fff5f5',
                }}
              >
                <p
                  className="text-[10px]"
                  style={{ color: faltantes.length === 0 ? '#155724' : '#721c24' }}
                >
                  Faltantes
                </p>
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ color: faltantes.length === 0 ? '#155724' : '#721c24' }}
                >
                  {faltantes.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Card 2: Faltantes ─────────────────────────────────────────────── */}
      {dirigidoA && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
              Faltantes — {dirigidoA}
            </h3>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {loadingFaltantes && (
              <div className="flex items-center justify-center py-6">
                <div
                  className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"
                  style={{ borderColor: CAP_COLORS.verde, borderTopColor: 'transparent' }}
                />
              </div>
            )}

            {!loadingFaltantes && faltantes.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-4 text-sm text-green-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Todos asistieron
              </div>
            )}

            {!loadingFaltantes && faltantes.map(p => (
              <div
                key={p.numero_documento}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: CAP_COLORS.gris }}
                  >
                    {p.iniciales || p.nombre_empleado.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {p.nombre_empleado}
                    </p>
                    {p.descripcion_cargo && (
                      <p className="text-[10px] text-gray-400 truncate">{p.descripcion_cargo}</p>
                    )}
                  </div>
                </div>
                <span
                  className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-2"
                  style={{ color: CAP_COLORS.azul, borderColor: CAP_COLORS.azul + '44' }}
                >
                  Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Card 3: Documentos ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Documentos
          </h3>
        </div>

        <div className="divide-y divide-gray-50">
          {/* GH-FO-1 — disponible cuando hay al menos un registro con presentes */}
          <div style={{ opacity: tieneRegistros ? 1 : 0.45, pointerEvents: tieneRegistros ? 'auto' : 'none' }}>
            {tieneRegistros ? (
              <a
                href={`/api/sst/capacitaciones/${actividadId}/pdf-asistencia`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-800">GH-FO-1</p>
                  <p className="text-[10px] text-gray-400">Control de asistencia</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-800">GH-FO-1</p>
                  <p className="text-[10px] text-gray-400">Control de asistencia</p>
                </div>
                <Lock className="w-3.5 h-3.5 text-gray-400 ml-auto" />
              </div>
            )}
          </div>

          {/* GH-FO-14 — disponible solo cuando la actividad está Completada */}
          <div style={{ opacity: completado ? 1 : 0.45 }}>
            {completado ? (
              <a
                href={`/api/sst/capacitaciones/${actividadId}/pdf-evaluacion`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-800">GH-FO-14</p>
                  <p className="text-[10px] text-gray-400">Evaluación de eficacia</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-800">GH-FO-14</p>
                  <p className="text-[10px] text-gray-400">Evaluación de eficacia</p>
                </div>
                <Lock className="w-3.5 h-3.5 text-gray-400 ml-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
