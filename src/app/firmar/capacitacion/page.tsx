'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertTriangle, PenLine, RotateCcw, Shield, CalendarDays, UserCheck, UserX, Building2 } from 'lucide-react'

interface RegistroInfo {
  registroId: string
  actividadTema: string | null
  fechaEjecucion: string | null
  dirigidoA: string | null
}

interface PersonalInfo {
  encontrado: boolean
  nombre?: string
  cargo?: string
  descripcion_unidad_negocio?: string
  numero_documento?: string
}

type Estado = 'cargando' | 'formulario' | 'enviando' | 'exito' | 'error_token' | 'error_envio'

export default function FirmarCapacitacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--sst-green-500)', borderTopColor: 'transparent' }} />
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

  const [nombre, setNombre]             = useState('')
  const [numDocumento, setNumDocumento]  = useState('')
  const [telefono, setTelefono]          = useState('')
  const [cargoEmpresa, setCargoEmpresa]  = useState('')
  const [correoExterno, setCorreoExterno] = useState('')

  // Validación de cédula contra sst_personal
  const [personalInfo, setPersonalInfo]       = useState<PersonalInfo | null>(null)
  const [buscandoCedula, setBuscandoCedula]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // ── Lookup de cédula con debounce ─────────────────────────────────────────
  useEffect(() => {
    const cedula = numDocumento.replace(/\D/g, '')
    if (cedula.length < 6) {
      setPersonalInfo(null)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscandoCedula(true)
      try {
        const res = await fetch(`/api/sst/personal/verificar?cedula=${encodeURIComponent(cedula)}`)
        if (res.ok) {
          const data: PersonalInfo = await res.json()
          setPersonalInfo(data)
          // Pre-llenar nombre y cargo si se encuentra en el sistema
          if (data.encontrado && data.nombre) {
            setNombre(data.nombre)
            if (data.cargo) setCargoEmpresa(data.cargo)
          }
        }
      } catch { /* silencioso */ }
      setBuscandoCedula(false)
    }, 600)
  }, [numDocumento])
  // Escala las coordenadas del evento al espacio interno del canvas,
  // compensando diferencias entre tamaño CSS y tamaño de píxeles internos
  // (incluye pantallas de alta densidad / retina / móvil).
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
          numero_documento: numDocumento.trim() || undefined,
          telefono:         telefono.trim()     || undefined,
          cargo_empresa:    cargoEmpresa.trim() || undefined,
          correo_externo:   correoExterno.trim() || undefined,
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--sst-green-500)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (estado === 'error_token') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-base font-bold text-gray-900 mb-2">Enlace inválido</h1>
            <p className="text-sm text-gray-500 leading-relaxed">{errorMsg}</p>
            <p className="mt-4 text-xs text-gray-400">
              Solicita un nuevo enlace al coordinador SST.
            </p>
          </div>
      </div>
    )
  }

  if (estado === 'exito') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #166534 0%, #22C55E 100%)' }}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">¡Asistencia registrada!</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tu participación en la capacitación ha quedado registrada en el SG-SST de Guaicaramo.
            </p>
            <p className="mt-4 text-xs text-gray-400">Puedes cerrar esta página.</p>
          </div>
      </div>
    )
  }

  if (estado === 'error_envio') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-orange-500" />
            </div>
            <h1 className="text-base font-bold text-gray-900 mb-2">Error al registrar</h1>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => setEstado('formulario')}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #166534 0%, #0B5B2D 100%)' }}
            >
              Intentar de nuevo
            </button>
          </div>
      </div>
    )
  }

  // ── Estado: formulario ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8" style={{ background: 'var(--background)' }}>

        {/* Marca */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #166534 0%, #22C55E 100%)' }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--sst-dark-700)' }}>Guaicaramo · SG-SST</span>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">

          {/* Header de la card */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #052E16 0%, #166534 100%)' }}>
            <div className="flex items-center gap-2 mb-2">
              <PenLine className="w-4 h-4 text-green-300" />
              <span className="text-[11px] font-semibold text-green-300 uppercase tracking-widest">
                Registro de asistencia
              </span>
            </div>
            <h1 className="text-white font-bold text-[15px] leading-snug">
              {info?.actividadTema ?? 'Capacitación SG-SST'}
            </h1>
            {info?.fechaEjecucion && (
              <div className="flex items-center gap-1.5 mt-2">
                <CalendarDays className="w-3.5 h-3.5 text-green-300" />
                <p className="text-green-200 text-xs">{info.fechaEjecucion}</p>
              </div>
            )}
          </div>

          {/* Formulario */}
          <form onSubmit={enviar} className="px-6 py-5 flex flex-col gap-4">

            {/* Número de documento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Número de documento
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={numDocumento}
                  onChange={e => { setNumDocumento(e.target.value); setPersonalInfo(null) }}
                  placeholder="Ej. 1234567890"
                  autoComplete="off"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300
                    focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600
                    transition-colors bg-gray-50 focus:bg-white w-full pr-10"
                />
                {buscandoCedula && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin inline-block" />
                  </span>
                )}
                {!buscandoCedula && personalInfo?.encontrado && (
                  <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                )}
                {!buscandoCedula && personalInfo && !personalInfo.encontrado && (
                  <UserX className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                )}
              </div>

              {/* Badge resultado de búsqueda */}
              {personalInfo?.encontrado && (
                <div className="rounded-xl px-3 py-2 flex flex-col gap-0.5"
                  style={{ background: 'rgba(22,101,52,0.08)', border: '1px solid rgba(22,101,52,0.2)' }}>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-green-700 shrink-0" />
                    <span className="text-[12px] font-semibold text-green-800">{personalInfo.nombre}</span>
                  </div>
                  {personalInfo.cargo && (
                    <p className="text-[11px] text-green-700 pl-5">{personalInfo.cargo}</p>
                  )}
                  {personalInfo.descripcion_unidad_negocio && (
                    <div className="flex items-center gap-1 pl-5">
                      <Building2 className="w-3 h-3 text-green-600" />
                      <p className="text-[11px] text-green-700">{personalInfo.descripcion_unidad_negocio}</p>
                      {/* Indicar si pertenece a la unidad objetivo */}
                      {info?.dirigidoA && info.dirigidoA !== 'Todo el personal' && (
                        personalInfo.descripcion_unidad_negocio === info.dirigidoA
                          ? <span className="ml-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-300 px-1.5 py-0.5 rounded-full">✓ Unidad objetivo</span>
                          : <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full">Otra unidad</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {personalInfo && !personalInfo.encontrado && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Cédula no encontrada en el sistema. Ingresa tu nombre manualmente.
                </p>
              )}
            </div>

            {/* Nombre de asistente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Nombre de asistente <span className="text-red-400">*</span>
                {personalInfo?.encontrado && (
                  <span className="normal-case font-normal text-green-600 ml-1">(autocompletado)</span>
                )}
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Juan Carlos Gómez"
                required
                autoComplete="name"
                readOnly={!!personalInfo?.encontrado}
                className={`border rounded-xl px-3 py-2.5 text-sm placeholder-gray-300
                  focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600
                  transition-colors
                  ${personalInfo?.encontrado
                    ? 'border-green-200 bg-green-50 text-green-900 cursor-default'
                    : 'border-gray-200 bg-gray-50 focus:bg-white text-gray-900'}`}
              />
            </div>

            {/* Número de teléfono + Cargo o empresa */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Número de teléfono</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej. 3001234567"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300
                    focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600
                    transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cargo o empresa</label>
                <input
                  type="text"
                  value={cargoEmpresa}
                  onChange={e => setCargoEmpresa(e.target.value)}
                  placeholder="Operario / Empresa"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300
                    focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600
                    transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Correo electrónico personal externo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Correo electrónico
                <span className="normal-case font-normal text-gray-400 ml-1">(personal externo)</span>
              </label>
              <input
                type="email"
                inputMode="email"
                value={correoExterno}
                onChange={e => setCorreoExterno(e.target.value)}
                placeholder="Ej. nombre@empresa.com"
                autoComplete="email"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300
                  focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600
                  transition-colors bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Canvas de firma */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <PenLine className="w-3.5 h-3.5 text-gray-400" />
                  Firma digital <span className="text-red-400">*</span>
                </label>
                {firmado && (
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Borrar
                  </button>
                )}
              </div>

              <div className={`relative rounded-xl overflow-hidden touch-none transition-all
                ${firmado
                  ? 'border-2 border-green-500/40 bg-green-50/30'
                  : 'border-2 border-dashed border-gray-200 bg-gray-50'}`}>
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
                    <PenLine className="w-5 h-5 text-gray-300" />
                    <p className="text-[11px] text-gray-300 font-medium">Dibuja tu firma aquí</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={estado === 'enviando' || !nombre.trim() || !firmado}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #052E16 0%, #166534 100%)' }}
            >
              {estado === 'enviando'
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    Registrando…
                  </span>
                : 'Confirmar asistencia'}
            </button>

            {/* Pie de la card */}
            <div className="flex items-center gap-1.5 justify-center pt-1">
              <Shield className="w-3 h-3 text-gray-300" />
              <p className="text-[10px] text-gray-400 text-center">
                Información protegida · Sistema SG-SST Guaicaramo
              </p>
            </div>
          </form>
        </div>

        <p className="text-[10px] mt-5" style={{ color: 'var(--sst-dark-500)' }}>© 2026 Guaicaramo. Todos los derechos reservados.</p>
    </div>
  )
}
