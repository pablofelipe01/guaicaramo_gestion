'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, AlertTriangle, PenLine, RotateCcw, ClipboardList, Loader2 } from 'lucide-react'

// ─── Tipos locales ─────────────────────────────────────────────────────────────
interface PlantillaPublica {
  id: string
  nombre_capacitacion: string
  pregunta_1_texto: string
  pregunta_2_texto: string
  pregunta_2_opciones: string[]
  pregunta_3_texto: string
  pregunta_3_opciones: string[]
  pregunta_4_texto: string
  pregunta_4_opciones: string[]
  qr_token: string
}

type Estado = 'cargando' | 'formulario' | 'enviando' | 'exito' | 'error_token' | 'error_envio'

// ─── Paleta corporativa ────────────────────────────────────────────────────────
const VERDE   = '#28A745'
const GRIS    = '#6C757D'
const ROJO    = '#DC3545'

// ─── Componente canvas de firma ────────────────────────────────────────────────
function PadFirma({
  canvasRef,
  firmado,
  onFirmado,
  onLimpiar,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  firmado: boolean
  onFirmado: (v: boolean) => void
  onLimpiar: () => void
}) {
  const pintando = useRef(false)

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const iniciar = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    pintando.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [canvasRef])

  const dibujar = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!pintando.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineTo(x, y)
    ctx.stroke()
    onFirmado(true)
  }, [canvasRef, onFirmado])

  const terminar = useCallback(() => { pintando.current = false }, [])

  return (
    <div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `2px dashed ${firmado ? VERDE : '#d1d5db'}`, background: '#fafafa', touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full"
          style={{ cursor: 'crosshair', display: 'block' }}
          onMouseDown={iniciar}
          onMouseMove={dibujar}
          onMouseUp={terminar}
          onMouseLeave={terminar}
          onTouchStart={iniciar}
          onTouchMove={dibujar}
          onTouchEnd={terminar}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: GRIS }}>
          {firmado
            ? '✓ Firma registrada'
            : 'Dibuje su firma con el dedo o el cursor'}
        </p>
        {firmado && (
          <button
            type="button"
            onClick={onLimpiar}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: GRIS, border: `1px solid #dee2e6` }}
          >
            <RotateCcw className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Grupo de radio para preguntas de selección ────────────────────────────────
function RadioGroup({
  pregNum,
  texto,
  opciones,
  valor,
  onChange,
}: {
  pregNum: number
  texto: string
  opciones: string[]
  valor: string
  onChange: (v: string) => void
}) {
  const letras = ['A', 'B', 'C', 'D', 'E']
  return (
    <div className="rounded-2xl p-5" style={{ border: '1px solid #e9ecef', background: '#fff' }}>
      <p className="text-sm font-semibold mb-4" style={{ color: '#212529', lineHeight: 1.5 }}>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 flex-shrink-0 align-middle" style={{ background: VERDE }}>
          {pregNum}
        </span>
        {texto}
      </p>
      <div className="flex flex-col gap-3">
        {opciones.map((op, i) => (
          <label
            key={`${i}-${op}`}
            className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all select-none active:scale-[0.99]"
            style={{
              border: `2px solid ${valor === op ? VERDE : '#dee2e6'}`,
              background: valor === op ? '#f0fdf4' : '#fafafa',
            }}
          >
            <input
              type="radio"
              name={`pregunta_${pregNum}`}
              value={op}
              checked={valor === op}
              onChange={() => onChange(op)}
              className="sr-only"
            />
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 transition-all"
              style={{
                background: valor === op ? VERDE : '#e9ecef',
                color:      valor === op ? '#fff'  : GRIS,
              }}
            >
              {letras[i]}
            </span>
            <span className="text-sm leading-snug" style={{ color: valor === op ? '#155724' : '#495057', fontSize: 15 }}>
              {op}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function EvaluacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: VERDE }} />
      </div>
    }>
      <EvaluacionContent />
    </Suspense>
  )
}

