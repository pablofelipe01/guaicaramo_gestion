'use client'

/**
 * @file AlertasActividad.tsx
 *
 * Bloque de alertas graduadas para la página de detalle de una actividad de
 * capacitación (`/dashboard/capacitaciones/[id]`).
 *
 * Las reglas de generación de alertas residen en este componente porque
 * solo dependen de datos ya disponibles en el cliente (programaciones y
 * registros de la actividad). No se calcula `estado_general` aquí — eso
 * vive en `lib/sst/cap-estados.ts` (server-only).
 */
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

const COLORS = {
  rojo:    { bg: 'rgba(220,53,69,0.10)', border: '#DC3545', text: '#7F1D1D' },
  naranja: { bg: 'rgba(255,140,66,0.10)', border: '#FF8C42', text: '#7C2D12' },
  azul:    { bg: 'rgba(40,167,69,0.10)',  border: '#28A745', text: '#14532D' },
  verde:   { bg: 'rgba(40,167,69,0.10)',  border: '#28A745', text: '#14532D' },
} as const

type Severidad = keyof typeof COLORS

interface Alerta {
  severidad: Severidad
  icono: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  titulo: string
  descripcion: string
  accion?: { label: string; href?: string; onClick?: () => void }
}

export interface AlertasActividadProps {
  actividad: {
    id: string
    tema: string
    estado_general: string
    alerta_cobertura?: 'ok' | 'riesgo' | 'critico' | 'sin_datos'
  }
  programaciones: Array<{
    id: string
    estado: string
    fecha_programada?: string | null
    mes: string
    semana: number
  }>
  registros: Array<{
    asistentes_presentes: number
    asistentes_convocados: number
    evaluaciones_aprobadas: number
    evaluaciones_realizadas: number
    fecha_ejecucion?: string | null
    estado_firma?: 'pendiente' | 'parcial' | 'completo'
  }>
}

const HOY_MID = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
const MS_DIA = 1000 * 60 * 60 * 24

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_DIA)
}
function diasHasta(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / MS_DIA)
}

