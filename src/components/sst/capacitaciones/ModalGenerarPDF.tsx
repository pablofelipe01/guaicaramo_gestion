/**
 * @file ModalGenerarPDF.tsx
 * Modal editor de plantilla para generar el "Control de Asistencia" (GH-FO-1) en PDF.
 * Permite editar el encabezado antes de descargar, mostrando un spinner durante la generación.
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Save, Loader2, FileText, CheckCircle2 } from 'lucide-react'
import { getAuthHeaders } from '@/lib/client/authFetch'
import { useAuth } from '@/hooks/useAuth'

export interface DatosIniciales {
  tipo_actividad: 'CAPACITACIÓN' | 'CHARLA' | 'INDUCCIÓN' | 'REUNIÓN' | 'RECREACIÓN Y DEPORTE'
  fecha: string            // DD/MM/YYYY para mostrar, YYYY-MM-DD del input date
  duracion_horas: string
  lugar: string
  capacitador: string
  num_convocados: string
  tema_principal: string
  objetivo: string
  contenido: string
  plan_capacitacion: 'SI' | 'NO' | 'N/A'
}

interface ModalGenerarPDFProps {
  isOpen: boolean
  onClose: () => void
  registroId: string
  actividadId: string
  datosIniciales: DatosIniciales
  totalAsistentes?: number
  onSuccess?: () => void
}

const TIPOS_ACTIVIDAD = [
  'CAPACITACIÓN',
  'CHARLA',
  'INDUCCIÓN',
  'REUNIÓN',
  'RECREACIÓN Y DEPORTE',
] as const

// =============================================================================
// Componente canvas de firma digital
// =============================================================================
interface SignatureCanvasProps {
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
}

function SignatureCanvas({ label, value, onChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  // Limpiar canvas cuando el padre resetea el valor a null
  useEffect(() => {
    if (value === null) {
      const canvas = canvasRef.current
      if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [value])

  /** Convierte coordenadas CSS a coordenadas del canvas (resolución interna). */
  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width  / rect.width
    const sy = canvas.height / rect.height
    const src = 'touches' in e ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e.nativeEvent, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    e.preventDefault()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e.nativeEvent, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1A202C'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    e.preventDefault()
  }

  const stopDraw = () => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <button
          type="button"
          onClick={clear}
          className="text-[11px] text-red-500 hover:text-red-700 hover:underline"
        >
          Limpiar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={80}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        className="w-full rounded-lg border cursor-crosshair touch-none"
        style={{
          height: '80px',
          borderColor: value ? 'var(--sst-green-700)' : 'var(--sst-dark-300)',
          background: '#FAFAFA',
        }}
      />
      <p className="text-[10px]" style={{ color: value ? 'var(--sst-green-700)' : '#9CA3AF' }}>
        {value ? '✓ Firma capturada' : 'Dibuje la firma en el área superior'}
      </p>
    </div>
  )
}

/** Convierte "YYYY-MM-DD" → "DD/MM/YYYY" para enviar al PDF */
function isoToDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (d && m && y) return `${d}/${m}/${y}`
  return iso
}

/** Convierte "DD/MM/YYYY" → "YYYY-MM-DD" para el input date */
function displayToIso(display: string): string {
  if (!display) return ''
  const [d, m, y] = display.split('/')
  if (d && m && y) return `${y}-${m}-${d}`
  return display
}

