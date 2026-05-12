'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { QRDisplay } from '@/components/sst/capacitaciones/QRDisplay'
import {
  ArrowLeft, ClipboardList, Plus, Search, Filter, Download,
  QrCode, CheckCircle2, XCircle, FileText, ChevronDown,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/client/authFetch'
import type { CapPlantillaFields, CapEvaluacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Plantilla  = AirtableRecord<CapPlantillaFields>
type Evaluacion = AirtableRecord<CapEvaluacionFields>

// ─── Colores ──────────────────────────────────────────────────────────────────
const VERDE = '#28A745'

// ─── Modal de nueva plantilla ─────────────────────────────────────────────────
interface PreguntaSeleccion {
  texto: string
  opciones: string[]   // hasta 5 opciones como strings
  correcta: string     // índice 0-based como string, ej. "0"
}

interface PlantillaFormState {
  nombre_capacitacion: string
  pregunta_1_texto: string
  preguntas: [PreguntaSeleccion, PreguntaSeleccion, PreguntaSeleccion]
}

// Tipo que se envía al servidor (coincide con CapPlantillaFields)
interface PlantillaPayload {
  nombre_capacitacion: string
  pregunta_1_texto: string
  pregunta_2_texto: string
  pregunta_2_opciones: string
  pregunta_2_correcta: string
  pregunta_3_texto: string
  pregunta_3_opciones: string
  pregunta_3_correcta: string
  pregunta_4_texto: string
  pregunta_4_opciones: string
  pregunta_4_correcta: string
  activo: boolean
  id_capacitacion?: string
}

interface ActividadOpcion {
  id: string
  tema: string
}

const PREGUNTA_VACIA = (): PreguntaSeleccion => ({ texto: '', opciones: ['', '', ''], correcta: '' })

const FORM_INICIAL = (): PlantillaFormState => ({
  nombre_capacitacion: '',
  pregunta_1_texto:    '¿Cómo aplicaría estos conocimientos en su trabajo y/o a nivel personal?',
  preguntas:           [PREGUNTA_VACIA(), PREGUNTA_VACIA(), PREGUNTA_VACIA()],
})

const inputCls   = 'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors bg-white'
const inputStyle = (focused?: boolean) => ({
  borderColor: focused ? VERDE : '#dee2e6',
  color: '#212529',
})

function NuevaPlantillaForm({
  onGuardar,
  onCancelar,
}: {
  onGuardar: (data: PlantillaPayload) => Promise<void>
  onCancelar: () => void
}) {
  const [form, setForm]       = useState<PlantillaFormState>(FORM_INICIAL)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [openQ, setOpenQ]     = useState<number>(0)
  const [actividades, setActividades] = useState<ActividadOpcion[]>([])
  const [actividadId, setActividadId] = useState('')

  // Cargar actividades al montar
  useEffect(() => {
    fetch('/api/sst/capacitaciones', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then((data: { records?: Array<{ id: string; fields: { tema: string } }> }) => {
        const opts = (data.records ?? []).map(r => ({ id: r.id, tema: r.fields.tema ?? r.id }))
        setActividades(opts)
      })
      .catch(() => { /* ignorar — el selector queda vacío */ })
  }, [])

  const setNombre = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, nombre_capacitacion: e.target.value }))

  const setP1 = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, pregunta_1_texto: e.target.value }))

  const setPregunta = (i: number, field: keyof PreguntaSeleccion, value: string) =>
    setForm(prev => {
      const preguntas = prev.preguntas.map((p, idx) =>
        idx === i ? { ...p, [field]: value } : p
      ) as PlantillaFormState['preguntas']
      return { ...prev, preguntas }
    })

  const setOpcion = (pi: number, oi: number, value: string) =>
    setForm(prev => {
      const preguntas = prev.preguntas.map((p, idx) => {
        if (idx !== pi) return p
        const opciones = p.opciones.map((o, j) => j === oi ? value : o)
        return { ...p, opciones }
      }) as PlantillaFormState['preguntas']
      return { ...prev, preguntas }
    })

  const addOpcion = (pi: number) =>
    setForm(prev => {
      const preguntas = prev.preguntas.map((p, idx) =>
        idx === pi && p.opciones.length < 5 ? { ...p, opciones: [...p.opciones, ''] } : p
      ) as PlantillaFormState['preguntas']
      return { ...prev, preguntas }
    })

  const removeOpcion = (pi: number, oi: number) =>
    setForm(prev => {
      const preguntas = prev.preguntas.map((p, idx) => {
        if (idx !== pi || p.opciones.length <= 2) return p
        const opciones = p.opciones.filter((_, j) => j !== oi)
        const correcta = p.correcta === String(oi) ? '' : p.correcta
        return { ...p, opciones, correcta }
      }) as PlantillaFormState['preguntas']
      return { ...prev, preguntas }
    })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombre_capacitacion.trim()) { setError('El nombre de la capacitación es obligatorio.'); return }
    if (!form.pregunta_1_texto.trim())    { setError('La Pregunta 1 no puede estar vacía.'); return }

    for (let i = 0; i < 3; i++) {
      const p = form.preguntas[i]
      if (!p.texto.trim()) { setOpenQ(i + 2); setError(`La Pregunta ${i + 2} necesita enunciado.`); return }
      const validas = p.opciones.filter(o => o.trim())
      if (validas.length < 2) { setOpenQ(i + 2); setError(`La Pregunta ${i + 2} necesita al menos 2 opciones.`); return }
      const unicasSet = new Set(validas.map(o => o.toLowerCase()))
      if (unicasSet.size !== validas.length) { setOpenQ(i + 2); setError(`La Pregunta ${i + 2} tiene opciones duplicadas.`); return }
      if (p.correcta === '') { setOpenQ(i + 2); setError(`Selecciona la respuesta correcta de la Pregunta ${i + 2}.`); return }
    }

    const toPayload = (p: PreguntaSeleccion) => ({
      texto:    p.texto,
      opciones: JSON.stringify(p.opciones.filter(o => o.trim())),
      correcta: p.opciones.filter(o => o.trim())[Number(p.correcta)] ?? '',
    })

    const [p2, p3, p4] = form.preguntas.map(toPayload)

    setSaving(true)
    try {
      await onGuardar({
        nombre_capacitacion:  form.nombre_capacitacion,
        pregunta_1_texto:     form.pregunta_1_texto,
        pregunta_2_texto:     p2.texto,
        pregunta_2_opciones:  p2.opciones,
        pregunta_2_correcta:  p2.correcta,
        pregunta_3_texto:     p3.texto,
        pregunta_3_opciones:  p3.opciones,
        pregunta_3_correcta:  p3.correcta,
        pregunta_4_texto:     p4.texto,
        pregunta_4_opciones:  p4.opciones,
        pregunta_4_correcta:  p4.correcta,
        activo:               true,
        ...(actividadId ? { id_capacitacion: actividadId } : {}),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSaving(false)
    }
  }

  const LETRA = ['A', 'B', 'C', 'D', 'E']

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" style={{ maxHeight: '74vh', overflowY: 'auto', paddingRight: 2, overflowX: 'visible' }}>

      {/* Actividad asociada */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: '#495057' }}>
          Actividad del plan anual
          <span className="ml-1 font-normal" style={{ color: '#6C757D' }}>(opcional — para vincular evaluaciones automáticamente)</span>
        </label>
        <div className="relative">
          <select
            value={actividadId}
            onChange={e => {
              const sel = actividades.find(a => a.id === e.target.value)
              setActividadId(e.target.value)
              // Rellenar nombre si aún está vacío
              if (sel && !form.nombre_capacitacion.trim()) {
                setForm(prev => ({ ...prev, nombre_capacitacion: sel.tema }))
              }
            }}
            className={inputCls}
            style={{ ...inputStyle(), paddingRight: '2rem', appearance: 'none' }}
            onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
            onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
          >
            <option value="">— Sin vincular —</option>
            {actividades.map(a => (
              <option key={a.id} value={a.id}>{a.tema}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#6C757D' }} />
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: '#495057' }}>
          Nombre de la capacitación <span style={{ color: '#DC3545' }}>*</span>
        </label>
        <input
          type="text"
          value={form.nombre_capacitacion}
          onChange={setNombre}
          placeholder="Ej: Trabajo en alturas nivel I"
          className={inputCls}
          style={inputStyle()}
          onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
          onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      <hr style={{ borderColor: '#f0f0f0' }} />
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6C757D' }}>Preguntas de evaluación</p>

      {/* Pregunta 1 — texto abierto */}
      <div className="rounded-xl" style={{ border: '1px solid #dee2e6' }}>
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left"
          style={{ background: openQ === 0 ? '#f0fdf4' : '#fafafa', color: '#212529' }}
          onClick={() => setOpenQ(openQ === 0 ? -1 : 0)}
        >
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white" style={{ background: '#28A745' }}>1</span>
            {form.pregunta_1_texto.trim() || 'Pregunta 1 — Texto abierto'}
          </span>
          <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ transform: openQ === 0 ? 'rotate(180deg)' : '' }} />
        </button>
        {openQ === 0 && (
          <div className="p-4 pt-3">
            <label className="block text-xs font-medium mb-2" style={{ color: '#6C757D' }}>
              Enunciado <span style={{ color: '#DC3545' }}>*</span>
            </label>
            <input
              type="text"
              value={form.pregunta_1_texto}
              onChange={setP1}
              placeholder="¿Enunciado de la pregunta?"
              className={inputCls}
              style={inputStyle()}
              onFocus={e => { e.target.style.borderColor = VERDE; e.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
              onBlur={e  => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none' }}
            />
            <p className="text-xs mt-2" style={{ color: '#6C757D' }}>
              El trabajador responderá con texto libre. No tiene respuesta incorrecta.
            </p>
          </div>
        )}
      </div>

      {/* Preguntas 2, 3 y 4 — selección */}
      {([0, 1, 2] as const).map(i => {
        const p    = form.preguntas[i]
        const n    = i + 2
        const open = openQ === n

        return (
          <div key={i} className="rounded-xl" style={{ border: `1px solid ${open ? '#28A74550' : '#dee2e6'}`, background: open ? '#fafffe' : '#fff' }}>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left"
              style={{ background: open ? '#f0fdf4' : '#fafafa', color: '#212529' }}
              onClick={() => setOpenQ(open ? -1 : n)}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#28A745' }}>{n}</span>
                <span className="truncate">{p.texto.trim() || `Pregunta ${n} — Selección múltiple`}</span>
              </span>
              <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform ml-2" style={{ transform: open ? 'rotate(180deg)' : '' }} />
            </button>

            {open && (
              <div className="px-4 pb-5 pt-3 flex flex-col gap-5">
                {/* Enunciado */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#6C757D' }}>
                    Enunciado <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={p.texto}
                    onChange={e => setPregunta(i, 'texto', e.target.value)}
                    placeholder="¿Enunciado de la pregunta?"
                    className={inputCls}
                    style={inputStyle()}
                    onFocus={ev => { ev.target.style.borderColor = VERDE; ev.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                    onBlur={ev  => { ev.target.style.borderColor = '#dee2e6'; ev.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Opciones */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium" style={{ color: '#6C757D' }}>
                      Opciones <span style={{ color: '#DC3545' }}>*</span>
                    </label>
                    <span className="text-[10px]" style={{ color: '#aaa' }}>
                      Marca la correcta con ●
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {p.opciones.map((op, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        {/* Radio correcta */}
                        <button
                          type="button"
                          title="Marcar como correcta"
                          onClick={() => setPregunta(i, 'correcta', String(oi))}
                          className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
                          style={{
                            borderColor: p.correcta === String(oi) ? VERDE : '#dee2e6',
                            background:  p.correcta === String(oi) ? VERDE : '#fff',
                          }}
                        >
                          {p.correcta === String(oi) && (
                            <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                          )}
                        </button>

                        {/* Letra */}
                        <span className="text-xs font-bold w-4 text-center flex-shrink-0" style={{ color: '#6C757D' }}>
                          {LETRA[oi]}
                        </span>

                        {/* Input */}
                        <input
                          type="text"
                          value={op}
                          onChange={e => setOpcion(i, oi, e.target.value)}
                          placeholder={`Opción ${LETRA[oi]}`}
                          className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition-all bg-white"
                          style={{
                            borderColor: p.correcta === String(oi) ? `${VERDE}70` : '#dee2e6',
                            color: '#212529',
                            boxShadow: p.correcta === String(oi) ? `0 0 0 2px ${VERDE}20` : 'none',
                          }}
                          onFocus={ev => { ev.target.style.borderColor = VERDE; ev.target.style.boxShadow = `0 0 0 3px ${VERDE}20` }}
                          onBlur={ev  => {
                            ev.target.style.borderColor = p.correcta === String(oi) ? `${VERDE}70` : '#dee2e6'
                            ev.target.style.boxShadow   = p.correcta === String(oi) ? `0 0 0 2px ${VERDE}20` : 'none'
                          }}
                        />

                        {/* Eliminar */}
                        {p.opciones.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOpcion(i, oi)}
                            className="flex-shrink-0 text-xs px-2 py-1.5 rounded-lg transition-colors"
                            style={{ color: '#DC3545', background: '#fff5f5' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {p.opciones.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addOpcion(i)}
                      className="mt-2 text-xs px-3 py-1.5 rounded-xl border transition-colors"
                      style={{ borderColor: `${VERDE}40`, color: VERDE, background: '#f0fdf4' }}
                    >
                      + Agregar opción
                    </button>
                  )}

                  {p.correcta === '' && p.texto && (
                    <p className="text-[10px] mt-1.5" style={{ color: '#F59E0B' }}>
                      ⚠ Selecciona cuál es la respuesta correcta haciendo clic en el círculo
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {error && (
        <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: '#fff5f5', border: '1px solid #f5c6cb' }}>
          <span className="text-base leading-none mt-0.5">⚠</span>
          <p className="text-xs" style={{ color: '#721c24' }}>{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1 sticky bottom-0 bg-white pb-1">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
          style={{ borderColor: '#dee2e6', color: '#6C757D' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: saving ? '#a8d5b5' : VERDE }}
        >
          {saving ? 'Guardando...' : 'Crear plantilla'}
        </button>
      </div>
    </form>
  )
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================
export default function EvaluacionesAdminPage() {
  const router = useRouter()

  const [tab, setTab]                 = useState<'evaluaciones' | 'plantillas'>('evaluaciones')
  const [evaluaciones, setEval]       = useState<Evaluacion[]>([])
  const [plantillas, setPlantillas]   = useState<Plantilla[]>([])
  const [loading, setLoading]         = useState(true)

  // Filtros evaluaciones
  const [busqueda, setBusqueda]         = useState('')
  const [filtroArea, setFiltroArea]     = useState('')
  const [filtroPuntaje, setFiltroPuntaje] = useState('')

  // Modales
  const [modalQR, setModalQR]             = useState<Plantilla | null>(null)
  const [modalNueva, setModalNueva]       = useState(false)
  const [descargando, setDescargando]     = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [evRes, plRes] = await Promise.all([
      fetch('/api/sst/cap/evaluaciones', { headers: getAuthHeaders() }),
      fetch('/api/sst/cap/plantillas',   { headers: getAuthHeaders() }),
    ])
    if (evRes.ok)  setEval((await evRes.json()).records ?? [])
    if (plRes.ok)  setPlantillas((await plRes.json()).records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const crearPlantilla = async (data: PlantillaPayload) => {
    let res: Response
    try {
      res = await fetch('/api/sst/cap/plantillas', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
    } catch {
      throw new Error('Sin conexión con el servidor. Verifica que la aplicación esté corriendo.')
    }
    if (!res.ok) {
      const err = await res.json() as { message?: string }
      throw new Error(err.message ?? 'Error al crear plantilla')
    }
    setModalNueva(false)
    await cargar()
  }

  const descargarPDF = async (id: string, nombre: string, fecha: string) => {
    setDescargando(id)
    try {
      const res = await fetch(`/api/sst/cap/evaluaciones/${id}/pdf`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Error generando PDF')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `evaluacion_${nombre.replace(/\s+/g, '_')}_${fecha}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDescargando(null)
    }
  }

  // Filtrado local
  const evalFiltradas = evaluaciones.filter(e => {
    const f = e.fields
    const txt = busqueda.toLowerCase()
    if (busqueda && !f.nombre_trabajador?.toLowerCase().includes(txt) &&
        !f.nombre_capacitacion?.toLowerCase().includes(txt)) return false
    if (filtroArea && f.area !== filtroArea) return false
    if (filtroPuntaje && f.puntaje < Number(filtroPuntaje)) return false
    return true
  })

  const areas = [...new Set(evaluaciones.map(e => e.fields.area).filter(Boolean))] as string[]

  // KPIs
  const totalEval    = evaluaciones.length
  const aprobadas    = evaluaciones.filter(e => e.fields.puntaje >= 7.5).length
  const pctAprobados = totalEval > 0 ? Math.round((aprobadas / totalEval) * 100) : 0
  const promedioPts  = totalEval > 0
    ? (evaluaciones.reduce((s, e) => s + (e.fields.puntaje ?? 0), 0) / totalEval).toFixed(1)
    : '—'

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--sst-dark-500)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: VERDE }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>
              Evaluaciones de Eficacia
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--sst-dark-500)' }}>
            GH-FO-14 · Decreto 1072/2015 · Resolución 0312/2019
          </p>
        </div>
        <button
          onClick={() => setModalNueva(true)}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Nueva Plantilla
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total evaluaciones', value: totalEval,    color: 'var(--sst-dark-700)', bg: 'var(--sst-dark-100)' },
          { label: 'Aprobadas',          value: aprobadas,    color: VERDE,                  bg: '#f0fdf4' },
          { label: '% Aprobación',       value: `${pctAprobados}%`, color: pctAprobados >= 80 ? VERDE : pctAprobados >= 60 ? '#F59E0B' : '#DC3545', bg: 'var(--sst-dark-100)' },
          { label: 'Promedio puntaje',   value: promedioPts,  color: '#28A745',              bg: '#e8f5eb' },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--sst-dark-500)' }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: 'var(--font-poppins)' }}>{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 rounded-xl p-1" style={{ background: 'var(--sst-dark-100)', width: 'fit-content' }}>
        {([
          { key: 'evaluaciones', label: 'Historial', icon: FileText },
          { key: 'plantillas',   label: 'Plantillas', icon: QrCode },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === key ? '#fff' : 'transparent',
              color:      tab === key ? VERDE  : 'var(--sst-dark-500)',
              boxShadow:  tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Historial ─────────────────────────────────────────────────── */}
      {tab === 'evaluaciones' && (
        <Card className="p-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 rounded-xl border px-3" style={{ borderColor: 'var(--border)', height: 38 }}>
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--sst-dark-500)' }} />
              <input
                type="text"
                placeholder="Buscar trabajador o capacitación..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="flex-1 text-xs bg-transparent outline-none border-none"
                style={{ color: 'var(--sst-dark-900)' }}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border px-3" style={{ borderColor: 'var(--border)', height: 38 }}>
              <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--sst-dark-500)' }} />
              <select
                value={filtroArea}
                onChange={e => setFiltroArea(e.target.value)}
                className="text-xs bg-transparent outline-none border-none"
                style={{ color: filtroArea ? 'var(--sst-dark-900)' : 'var(--sst-dark-500)' }}
              >
                <option value="">Todas las áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border px-3" style={{ borderColor: 'var(--border)', height: 38 }}>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--sst-dark-500)' }}>Puntaje mín.</span>
              <select
                value={filtroPuntaje}
                onChange={e => setFiltroPuntaje(e.target.value)}
                className="text-xs bg-transparent outline-none border-none"
                style={{ color: filtroPuntaje ? 'var(--sst-dark-900)' : 'var(--sst-dark-500)' }}
              >
                <option value="">Todos</option>
                <option value="7.5">≥ 7.5 (aprobados)</option>
                <option value="5">≥ 5.0</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: VERDE, borderTopColor: 'transparent' }} />
            </div>
          ) : evalFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--sst-dark-300)' }} />
              <p className="text-sm" style={{ color: 'var(--sst-dark-500)' }}>Sin evaluaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead style={{ background: 'var(--sst-dark-100)' }}>
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Trabajador</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Capacitación</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Fecha</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--sst-dark-500)' }}>Área</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Puntaje</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Estado</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evalFiltradas.map((ev, i) => {
                    const f         = ev.fields
                    const aprobada  = f.puntaje >= 7.5
                    const cargando  = descargando === ev.id
                    return (
                      <tr key={ev.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--sst-dark-100)' }}>
                        <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--sst-dark-800)' }}>
                          <div>
                            <span className="block">{f.nombre_trabajador}</span>
                            <span className="text-[10px] sm:hidden block mt-0.5" style={{ color: 'var(--sst-dark-500)' }}>
                              {f.nombre_capacitacion}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell text-xs max-w-[180px]" style={{ color: 'var(--sst-dark-700)' }}>
                          <span className="line-clamp-2">{f.nombre_capacitacion}</span>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-xs" style={{ color: 'var(--sst-dark-600)' }}>{f.fecha}</td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-xs" style={{ color: 'var(--sst-dark-600)' }}>{f.area}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{
                              background: aprobada ? '#d4edda' : '#f8d7da',
                              color:      aprobada ? '#155724'  : '#721c24',
                            }}
                          >
                            {f.puntaje?.toFixed(1)} / 10
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {aprobada ? (
                            <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: VERDE }} />
                          ) : (
                            <XCircle className="w-4 h-4 mx-auto" style={{ color: '#DC3545' }} />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => descargarPDF(ev.id, f.nombre_trabajador, f.fecha)}
                            disabled={cargando}
                            title="Descargar PDF"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: cargando ? '#aaa' : 'var(--sst-dark-500)' }}
                            onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = 'var(--sst-dark-100)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '' }}
                          >
                            {cargando
                              ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: VERDE, borderTopColor: 'transparent' }} />
                              : <Download className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Tab Plantillas ────────────────────────────────────────────────── */}
      {tab === 'plantillas' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: VERDE, borderTopColor: 'transparent' }} />
            </div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-16">
              <QrCode className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--sst-dark-300)' }} />
              <p className="text-sm mb-3" style={{ color: 'var(--sst-dark-500)' }}>Sin plantillas creadas</p>
              <button onClick={() => setModalNueva(true)} className="text-sm hover:underline" style={{ color: VERDE }}>
                Crear primera plantilla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantillas.map(pl => {
                const totalEvalPlantilla = evaluaciones.filter(e => e.fields.qr_token === pl.fields.qr_token).length
                return (
                  <Card key={pl.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--sst-dark-900)' }}>
                          {pl.fields.nombre_capacitacion}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--sst-dark-500)' }}>
                          {totalEvalPlantilla} evaluacion{totalEvalPlantilla !== 1 ? 'es' : ''} registradas
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: pl.fields.activo ? '#d4edda' : '#e9ecef',
                          color:      pl.fields.activo ? '#155724' : '#6C757D',
                        }}
                      >
                        {pl.fields.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <button
                      onClick={() => setModalQR(pl)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: '#f0fdf4', color: VERDE, border: `1px solid ${VERDE}30` }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4' }}
                    >
                      <QrCode className="w-4 h-4" />
                      Ver QR
                    </button>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal QR */}
      <Modal
        open={!!modalQR}
        onClose={() => setModalQR(null)}
        title={`QR — ${modalQR?.fields.nombre_capacitacion ?? ''}`}
      >
        {modalQR && (
          <QRDisplay
            token={modalQR.fields.qr_token}
            nombreCapacitacion={modalQR.fields.nombre_capacitacion}
          />
        )}
      </Modal>

      {/* Modal nueva plantilla */}
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva Plantilla de Evaluación">
        <NuevaPlantillaForm onGuardar={crearPlantilla} onCancelar={() => setModalNueva(false)} />
      </Modal>
    </div>
  )
}
