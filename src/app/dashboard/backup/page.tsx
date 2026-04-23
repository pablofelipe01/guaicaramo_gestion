'use client'

import { useState, useEffect } from 'react'
import { Download, Database, CheckSquare, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ModuloInfo {
  modulo: string
  fase: string
  cantidadTablas: number
}

const FASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PLANEAR:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  HACER:     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  VERIFICAR: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  ACTUAR:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  ADMIN:     { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200' },
}

export default function BackupPage() {
  const [modulos, setModulos] = useState<ModuloInfo[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingModulos, setLoadingModulos] = useState(true)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/backup', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setModulos(data.modulos ?? [])
        setSeleccionados(new Set((data.modulos ?? []).map((m: ModuloInfo) => m.modulo)))
      })
      .finally(() => setLoadingModulos(false))
  }, [])

  const fases = [...new Set(modulos.map((m) => m.fase))]

  const toggleModulo = (nombre: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  const toggleFase = (fase: string) => {
    const deFase = modulos.filter((m) => m.fase === fase).map((m) => m.modulo)
    const todosSeleccionados = deFase.every((n) => seleccionados.has(n))
    setSeleccionados((prev) => {
      const next = new Set(prev)
      deFase.forEach((n) => (todosSeleccionados ? next.delete(n) : next.add(n)))
      return next
    })
  }

  const seleccionarTodos = () =>
    setSeleccionados(new Set(modulos.map((m) => m.modulo)))

  const deseleccionarTodos = () => setSeleccionados(new Set())

  const generarBackup = async () => {
    if (seleccionados.size === 0) return
    setLoading(true)
    setEstado(null)
    try {
      const token = localStorage.getItem('token')
      const body = seleccionados.size === modulos.length
        ? {}
        : { modulos: [...seleccionados] }

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      const blob = await res.blob()
      const fecha = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-sgsst-${fecha}.json`
      a.click()
      URL.revokeObjectURL(url)

      const kb = (blob.size / 1024).toFixed(1)
      setEstado({ tipo: 'ok', mensaje: `Backup generado correctamente (${kb} KB)` })
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: 'Error al generar el backup. Intenta de nuevo.' })
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const totalTablas = modulos
    .filter((m) => seleccionados.has(m.modulo))
    .reduce((s, m) => s + m.cantidadTablas, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Backup del Sistema</h1>
          <p className="text-sm text-gray-500">Exporta todos los datos del SG-SST en formato JSON</p>
        </div>
      </div>

      {estado && (
        <div className={[
          'flex items-center gap-2 px-4 py-3 rounded-lg text-sm',
          estado.tipo === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200',
        ].join(' ')}>
          {estado.tipo === 'ok'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {estado.mensaje}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Seleccionar módulos</h2>
          <div className="flex gap-3">
            <button
              onClick={seleccionarTodos}
              className="text-xs text-blue-600 hover:underline"
            >
              Todos
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deseleccionarTodos}
              className="text-xs text-gray-500 hover:underline"
            >
              Ninguno
            </button>
          </div>
        </div>

        {loadingModulos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {fases.map((fase) => {
              const cols = FASE_COLORS[fase] ?? FASE_COLORS.ADMIN
              const deFase = modulos.filter((m) => m.fase === fase)
              const todosSelFase = deFase.every((m) => seleccionados.has(m.modulo))
              const algunoSelFase = deFase.some((m) => seleccionados.has(m.modulo))

              return (
                <div key={fase} className={['rounded-lg border p-4', cols.border, cols.bg].join(' ')}>
                  <button
                    onClick={() => toggleFase(fase)}
                    className="flex items-center gap-2 mb-3 w-full text-left"
                  >
                    {todosSelFase ? (
                      <CheckSquare className={['w-4 h-4', cols.text].join(' ')} />
                    ) : algunoSelFase ? (
                      <CheckSquare className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={['text-xs font-bold uppercase tracking-wide', cols.text].join(' ')}>
                      {fase}
                    </span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deFase.map((m) => {
                      const sel = seleccionados.has(m.modulo)
                      return (
                        <button
                          key={m.modulo}
                          onClick={() => toggleModulo(m.modulo)}
                          className={[
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors text-left',
                            sel
                              ? 'bg-white border-gray-300 text-gray-800'
                              : 'bg-white/50 border-transparent text-gray-400',
                          ].join(' ')}
                        >
                          {sel
                            ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                            : <Square className="w-4 h-4 shrink-0" />}
                          <span className="flex-1 truncate">{m.modulo}</span>
                          <span className="text-xs text-gray-400 shrink-0">{m.cantidadTablas}t</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{seleccionados.size}</span> módulos seleccionados
          {' · '}
          <span className="font-semibold text-gray-900">{totalTablas}</span> tablas
        </div>
        <button
          onClick={generarBackup}
          disabled={loading || seleccionados.size === 0}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? 'Generando backup...' : 'Descargar Backup'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
        <strong>Nota:</strong> El backup contiene todos los registros de las tablas seleccionadas en formato JSON.
        El proceso puede tardar varios segundos dependiendo del volumen de datos.
        Los archivos incluyen campos confidenciales — guarda el backup en un lugar seguro.
      </div>
    </div>
  )
}
