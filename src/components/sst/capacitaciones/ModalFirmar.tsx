'use client'
import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  isOpen:   boolean
  onClose:  () => void
  label:    string
  onFirmar: (firmaB64: string, nombre: string) => Promise<void>
}

export default function ModalFirmar({ isOpen, onClose, label, onFirmar }: Props) {
  const canvasRef                     = useRef<HTMLCanvasElement>(null)
  const [dibujando,   setDibujando]   = useState(false)
  const [tieneTrazos, setTieneTrazos] = useState(false)
  const [nombre,      setNombre]      = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Reiniciar al abrir
  useEffect(() => {
    if (!isOpen) return
    setNombre('')
    setTieneTrazos(false)
    setError(null)
    const t = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }, 30)
    return () => clearTimeout(t)
  }, [isOpen])

  const getPos = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = 'touches' in e ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }, [])

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1A202C'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    setDibujando(true)
    setTieneTrazos(true)
    const p = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }, [getPos])

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dibujando) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const p   = getPos(e, canvas)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }, [dibujando, getPos])

  const handleEnd = useCallback(() => setDibujando(false), [])

  const limpiar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setTieneTrazos(false)
  }

  const guardar = async () => {
    if (!tieneTrazos) { setError('Dibuje su firma en el área indicada.'); return }
    if (!nombre.trim()) { setError('Ingrese su nombre completo.'); return }
    setError(null)
    setGuardando(true)
    try {
      await onFirmar(canvasRef.current!.toDataURL('image/png'), nombre.trim())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la firma')
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal — bottom sheet en móvil, centrado en sm+ */}
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* handle bar (solo móvil) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBF7EE]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#EBF7EE] shrink-0">
              <svg className="w-4 h-4 text-[#28A745]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A202C]">Firma — {label}</p>
              <p className="text-xs text-[#A0AEC0]">Dibuje su firma en el área indicada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A0AEC0] hover:text-[#718096] hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="p-5 flex flex-col gap-4">

          {/* nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
              Nombre completo <span className="text-red-400 font-bold">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Juan Carlos Gómez"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError(null) }}
              className="input-field"
              autoFocus
            />
          </div>

          {/* área de firma */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide">
                Área de firma
              </label>
              {tieneTrazos && (
                <button
                  onClick={limpiar}
                  className="text-xs text-[#A0AEC0] hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar
                </button>
              )}
            </div>

            <div className="relative border-2 border-dashed border-[#C8E6C9] rounded-xl bg-[#FAFFF9] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={240}
                className="block w-full touch-none cursor-crosshair"
                style={{ height: '160px' }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
              {!tieneTrazos && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-[#C8E6C9] pointer-events-none select-none">
                  Dibuje aquí su firma
                </p>
              )}
              {/* línea base de guía */}
              <div
                className="absolute left-5 right-5 border-b border-dashed border-[#C8E6C9] pointer-events-none"
                style={{ bottom: '28px' }}
              />
            </div>
            <p className="text-[11px] text-[#A0AEC0] text-center">
              Use el dedo o el ratón para trazar su firma
            </p>
          </div>

          {/* error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex gap-3 px-5 pb-6 sm:pb-5">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || !tieneTrazos || !nombre.trim()}
            className="btn btn-primary flex-[2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando
              ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando…
                </span>
              )
              : 'Confirmar firma'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