export function ModalGenerarPDF({
  isOpen,
  onClose,
  registroId,
  actividadId,
  datosIniciales,
  totalAsistentes,
  onSuccess,
}: ModalGenerarPDFProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<DatosIniciales>(datosIniciales)
  const [generando, setGenerando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firmaCapacitador, setFirmaCapacitador] = useState<string | null>(null)
  const [firmaDirector, setFirmaDirector] = useState<string | null>(null)

  // Sincronizar si cambian los datos iniciales (ej. al cambiar de registro)
  useEffect(() => {
    if (isOpen) {
      setForm(datosIniciales)
      setExito(false)
      setError(null)
      setFirmaCapacitador(null)
      setFirmaDirector(null)
    }
  }, [isOpen, datosIniciales])

  if (!isOpen) return null

  const handleGenerarPDF = async () => {
    setGenerando(true)
    setError(null)
    try {
      const payload = {
        ...form,
        // Asegurar que la fecha vaya en DD/MM/YYYY al PDF
        fecha: form.fecha.includes('-') ? isoToDisplay(form.fecha) : form.fecha,
        firma_capacitador: firmaCapacitador ?? undefined,
        firma_director: firmaDirector ?? undefined,
      }

      const response = await fetch(
        `/api/sst/capacitaciones/registros/${registroId}/pdf-asistencia`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(errBody.error ?? `HTTP ${response.status}`)
      }

      const fechaDisplay = payload.fecha.includes('/') ? payload.fecha : isoToDisplay(payload.fecha)

      setExito(true)

      // Guardar historial del reporte generado (fire-and-forget)
      const nombreReporte = `Control Asistencia — ${form.tema_principal.slice(0, 40)} — ${fechaDisplay}`
      void fetch('/api/sst/capacitaciones/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          id_registro:      registroId,
          id_actividad:     actividadId,
          nombre_reporte:   nombreReporte,
          datos_encabezado: payload,
          total_asistentes: totalAsistentes ?? 0,
          generado_por:     user?.name ?? 'Usuario',
        }),
      }).catch(() => { /* no bloquear si falla el registro */ })

      setTimeout(() => {
        setExito(false)
        onClose()
        onSuccess?.()
      }, 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar el PDF')
    } finally {
      setGenerando(false)
    }
  }

  const setField = <K extends keyof DatosIniciales>(key: K, value: DatosIniciales[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!generando ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden mx-2 sm:mx-4"
        style={{ background: '#fff' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ background: 'var(--sst-green-800)' }}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-white opacity-90" />
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Control de Asistencia</h2>
              <p className="text-[11px] text-white/70 leading-tight">Formato GH-FO-1 · Versión 13</p>
            </div>
          </div>
          <button
            onClick={!generando ? onClose : undefined}
            disabled={generando}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* ── Mini preview descriptivo ──────────────────────────────────── */}
          <div
            className="rounded-xl p-3 mb-4 flex items-start gap-2.5"
            style={{ background: 'var(--sst-green-50)', border: '1px solid rgba(22,101,52,0.2)' }}
          >
            <FileText className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--sst-green-700)' }} />
            <p className="text-xs" style={{ color: '#374151' }}>
              El PDF incluirá el encabezado con los datos de abajo, la tabla de asistentes con sus firmas digitales
              y el bloque de firmas de verificación. Revisa los datos antes de descargar.
            </p>
          </div>

          {/* ── Formulario ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Tipo de actividad */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Tipo de actividad</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_ACTIVIDAD.map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setField('tipo_actividad', tipo)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={
                      form.tipo_actividad === tipo
                        ? { background: 'var(--sst-green-800)', color: '#fff', borderColor: 'var(--sst-green-800)' }
                        : { background: '#fff', color: 'var(--sst-dark-700)', borderColor: 'var(--sst-dark-300)' }
                    }
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0"
                      style={
                        form.tipo_actividad === tipo
                          ? { background: '#fff', borderColor: '#fff' }
                          : { borderColor: 'var(--sst-dark-300)' }
                      }
                    >
                      {form.tipo_actividad === tipo && (
                        <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--sst-green-800)' }} />
                      )}
                    </span>
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Fila: Fecha + Duración + Convocados */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Fecha</label>
                <input
                  type="date"
                  value={form.fecha.includes('/') ? displayToIso(form.fecha) : form.fecha}
                  onChange={e => setField('fecha', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Duración (horas)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.duracion_horas}
                  onChange={e => setField('duracion_horas', e.target.value)}
                  className="input-field"
                  placeholder="Ej. 4"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">N° convocados</label>
                <input
                  type="number"
                  min="0"
                  value={form.num_convocados}
                  onChange={e => setField('num_convocados', e.target.value)}
                  className="input-field"
                  placeholder="Ej. 15"
                />
              </div>
            </div>

            {/* Lugar + Capacitador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Lugar del evento</label>
                <input
                  type="text"
                  value={form.lugar}
                  onChange={e => setField('lugar', e.target.value)}
                  className="input-field"
                  placeholder="Ej. Sala de capacitaciones"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Capacitador</label>
                <input
                  type="text"
                  value={form.capacitador}
                  onChange={e => setField('capacitador', e.target.value)}
                  className="input-field"
                  placeholder="Nombre del facilitador"
                />
              </div>
            </div>

            {/* Tema principal */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Tema principal</label>
              <input
                type="text"
                value={form.tema_principal}
                onChange={e => setField('tema_principal', e.target.value)}
                className="input-field"
                placeholder="Ej. Trabajo en alturas — Normativa y EPPs"
              />
            </div>

            {/* Objetivo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Objetivo</label>
              <textarea
                rows={2}
                value={form.objetivo}
                onChange={e => setField('objetivo', e.target.value)}
                className="input-field resize-none"
                placeholder="Describir el objetivo de aprendizaje"
              />
            </div>

            {/* Contenido */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Contenido</label>
              <textarea
                rows={2}
                value={form.contenido}
                onChange={e => setField('contenido', e.target.value)}
                className="input-field resize-none"
                placeholder="Temas tratados durante la capacitación"
              />
            </div>

            {/* Plan capacitación */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">¿Hace parte del plan de capacitación?</label>
              <div className="flex gap-3">
                {(['SI', 'NO', 'N/A'] as const).map(op => (
                  <label key={op} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="plan_capacitacion"
                      value={op}
                      checked={form.plan_capacitacion === op}
                      onChange={() => setField('plan_capacitacion', op)}
                      className="w-3.5 h-3.5"
                      style={{ accentColor: 'var(--sst-green-700)' }}
                    />
                    <span className="text-sm text-gray-700">{op}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Firmas de verificación */}
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Firmas de verificación</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SignatureCanvas
                  label="Capacitador u organizador"
                  value={firmaCapacitador}
                  onChange={setFirmaCapacitador}
                />
                <SignatureCanvas
                  label="Director o responsable del área"
                  value={firmaDirector}
                  onChange={setFirmaDirector}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl p-3 flex items-center gap-2" style={{ background: 'var(--sst-critico-bg)', border: '1px solid rgba(220,53,69,0.25)' }}>
              <span className="text-xs" style={{ color: 'var(--sst-critico)' }}>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 flex items-center justify-end gap-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={!generando ? onClose : undefined}
            disabled={generando}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerarPDF}
            disabled={generando || !form.tema_principal.trim()}
            className="btn btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {exito ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Descargado
              </>
            ) : generando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando PDF…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