function EvaluacionContent() {
  const params    = useParams<{ token: string }>()
  const token     = params?.token ?? ''

  const [estado, setEstado]         = useState<Estado>('cargando')
  const [plantilla, setPlantilla]   = useState<PlantillaPublica | null>(null)
  const [errorMsg, setErrorMsg]     = useState('')
  const [puntajeFinal, setPuntaje]  = useState<number | null>(null)
  const [aprobado, setAprobado]     = useState(false)

  // Campos de control
  const [fecha, setFecha]               = useState(new Date().toISOString().split('T')[0])
  const [tema, setTema]                 = useState('')
  const [trabajador, setTrabajador]     = useState('')
  const [area, setArea]                 = useState('')
  const [capacitador, setCapacitador]   = useState('')
  const [entidad, setEntidad]           = useState('')

  // Respuestas
  const [resp1, setResp1] = useState('')
  const [resp2, setResp2] = useState('')
  const [resp3, setResp3] = useState('')
  const [resp4, setResp4] = useState('')

  // Firma
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [firmado, setFirmado] = useState(false)

  // ── Cargar plantilla ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setEstado('error_token'); setErrorMsg('Token de evaluación no encontrado.'); return }

    fetch(`/api/sst/cap/plantillas/${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : r.json().then((e: { message?: string }) => Promise.reject(e.message ?? 'Token inválido')))
      .then((data: { plantilla: PlantillaPublica }) => {
        setPlantilla(data.plantilla)
        setTema(data.plantilla.nombre_capacitacion)
        setEstado('formulario')
      })
      .catch((msg: string | unknown) => {
        setEstado('error_token')
        setErrorMsg(typeof msg === 'string' ? msg : 'Código QR inválido o expirado.')
      })
  }, [token])

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setFirmado(false)
  }

  // ── Enviar evaluación ─────────────────────────────────────────────────────
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plantilla) return

    // Validación cliente
    if (!firmado) { alert('Por favor dibuje su firma para continuar.'); return }
    if (!resp2)   { alert('Seleccione una respuesta para la pregunta 2.'); return }
    if (!resp3)   { alert('Seleccione una respuesta para la pregunta 3.'); return }
    if (!resp4)   { alert('Seleccione una respuesta para la pregunta 4.'); return }

    setEstado('enviando')

    const firma_base64 = canvasRef.current?.toDataURL('image/png') ?? ''

    try {
      const res = await fetch('/api/sst/cap/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          tema,
          nombre_capacitacion: plantilla.nombre_capacitacion,
          nombre_trabajador:   trabajador,
          area,
          nombre_capacitador:  capacitador,
          entidad,
          respuesta_1: resp1,
          respuesta_2: resp2,
          respuesta_3: resp3,
          respuesta_4: resp4,
          firma_base64,
          qr_token:    token,
          id_plantilla: plantilla.id,
        }),
      })

      const data = await res.json() as { puntaje?: number; aprobado?: boolean; message?: string }

      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)

      setPuntaje(data.puntaje ?? null)
      setAprobado(data.aprobado ?? false)
      setEstado('exito')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar la evaluación.')
      setEstado('error_envio')
    }
  }

  // ── Renders ───────────────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: VERDE }} />
          <p className="text-sm" style={{ color: GRIS }}>Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (estado === 'error_token') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
        <div className="max-w-sm w-full text-center bg-white rounded-2xl p-8 shadow-sm" style={{ border: `1px solid ${ROJO}30` }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: ROJO }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: '#212529' }}>QR inválido</h2>
          <p className="text-sm" style={{ color: GRIS }}>{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (estado === 'exito') {
    const pct = puntajeFinal != null ? Math.round((puntajeFinal / 10) * 100) : 0
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
        <div className="max-w-sm w-full bg-white rounded-2xl p-8 shadow-sm text-center" style={{ border: `1px solid ${aprobado ? VERDE : ROJO}30` }}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: aprobado ? '#d4edda' : '#f8d7da' }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: aprobado ? VERDE : ROJO }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: aprobado ? '#155724' : '#721c24' }}>
            {aprobado ? '¡Aprobado!' : 'No aprobado'}
          </h2>
          <p className="text-sm mb-4" style={{ color: GRIS }}>
            Evaluación registrada exitosamente
          </p>

          {/* Puntaje visual */}
          <div className="rounded-2xl p-6 mb-4" style={{ background: aprobado ? '#f0fdf4' : '#fef2f2' }}>
            <p className="text-5xl font-bold" style={{ color: aprobado ? VERDE : ROJO, fontFamily: 'system-ui' }}>
              {puntajeFinal?.toFixed(1)}
            </p>
            <p className="text-sm mt-1" style={{ color: GRIS }}>de 10.0 puntos</p>
            <div className="mt-3 w-full rounded-full h-2" style={{ background: '#e9ecef' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: aprobado ? VERDE : ROJO }}
              />
            </div>
          </div>

          <p className="text-xs" style={{ color: GRIS }}>
            La evaluación se aprueba con un puntaje igual o superior a 7.5 puntos.
          </p>
        </div>
      </div>
    )
  }

  if (estado === 'error_envio') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8f9fa' }}>
        <div className="max-w-sm w-full text-center bg-white rounded-2xl p-8 shadow-sm">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: ROJO }} />
          <h2 className="text-lg font-bold mb-2">Error al enviar</h2>
          <p className="text-sm mb-4" style={{ color: GRIS }}>{errorMsg}</p>
          <button
            onClick={() => setEstado('formulario')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: VERDE }}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12" style={{ background: '#f8f9fa' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ background: VERDE }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-white flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              Evaluación de Eficacia
            </p>
            <p className="text-white/75 text-xs truncate">{plantilla?.nombre_capacitacion}</p>
          </div>
          <span className="text-white/75 text-xs font-mono flex-shrink-0">GH-FO-14</span>
        </div>
      </div>

      <form onSubmit={enviar} className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-10 flex flex-col gap-7">

        {/* ── Sección A: Datos de control ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm" style={{ border: '1px solid #e9ecef' }}>
          <h2 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: '#212529' }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: VERDE }}>A</span>
            Datos de control
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: GRIS }}>Fecha *</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full rounded-xl border px-3 py-3 outline-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: GRIS }}>Tema capacitación *</label>
              <input
                type="text"
                required
                value={tema}
                onChange={e => setTema(e.target.value)}
                placeholder="Ej: Alturas y espacios confinados"
                className="w-full rounded-xl border px-3 py-3 outline-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: GRIS }}>Nombre trabajador *</label>
              <input
                type="text"
                required
                value={trabajador}
                onChange={e => setTrabajador(e.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-xl border px-3 py-3 outline-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: GRIS }}>Área *</label>
              <input
                type="text"
                required
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="Ej: Producción"
                className="w-full rounded-xl border px-3 py-3 outline-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: GRIS }}>Capacitador *</label>
              <input
                type="text"
                required
                value={capacitador}
                onChange={e => setCapacitador(e.target.value)}
                placeholder="Nombre del instructor"
                className="w-full rounded-xl border px-3 py-3 outline-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: GRIS }}>Entidad *</label>
              <input
                type="text"
                required
                value={entidad}
                onChange={e => setEntidad(e.target.value)}
                placeholder="Ej: ARL SURA / SENA"
                className="w-full rounded-xl border px-3 py-3 outline-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>
        </div>

        {/* ── Sección B: Cuestionario ──────────────────────────────────────── */}
        {plantilla && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#212529' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: VERDE }}>B</span>
              Cuestionario
              <span className="text-xs font-normal ml-1" style={{ color: GRIS }}>
                Cada pregunta vale 2.5 puntos
              </span>
            </h2>

            {/* Pregunta 1 — Texto abierto */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e9ecef' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: '#212529', lineHeight: 1.5 }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 flex-shrink-0 align-middle" style={{ background: VERDE }}>
                  1
                </span>
                {plantilla.pregunta_1_texto}
              </p>
              <textarea
                required
                rows={4}
                value={resp1}
                onChange={e => setResp1(e.target.value)}
                placeholder="Escriba su respuesta aquí..."
                className="w-full rounded-xl border px-3 py-3 outline-none resize-none transition-all"
                style={{ borderColor: '#dee2e6', color: '#212529', fontSize: 16, lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Preguntas 2, 3, 4 — Selección */}
            <RadioGroup
              pregNum={2}
              texto={plantilla.pregunta_2_texto}
              opciones={plantilla.pregunta_2_opciones}
              valor={resp2}
              onChange={setResp2}
            />
            <RadioGroup
              pregNum={3}
              texto={plantilla.pregunta_3_texto}
              opciones={plantilla.pregunta_3_opciones}
              valor={resp3}
              onChange={setResp3}
            />
            <RadioGroup
              pregNum={4}
              texto={plantilla.pregunta_4_texto}
              opciones={plantilla.pregunta_4_opciones}
              valor={resp4}
              onChange={setResp4}
            />
          </div>
        )}

        {/* ── Sección C: Firma ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm" style={{ border: '1px solid #e9ecef' }}>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#212529' }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: VERDE }}>C</span>
            Firma del trabajador *
          </h2>
          <PadFirma
            canvasRef={canvasRef}
            firmado={firmado}
            onFirmado={setFirmado}
            onLimpiar={limpiarFirma}
          />
        </div>

        {/* Aviso legal */}
        <p className="text-xs text-center" style={{ color: GRIS }}>
          La evaluación se aprueba con un puntaje igual o superior a 7.5 puntos.
          Al enviar confirma que las respuestas son propias.
        </p>

        {/* Botón submit */}
        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all flex items-center justify-center gap-2"
          style={{
            background:   estado === 'enviando' ? '#a8d5b5' : VERDE,
            boxShadow:    estado === 'enviando' ? 'none' : '0 4px 14px rgba(40,167,69,0.35)',
          }}
        >
          {estado === 'enviando' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
          ) : (
            <><PenLine className="w-5 h-5" /> Enviar y Firmar</>
          )}
        </button>
      </form>
    </div>
  )
}
