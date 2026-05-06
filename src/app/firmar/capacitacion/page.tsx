'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertTriangle, Pen, RotateCcw } from 'lucide-react'

interface RegistroInfo {
  registroId: string
  actividadTema: string | null
  fechaEjecucion: string | null
}

type Estado = 'cargando' | 'formulario' | 'enviando' | 'exito' | 'error_token' | 'error_envio'

export default function FirmarCapacitacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full border-blue-600" />
      </div>
    }>
      <FirmarCapacitacionContent />
    </Suspense>
  )
}

function FirmarCapacitacionContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [estado, setEstado]         = useState<Estado>('cargando')
  const [info, setInfo]             = useState<RegistroInfo | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string>('')

  const [nombre, setNombre]         = useState('')
  const [cedula, setCedula]         = useState('')
  const [cargo, setCargo]           = useState('')
  const [area, setArea]             = useState('')

  // Canvas de firma
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const pintando    = useRef(false)
  const [firmado, setFirmado] = useState(false)

  // ── Cargar info del registro ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setEstado('error_token'); setErrorMsg('No se encontró el token de firma.'); return }

    fetch(`/api/sst/capacitaciones/firmar-publico?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : r.json().then((e: { message?: string }) => Promise.reject(e.message ?? 'Token inválido')))
      .then((data: RegistroInfo) => { setInfo(data); setEstado('formulario') })
      .catch((msg: string) => { setEstado('error_token'); setErrorMsg(typeof msg === 'string' ? msg : 'Token inválido o expirado.') })
  }, [token])

  // ── Lógica del canvas de firma ────────────────────────────────────────────
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const iniciarTrazo = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    pintando.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

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
    setFirmado(true)
  }, [])

  const terminarTrazo = useCallback(() => { pintando.current = false }, [])

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setFirmado(false)
  }

  // ── Enviar firma ──────────────────────────────────────────────────────────
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setEstado('enviando')

    const firma_data_url = firmado && canvasRef.current
      ? canvasRef.current.toDataURL('image/png')
      : undefined

    try {
      const res = await fetch('/api/sst/capacitaciones/firmar-publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nombre_trabajador: nombre.trim(),
          cedula:  cedula.trim()  || undefined,
          cargo:   cargo.trim()   || undefined,
          area:    area.trim()    || undefined,
          firma_data_url,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(err.message ?? `Error ${res.status}`)
      }

      setEstado('exito')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la firma.')
      setEstado('error_envio')
    }
  }

  // ── Renders por estado ────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full border-blue-600" />
      </div>
    )
  }

  if (estado === 'error_token') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Enlace inválido</h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (estado === 'exito') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">¡Asistencia registrada!</h1>
          <p className="text-sm text-gray-500">
            Tu participación en la capacitación ha quedado registrada. Puedes cerrar esta página.
          </p>
        </div>
      </div>
    )
  }

  if (estado === 'error_envio') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Error al registrar</h1>
          <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
          <button
            onClick={() => setEstado('formulario')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  // Estado: formulario
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Pen className="w-5 h-5 text-white/80" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Registro de asistencia</span>
          </div>
          <h1 className="text-white font-bold text-base leading-snug">
            {info?.actividadTema ?? 'Capacitación SG-SST'}
          </h1>
          {info?.fechaEjecucion && (
            <p className="text-white/70 text-xs mt-0.5">{info.fechaEjecucion}</p>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={enviar} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Nombre completo *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Juan Carlos Gómez"
              required
              autoComplete="name"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Cédula</label>
              <input
                type="text"
                inputMode="numeric"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="12345678"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Operario"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Área</label>
            <input
              type="text"
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Ej. Producción"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Canvas de firma */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <Pen className="w-3.5 h-3.5" /> Firma digital (opcional)
              </label>
              {firmado && (
                <button
                  type="button"
                  onClick={limpiarFirma}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Borrar
                </button>
              )}
            </div>
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 touch-none">
              <canvas
                ref={canvasRef}
                width={380}
                height={120}
                className="w-full cursor-crosshair"
                onMouseDown={iniciarTrazo}
                onMouseMove={dibujar}
                onMouseUp={terminarTrazo}
                onMouseLeave={terminarTrazo}
                onTouchStart={iniciarTrazo}
                onTouchMove={dibujar}
                onTouchEnd={terminarTrazo}
              />
              {!firmado && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-xs text-gray-300 font-medium">Dibuja tu firma aquí</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={estado === 'enviando' || !nombre.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 100%)' }}
          >
            {estado === 'enviando' ? 'Registrando…' : 'Confirmar asistencia'}
          </button>

          <p className="text-center text-[10px] text-gray-400">
            Al confirmar, tu asistencia quedará registrada en el Sistema de Gestión SST de Guaicaramo.
          </p>
        </form>
      </div>
    </div>
  )
}