function construirAlertas(p: AlertasActividadProps): Alerta[] {
  const out: Alerta[] = []
  const { actividad, programaciones, registros } = p

  // ── CRÍTICAS ─────────────────────────────────────────────────────────────
  const vencidasMas7 = programaciones.filter(prog => {
    if (prog.estado !== 'Programado') return false
    if (!prog.fecha_programada) return false
    return new Date(prog.fecha_programada) < HOY_MID && diasDesde(prog.fecha_programada) > 7
  })
  if (vencidasMas7.length > 0) {
    out.push({
      severidad: 'rojo',
      icono: AlertCircle,
      titulo: `${vencidasMas7.length} sesión${vencidasMas7.length === 1 ? '' : 'es'} vencida${vencidasMas7.length === 1 ? '' : 's'} hace más de 7 días`,
      descripcion: 'Hay sesiones programadas que no se han ejecutado ni cancelado. Revisa el cronograma y registra la ejecución o reprograma.',
      accion: { label: 'Ver cronograma' },
    })
  }

  if (actividad.alerta_cobertura === 'critico') {
    out.push({
      severidad: 'rojo',
      icono: AlertCircle,
      titulo: 'Cobertura crítica (< 60%)',
      descripcion: 'La asistencia promedio está por debajo del umbral mínimo. Considera reforzar la convocatoria o repetir la sesión.',
    })
  }

  const firmasPendientesCancelado = actividad.estado_general === 'Cancelado' &&
    registros.some(r => r.estado_firma && r.estado_firma !== 'completo')
  if (firmasPendientesCancelado) {
    out.push({
      severidad: 'rojo',
      icono: AlertCircle,
      titulo: 'Actividad cancelada con firmas pendientes',
      descripcion: 'Quedan asistencias sin firma de ejecuciones previas. Revísalas antes de archivar.',
    })
  }

  // ── ADVERTENCIAS ─────────────────────────────────────────────────────────
  const proximas = programaciones.filter(prog => {
    if (prog.estado !== 'Programado') return false
    if (!prog.fecha_programada) return false
    const d = diasHasta(prog.fecha_programada)
    return d >= 0 && d <= 7
  })
  if (proximas.length > 0) {
    out.push({
      severidad: 'naranja',
      icono: AlertTriangle,
      titulo: `${proximas.length} sesión${proximas.length === 1 ? '' : 'es'} vence${proximas.length === 1 ? '' : 'n'} en los próximos 7 días`,
      descripcion: 'Confirma logística, asistentes y materiales antes de la fecha programada.',
    })
  }

  if (actividad.alerta_cobertura === 'riesgo') {
    out.push({
      severidad: 'naranja',
      icono: AlertTriangle,
      titulo: 'Cobertura en zona de riesgo (60–79%)',
      descripcion: 'La asistencia promedio está por debajo de la meta del 80%. Refuerza la convocatoria.',
    })
  }

  const firmasParcialesViejas = registros.some(r => {
    if (r.estado_firma !== 'parcial') return false
    if (!r.fecha_ejecucion) return false
    return diasDesde(r.fecha_ejecucion) > 2
  })
  if (firmasParcialesViejas) {
    out.push({
      severidad: 'naranja',
      icono: AlertTriangle,
      titulo: 'Asistentes pendientes de firma (> 48h)',
      descripcion: 'Algunas firmas no se han completado tras la sesión. Reenvía los enlaces de firma.',
    })
  }

  // ── INFORMATIVAS ─────────────────────────────────────────────────────────
  const sinEvaluaciones = actividad.estado_general === 'Completado' &&
    registros.every(r => (r.evaluaciones_realizadas ?? 0) === 0)
  if (sinEvaluaciones && registros.length > 0) {
    out.push({
      severidad: 'azul',
      icono: Info,
      titulo: 'Actividad completada sin evaluaciones de eficacia',
      descripcion: 'No se ha registrado evaluación de aprendizaje para los asistentes. Considera aplicar una.',
    })
  }

  const reprogramadaSinFecha = programaciones.some(p =>
    p.estado === 'Reprogramado' && !p.fecha_programada
  )
  if (reprogramadaSinFecha) {
    out.push({
      severidad: 'azul',
      icono: Info,
      titulo: 'Sesión reprogramada sin fecha asignada',
      descripcion: 'Hay al menos una sesión marcada como reprogramada sin nueva fecha. Asigna fecha en el cronograma.',
    })
  }

  if (actividad.estado_general === 'Sin programar') {
    out.push({
      severidad: 'azul',
      icono: Info,
      titulo: 'Actividad sin programar',
      descripcion: 'No tiene sesiones en el cronograma. Agrega al menos una para iniciar el seguimiento.',
    })
  }

  // ── ÉXITO ────────────────────────────────────────────────────────────────
  const totalEvalReal = registros.reduce((s, r) => s + (r.evaluaciones_realizadas ?? 0), 0)
  const totalEvalApr  = registros.reduce((s, r) => s + (r.evaluaciones_aprobadas ?? 0), 0)
  const pctAprob = totalEvalReal > 0 ? (totalEvalApr / totalEvalReal) * 100 : 0
  if (
    actividad.estado_general === 'Completado' &&
    actividad.alerta_cobertura === 'ok' &&
    totalEvalReal > 0 &&
    pctAprob >= 80
  ) {
    out.push({
      severidad: 'verde',
      icono: CheckCircle2,
      titulo: 'Actividad completada con resultados óptimos',
      descripcion: `Cobertura ≥ 80% y ${pctAprob.toFixed(0)}% de aprobación en evaluaciones.`,
    })
  }

  return out
}

const ORDEN_SEVERIDAD: Record<Severidad, number> = { rojo: 0, naranja: 1, azul: 2, verde: 3 }

export default function AlertasActividad(props: AlertasActividadProps) {
  const alertas = construirAlertas(props).sort(
    (a, b) => ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad]
  )

  if (alertas.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {alertas.map((a, i) => {
        const c = COLORS[a.severidad]
        const Icon = a.icono
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{ background: c.bg, borderColor: c.border }}
          >
            <Icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: c.border }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: c.text }}>{a.titulo}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sst-dark-600)' }}>{a.descripcion}</p>
              {a.accion && (
                <button
                  onClick={a.accion.onClick}
                  className="text-xs font-medium mt-1 underline"
                  style={{ color: c.border }}
                >
                  {a.accion.label}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
