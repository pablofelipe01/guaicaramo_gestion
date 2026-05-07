'use client'

import { useRef, useState, useEffect } from 'react'

interface FirmaVerificacionProps {
  /** Etiqueta visible arriba del componente */
  label: string
  /** Rol del firmante — distingue capacitador vs director */
  rol: 'capacitador' | 'director'
  /** Si ya hay firma guardada — data URL PNG */
  firmaExistente?: string | null
  /** Nombre del firmante guardado */
  nombreFirmante?: string | null
  /** Fecha de la firma — "DD/MM/YYYY HH:mm" */
  fechaFirma?: string | null
  /** Callback al confirmar firma. Recibe el data URL base64 y el nombre. */
  onFirmar: (firmaB64: string, nombre: string) => Promise<void>
}

/**
 * Componente de firma de verificación.
 * - Si hay firma existente: muestra la imagen + nombre + fecha + badge "Verificado".
 * - Si no hay firma: muestra un canvas para dibujar y un input de nombre.
 */
export default function FirmaVerificacion({
  label,
  firmaExistente,
  nombreFirmante,
  fechaFirma,
  onFirmar,
}: FirmaVerificacionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFirmado, setHasFirmado] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  // Inicializar canvas
  useEffect(() => {
    if (!canvasRef.current || firmaExistente) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [firmaExistente])

  // ── Funciones de dibujo en canvas ────────────────────────────────────────
  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!canvasRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    setIsEmpty(false)
    const { x, y } = getPos(e, canvasRef.current)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !canvasRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e, canvasRef.current)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDraw() { setIsDrawing(false) }

  function limpiarCanvas() {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setIsEmpty(true)
    setHasFirmado(false)
  }

  async function confirmarFirma() {
    if (!canvasRef.current) return
    if (isEmpty) { setError('Por favor dibuja tu firma antes de confirmar'); return }
    if (!nombre.trim()) { setError('Por favor escribe tu nombre'); return }
    setError(null)
    setGuardando(true)
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      await onFirmar(dataUrl, nombre.trim())
      setHasFirmado(true)
    } catch {
      setError('Error al guardar la firma. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // ── Vista: firma ya existente ─────────────────────────────────────────────
  if (firmaExistente) {
    return (
      <div className="border border-green-200 rounded-xl p-4 bg-green-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Verificado
          </span>
        </div>

        {/* Imagen de la firma */}
        <div className="border border-green-300 rounded-lg bg-white p-2 mb-3" style={{ height: '100px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firmaExistente}
            alt="Firma"
            className="h-full mx-auto object-contain"
          />
        </div>

        {/* Metadatos */}
        <div className="text-xs text-gray-500 space-y-0.5">
          {nombreFirmante && (
            <p><span className="font-medium text-gray-700">Firmado por:</span> {nombreFirmante}</p>
          )}
          {fechaFirma && (
            <p><span className="font-medium text-gray-700">Fecha:</span> {fechaFirma}</p>
          )}
        </div>
      </div>
    )
  }

  // ── Vista: canvas para firmar ─────────────────────────────────────────────
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {hasFirmado && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Guardado
          </span>
        )}
      </div>

      {/* Input nombre */}
      <input
        type="text"
        placeholder="Nombre completo del firmante"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />

      {/* Canvas */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white mb-3">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full touch-none cursor-crosshair"
          style={{ height: '90px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-400">Dibuja tu firma aquí</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={limpiarCanvas}
          className="flex-1 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={confirmarFirma}
          disabled={guardando || hasFirmado}
          className="flex-1 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {guardando ? 'Guardando...' : hasFirmado ? 'Guardado ✓' : 'Confirmar firma'}
        </button>
      </div>
    </div>
  )
}
