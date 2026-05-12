'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'
import {
  PlayCircle, QrCode, FileText, Lock, X, Copy, Check as CheckIcon,
  AlertTriangle, RefreshCw, CheckCircle, ChevronDown,
} from 'lucide-react'
import { CAP_COLORS } from '@/lib/sst/cap-client'
import { getAuthHeaders } from '@/lib/client/authFetch'
import type { CapProgramacionFields, CapRegistroFields, CapActividadFields, CapEvaluacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { ModalGenerarPDF } from '@/components/sst/capacitaciones/ModalGenerarPDF'
import type { DatosIniciales } from '@/components/sst/capacitaciones/ModalGenerarPDF'

// ─── Modal QR reutilizable ────────────────────────────────────────────────────

function ModalQR({
  url,
  titulo,
  nota,
  onClose,
}: {
  url: string
  titulo: string
  nota?: string
  onClose: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        const ta = document.createElement('textarea')
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.focus(); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      }
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch { /* silencioso */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 flex flex-col gap-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4" style={{ color: CAP_COLORS.verde }} />
            <h3 className="text-sm font-bold text-gray-900">{titulo}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nota informativa */}
        {nota && (
          <div className="flex items-start gap-2 rounded-xl p-3 text-xs text-green-700"
            style={{ background: 'rgba(40,167,69,0.07)', border: '1px solid rgba(40,167,69,0.2)' }}>
            <QrCode className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{nota}</span>
          </div>
        )}

        {/* QR */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="p-4 rounded-2xl bg-white border border-gray-200">
            <QRCode value={url} size={180} fgColor="#052E16" />
          </div>
          <p className="text-[11px] text-gray-400">Escanear con la cámara del celular</p>
        </div>

        {/* URL + copiar */}
        <div className="flex gap-2">
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center gap-1 px-2 py-2 rounded-xl text-xs font-mono overflow-hidden text-green-700"
            style={{ border: '1px solid rgba(40,167,69,0.35)', background: 'rgba(40,167,69,0.06)', wordBreak: 'break-all' }}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span style={{ wordBreak: 'break-all' }}>{url}</span>
          </a>
          <button
            onClick={copiar}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
            style={{ background: CAP_COLORS.verde }}
          >
            {copiado
              ? <><CheckIcon className="w-3.5 h-3.5" /> Copiado</>
              : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Prog     = AirtableRecord<CapProgramacionFields>
type Registro = AirtableRecord<CapRegistroFields>

type Actividad = AirtableRecord<CapActividadFields>
type Evaluacion = AirtableRecord<CapEvaluacionFields>

export interface TabEjecucionesProps {
  actividadId: string
  actividad?: Actividad
  programaciones: Prog[]
  registros: Registro[]
  onRefresh: () => Promise<void>
  toastSuccess: (title: string, msg?: string) => void
  toastError:   (title: string, msg?: string) => void
}

// ─── Formulario vacío ─────────────────────────────────────────────────────────

const FORM_VACÍO = {
  fecha_ejecucion: '',
  lugar:           '',
  convocados:      '',
  presentes:       '',
  facilitador:     '',
  observaciones:   '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string | undefined | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ─── Sub-componente: Fila de registro ejecutado ───────────────────────────────

function FilaEjecutada({
  reg,
  actividadId,
  actividad,
}: {
  reg: Registro
  actividadId: string
  actividad?: Actividad
}) {
  const f = reg.fields
  const pct = f.convocados
    ? Math.round(((f.presentes ?? 0) / f.convocados) * 100)
    : 0

  const [qrUrl,     setQrUrl]     = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [pdfOpen,   setPdfOpen]   = useState(false)

  const generarQRFirma = useCallback(async () => {
    setLoadingQr(true)
    try {
      const res  = await fetch(`/api/sst/capacitaciones/registros/${reg.id}/token`, {
        method: 'POST', headers: getAuthHeaders(),
      })
      const data = await res.json() as { url?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
      setQrUrl(data.url ?? '')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al generar QR')
    }
    setLoadingQr(false)
  }, [reg.id])

  const datosIniciales: DatosIniciales = {
    tipo_actividad:   'CAPACITACIÓN',
    fecha:            f.fecha_ejecucion ?? '',
    duracion_horas:   f.duracion_horas != null ? String(f.duracion_horas) : '',
    lugar:            f.lugar ?? '',
    capacitador:      f.facilitador ?? '',
    num_convocados:   f.convocados != null ? String(f.convocados) : '',
    tema_principal:   f.actividad_tema ?? actividad?.fields.tema ?? '',
    objetivo:         actividad?.fields.objetivo ?? '',
    contenido:        '',
    plan_capacitacion: 'SI',
  }

  return (
    <>
      <div
        className="flex items-start gap-3 px-4 py-3 border-l-4"
        style={{ borderLeftColor: CAP_COLORS.verde }}
      >
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: CAP_COLORS.verde }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800">
              {formatFecha(f.fecha_ejecucion)}
            </span>
            <span className="text-xs text-gray-500">
              {f.presentes ?? 0} / {f.convocados ?? 0} presentes ({pct}%)
            </span>
          </div>
          {f.lugar && (
            <p className="text-xs text-gray-400 mt-0.5">{f.lugar}</p>
          )}
          {f.facilitador && (
            <p className="text-xs text-gray-400">{f.facilitador}</p>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => setPdfOpen(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF GH-FO-1
            </button>
            <button
              onClick={generarQRFirma}
              disabled={loadingQr}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loadingQr
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <QrCode className="w-3.5 h-3.5" />}
              QR firma
            </button>
          </div>
        </div>
      </div>

      {/* Modal QR firma */}
      {qrUrl && (
        <ModalQR
          url={qrUrl}
          titulo="Enlace de firma"
          nota="Comparte el QR o el enlace. Válido por 72 horas. No necesitan cuenta para firmar."
          onClose={() => setQrUrl(null)}
        />
      )}

      {/* Modal generar PDF GH-FO-1 */}
      <ModalGenerarPDF
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        registroId={reg.id}
        actividadId={actividadId}
        datosIniciales={datosIniciales}
        totalAsistentes={f.presentes ?? 0}
      />
    </>
  )
}

// ─── Sub-componente: Fila sin registro (inline form) ─────────────────────────

function FilaPendiente({
  prog,
  actividadId,
  onSuccess,
  toastSuccess,
  toastError,
}: {
  prog: Prog
  actividadId: string
  onSuccess: () => Promise<void>
  toastSuccess: (title: string, msg?: string) => void
  toastError:   (title: string, msg?: string) => void
}) {
  const [open,      setOpen]      = useState(false)
  const [form,      setForm]      = useState(FORM_VACÍO)
  const [formErr,   setFormErr]   = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = useCallback(async () => {
    if (!form.fecha_ejecucion) { setFormErr('La fecha de ejecución es obligatoria.'); return }
    if (!form.lugar)           { setFormErr('El lugar es obligatorio.'); return }
    const conv = parseInt(form.convocados, 10)
    const pres = parseInt(form.presentes, 10)
    if (isNaN(conv) || conv < 1)  { setFormErr('Convocados debe ser al menos 1.'); return }
    if (isNaN(pres) || pres < 0)  { setFormErr('Presentes no puede ser negativo.'); return }
    if (pres > conv)              { setFormErr('Los presentes no pueden superar los convocados.'); return }

    setGuardando(true)
    setFormErr(null)
    try {
      const body: Record<string, unknown> = {
        actividad_id:    actividadId,
        programacion_id: prog.id,
        fecha_ejecucion: form.fecha_ejecucion,
        lugar:           form.lugar,
        convocados:      conv,
        presentes:       pres,
      }
      if (form.facilitador)   body.facilitador   = form.facilitador
      if (form.observaciones) body.observaciones = form.observaciones

      const res = await fetch('/api/sst/capacitaciones/registros', {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? `Error ${res.status}`)
      }

      const data = await res.json()
      const nuevoEstado: string = data.estadoActividad ?? ''
      setOpen(false)
      setForm(FORM_VACÍO)
      toastSuccess(
        'Ejecución registrada',
        nuevoEstado ? `Estado de actividad: ${nuevoEstado}` : 'Sesión marcada como ejecutada.',
      )
      await onSuccess()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      setFormErr(msg)
      toastError('Error al registrar', msg)
    }
    setGuardando(false)
  }, [form, actividadId, prog.id, onSuccess, toastSuccess, toastError])

  return (
    <div
      className="border-l-4 px-4 py-3"
      style={{ borderLeftColor: CAP_COLORS.naranja }}
    >
      {/* Cabecera de la fila */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">
            Sesión — {prog.fields.mes}, Semana {prog.fields.semana}
          </p>
          {prog.fields.fecha_programada && (
            <p className="text-xs text-gray-400">{formatFecha(prog.fields.fecha_programada)}</p>
          )}
        </div>
        <button
          onClick={() => { setOpen(p => !p); setFormErr(null) }}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white"
          style={{ background: CAP_COLORS.naranja }}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          {open ? 'Cancelar' : 'Ejecutar'}
        </button>
      </div>

      {/* Formulario inline */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-700">Registrar ejecución</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Fecha de ejecución *</label>
                  <input type="date" value={form.fecha_ejecucion}
                    onChange={e => setForm(p => ({ ...p, fecha_ejecucion: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Lugar *</label>
                  <input type="text" value={form.lugar}
                    onChange={e => setForm(p => ({ ...p, lugar: e.target.value }))}
                    placeholder="Ej: Sala de reuniones" className="input-field text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Convocados *</label>
                  <input type="number" min={1} value={form.convocados}
                    onChange={e => setForm(p => ({ ...p, convocados: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Presentes *</label>
                  <input type="number" min={0} value={form.presentes}
                    onChange={e => setForm(p => ({ ...p, presentes: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-gray-600">Facilitador</label>
                  <input type="text" value={form.facilitador}
                    onChange={e => setForm(p => ({ ...p, facilitador: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-gray-600">Observaciones</label>
                  <textarea rows={2} value={form.observaciones}
                    onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                    className="input-field text-sm resize-none" />
                </div>
              </div>

              {formErr && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {formErr}
                </div>
              )}

              <div className="flex gap-2 pt-1 border-t border-gray-200">
                <button
                  onClick={() => { setOpen(false); setForm(FORM_VACÍO); setFormErr(null) }}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-xl font-semibold text-white disabled:opacity-60"
                  style={{ background: CAP_COLORS.verde }}
                >
                  {guardando && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {guardando ? 'Guardando…' : 'Guardar ejecución'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Helper: descarga autenticada de PDF de evaluación ──────────────────────

async function descargarPDFEval(evalId: string, nombreTrabajador: string) {
  const res = await fetch(`/api/sst/cap/evaluaciones/${evalId}/pdf`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    alert(`Error al generar el PDF (${res.status})`)
    return
  }
  const blob  = await res.blob()
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = `evaluacion_${(nombreTrabajador || 'trabajador').replace(/[^a-z0-9]/gi, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ─── Sub-componente: botón PDF evaluación con dropdown por trabajador ─────────

function BotonesPDFEval({ regId, evalRealiz }: { regId: string; evalRealiz: number }) {
  const [cargando,    setCargando]    = useState(false)
  const [evals,       setEvals]       = useState<Evaluacion[] | null>(null)
  const [open,        setOpen]        = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  if (evalRealiz === 0) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed"
      >
        <FileText className="w-3.5 h-3.5" />
        PDF GH-FO-14
      </button>
    )
  }

  const cargar = async () => {
    if (evals !== null) { setOpen(p => !p); return }
    setCargando(true)
    try {
      const res  = await fetch(`/api/sst/cap/evaluaciones?id_capacitacion=${regId}`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json() as { records: Evaluacion[] }
      setEvals(data.records ?? [])
      setOpen(true)
    } catch {
      setEvals([])
    }
    setCargando(false)
  }

  const descargar = async (ev: Evaluacion) => {
    setDescargando(ev.id)
    await descargarPDFEval(ev.id, ev.fields.nombre_trabajador ?? ev.id)
    setDescargando(null)
  }

  return (
    <div className="relative">
      <button
        onClick={cargar}
        disabled={cargando}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {cargando
          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          : <FileText className="w-3.5 h-3.5" />}
        PDF GH-FO-14
        {!cargando && <ChevronDown className="w-3 h-3" />}
      </button>

      {open && evals && evals.length > 0 && (
        <>
          {/* Overlay para cerrar */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] bg-white rounded-xl border border-gray-200 shadow-lg py-1">
            {evals.map(ev => (
              <button
                key={ev.id}
                onClick={() => descargar(ev)}
                disabled={descargando === ev.id}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
              >
                {descargando === ev.id
                  ? <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                  : <FileText className="w-3 h-3 shrink-0" style={{ color: CAP_COLORS.verde }} />}
                <span className="truncate">{ev.fields.nombre_trabajador ?? ev.id}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {open && evals && evals.length === 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white rounded-xl border border-gray-200 shadow-lg px-3 py-2">
            <p className="text-xs text-gray-400">No hay evaluaciones registradas aún.</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TabEjecuciones({
  actividadId,
  actividad,
  programaciones,
  registros,
  onRefresh,
  toastSuccess,
  toastError,
}: TabEjecucionesProps) {
  const completado = registros.length > 0 &&
    programaciones.length > 0 &&
    programaciones.every(p => p.fields.estado === 'Ejecutado' || p.fields.estado === 'Cancelado')

  // Estado para QR de evaluación
  const [qrEvalUrl,      setQrEvalUrl]      = useState<string | null>(null)
  const [loadingQrEval,  setLoadingQrEval]  = useState<string | null>(null) // reg.id que está cargando

  const generarQREvaluacion = useCallback(async (regId: string) => {
    setLoadingQrEval(regId)
    try {
      const res  = await fetch('/api/sst/cap/plantillas', { headers: getAuthHeaders() })
      const data = await res.json() as { records?: { id: string; fields: { qr_token: string; id_capacitacion?: string; nombre_capacitacion: string } }[] }
      const plantilla = (data.records ?? []).find(p => p.fields.id_capacitacion === regId)
      if (!plantilla) {
        alert('No hay plantilla de evaluación vinculada a esta sesión. Créala en Capacitaciones → Evaluaciones.')
      } else {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        setQrEvalUrl(`${origin}/evaluacion/${plantilla.fields.qr_token}`)
      }
    } catch {
      alert('Error al buscar la plantilla de evaluación.')
    }
    setLoadingQrEval(null)
  }, [])

  // Mapa programacion_id → registro
  const regByProg = new Map<string, Registro>()
  for (const r of registros) {
    if (r.fields.programacion_id) regByProg.set(r.fields.programacion_id, r)
  }
  // Registros sin programacion_id asignada
  const regHuerfanos = registros.filter(r => !r.fields.programacion_id)

  const totalEvaluaciones = registros.reduce(
    (acc, r) => acc + (r.fields.evaluaciones_realizadas ?? 0),
    0,
  )

  return (
    <>
    <div className="flex flex-col gap-4">

      {/* ── Sección 1: Registros de ejecución ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Ejecuciones
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({registros.length} de {programaciones.length})
            </span>
          </h3>
        </div>

        {programaciones.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            Primero programa al menos una sesión en la pestaña &quot;Programación&quot;.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Programaciones con registro existente */}
            {programaciones.map(prog => {
              const reg = regByProg.get(prog.id)
              if (reg) {
                return (
                  <FilaEjecutada key={prog.id} reg={reg} actividadId={actividadId} actividad={actividad} />
                )
              }
              return (
                <FilaPendiente
                  key={prog.id}
                  prog={prog}
                  actividadId={actividadId}
                  onSuccess={onRefresh}
                  toastSuccess={toastSuccess}
                  toastError={toastError}
                />
              )
            })}

            {/* Registros huérfanos (sin programacion_id) */}
            {regHuerfanos.map(reg => (
              <FilaEjecutada key={reg.id} reg={reg} actividadId={actividadId} actividad={actividad} />
            ))}
          </div>
        )}
      </div>

      {/* ── Sección 2: Evaluación GH-FO-14 ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Evaluación de eficacia — GH-FO-14
          </h3>
        </div>

        {registros.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-4 rounded-b-xl"
            style={{ background: '#f9fafb', border: '1.5px dashed #d1d5db' }}>
            <Lock className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-400">
              Disponible después de registrar la primera ejecución.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {registros.map(reg => {
              const evalRealiz = reg.fields.evaluaciones_realizadas ?? 0
              const evalAprob  = reg.fields.evaluaciones_aprobadas  ?? 0
              const pct        = evalRealiz > 0
                ? Math.round((evalAprob / evalRealiz) * 100)
                : 0

              return (
                <div key={reg.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {reg.fields.fecha_ejecucion
                        ? `Sesión del ${formatFecha(reg.fields.fecha_ejecucion)}`
                        : 'Sesión sin fecha'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Evaluaciones: {evalRealiz} realizadas · {evalAprob} aprobadas
                      {evalRealiz > 0 && ` (${pct}% eficacia)`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => generarQREvaluacion(reg.id)}
                      disabled={loadingQrEval === reg.id}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {loadingQrEval === reg.id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <QrCode className="w-3.5 h-3.5" />}
                      QR evaluación
                    </button>
                    <BotonesPDFEval
                      regId={reg.id}
                      evalRealiz={evalRealiz}
                    />
                  </div>
                </div>
              )
            })}

            {/* Resumen total evaluaciones */}
            {totalEvaluaciones > 0 && (
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Total evaluaciones registradas: <strong>{totalEvaluaciones}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>

    {/* Modal QR evaluación */}
    {qrEvalUrl && (
      <ModalQR
        url={qrEvalUrl}
        titulo="QR de evaluación GH-FO-14"
        nota="Comparte el QR para que los participantes completen la evaluación de eficacia."
        onClose={() => setQrEvalUrl(null)}
      />
    )}
  </>
  )
}
