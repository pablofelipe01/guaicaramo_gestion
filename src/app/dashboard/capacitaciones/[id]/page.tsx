'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EstadoBadge } from '@/components/sst/capacitaciones/EstadoBadge'
import { RegistroForm } from '@/components/sst/capacitaciones/RegistroForm'
import { TimelineActividad } from '@/components/sst/capacitaciones/TimelineActividad'
import { BarraMensual } from '@/components/sst/capacitaciones/BarraMensual'
import { getCategoriaColor, calcularPct } from '@/lib/sst/cap-client'
import {
  ArrowLeft, Award, Users, Calendar, ClipboardCheck, BookOpen,
  AlertTriangle, Plus, Target, Pencil, Trash2, PenLine, Link2,
  Copy, CheckCircle2, UserPlus, ExternalLink,
} from 'lucide-react'
import type { CapActividadFields, CapProgramacionFields, CapRegistroFields, CapAsistenciaRegistroFields, CapCategoria, CapProveedor } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { getAuthHeaders } from '@/lib/client/authFetch'
import QRCode from 'react-qr-code'
import { ModalGenerarPDF } from '@/components/sst/capacitaciones/ModalGenerarPDF'
import type { DatosIniciales } from '@/components/sst/capacitaciones/ModalGenerarPDF'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>
type Registro = AirtableRecord<CapRegistroFields>
type Asistencia = AirtableRecord<CapAsistenciaRegistroFields>

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function CapacitacionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [actividad, setActividad] = useState<Actividad | null>(null)
  const [programaciones, setProgramaciones] = useState<Prog[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalRegistro, setModalRegistro] = useState(false)
  const [modalProg, setModalProg] = useState(false)
  const [formProg, setFormProg] = useState({ mes: 'Enero', semana: '1', fecha_programada: '' })
  const [guardandoProg, setGuardandoProg] = useState(false)
  // Editar actividad
  const [modalEditar, setModalEditar] = useState(false)
  const [formEdit, setFormEdit] = useState<Partial<CapActividadFields>>({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  // Eliminar actividad
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  // Asistencias individuales
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [registroSeleccionado, setRegistroSeleccionado] = useState<string | null>(null)
  const [cargandoAsistencias, setCargandoAsistencias] = useState(false)
  const [modalNuevaAsistencia, setModalNuevaAsistencia] = useState(false)
  const [formAsistencia, setFormAsistencia] = useState({ nombre: '', numero_documento: '', telefono: '', cargo_empresa: '', correo_externo: '' })
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)
  const [modalEnlace, setModalEnlace] = useState(false)
  const [enlaceFirma, setEnlaceFirma] = useState('')
  const [copiado, setCopiado] = useState(false)
  // PDF Control de Asistencia
  const [modalPDF, setModalPDF] = useState(false)
  const [datosInicalesPDF, setDatosInicialesPDF] = useState<DatosIniciales | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [actRes, progRes, regRes] = await Promise.all([
        fetch(`/api/sst/capacitaciones/${id}`, { headers: getAuthHeaders() }),
        fetch(`/api/sst/capacitaciones/programacion?actividad_id=${id}`, { headers: getAuthHeaders() }),
        fetch(`/api/sst/capacitaciones/registros?actividad_id=${id}`, { headers: getAuthHeaders() }),
      ])
      if (actRes.ok) {
        const d = await actRes.json()
        setActividad(d.record)
      } else {
        setError('Actividad no encontrada')
      }
      if (progRes.ok) setProgramaciones((await progRes.json()).records ?? [])
      if (regRes.ok)  setRegistros((await regRes.json()).records ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const crearProgramacion = async () => {
    setGuardandoProg(true)
    try {
      await fetch('/api/sst/capacitaciones/programacion', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          actividad_id: id,
          mes: formProg.mes,
          semana: Number(formProg.semana),
          fecha_programada: formProg.fecha_programada || undefined,
        }),
      })
      setModalProg(false)
      await cargar()
    } catch (e) {
      console.error(e)
    }
    setGuardandoProg(false)
  }

  const guardarRegistro = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/sst/capacitaciones/registros', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? 'Error al guardar')
    }
    setModalRegistro(false)
    await cargar()
  }

  const eliminarRegistro = async (registroId: string) => {
    const res = await fetch(`/api/sst/capacitaciones/registros/${registroId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}))
      console.error('[eliminarRegistro]', err.message ?? res.status)
    }
    await cargar()
  }

  const abrirEditar = () => {
    if (!actividad) return
    setFormEdit({ ...actividad.fields })
    setModalEditar(true)
  }

  const guardarEditar = async () => {
    setGuardandoEdit(true)
    try {
      const res = await fetch(`/api/sst/capacitaciones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formEdit),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setModalEditar(false)
      await cargar()
    } catch (e) {
      console.error('[guardarEditar]', e)
    }
    setGuardandoEdit(false)
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    try {
      const res = await fetch(`/api/sst/capacitaciones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      router.push('/dashboard/capacitaciones')
    } catch (e) {
      console.error('[confirmarEliminar]', e)
      setEliminando(false)
      setConfirmEliminar(false)
    }
  }

  const cargarAsistencias = useCallback(async (regId: string) => {
    setCargandoAsistencias(true)
    try {
      const res = await fetch(`/api/sst/capacitaciones/registros/${regId}/asistencias`, { headers: getAuthHeaders() })
      if (res.ok) setAsistencias((await res.json()).records ?? [])
    } catch { /* silenciar */ }
    setCargandoAsistencias(false)
  }, [])

  const seleccionarRegistro = (regId: string) => {
    setRegistroSeleccionado(regId)
    cargarAsistencias(regId)
  }

  const generarEnlaceFirma = async () => {
    if (!registroSeleccionado) return
    try {
      const res = await fetch(`/api/sst/capacitaciones/registros/${registroSeleccionado}/token`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const msg = (errBody as { message?: string }).message ?? `HTTP ${res.status}`
        throw new Error(`Error al generar enlace: ${msg}`)
      }
      const data = await res.json() as { url: string }
      setEnlaceFirma(data.url)
      setModalEnlace(true)
    } catch (e) {
      console.error('[generarEnlaceFirma]', e)
      alert((e as Error).message)
    }
  }

  const copiarEnlace = async () => {
    try {
      // navigator.clipboard solo funciona en HTTPS o localhost.
      // En HTTP por red local usamos el fallback con execCommand.
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(enlaceFirma)
      } else {
        const ta = document.createElement('textarea')
        ta.value = enlaceFirma
        ta.style.position = 'fixed'
        ta.style.opacity  = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch { /* silencioso */ }
  }

  const guardarAsistencia = async () => {
    if (!registroSeleccionado || !formAsistencia.nombre.trim()) return
    setGuardandoAsistencia(true)
    try {
      const res = await fetch(`/api/sst/capacitaciones/registros/${registroSeleccionado}/asistencias`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre_trabajador: formAsistencia.nombre.trim(),
          numero_documento: formAsistencia.numero_documento.trim() || undefined,
          telefono:         formAsistencia.telefono.trim()         || undefined,
          cargo_empresa:    formAsistencia.cargo_empresa.trim()    || undefined,
          correo_externo:   formAsistencia.correo_externo.trim()   || undefined,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setModalNuevaAsistencia(false)
      setFormAsistencia({ nombre: '', numero_documento: '', telefono: '', cargo_empresa: '', correo_externo: '' })
      await cargarAsistencias(registroSeleccionado)
    } catch (e) {
      console.error('[guardarAsistencia]', e)
    }
    setGuardandoAsistencia(false)
  }

  // Auto-seleccionar el registro más reciente cuando se carguen
  useEffect(() => {
    if (registros.length > 0 && !registroSeleccionado) {
      seleccionarRegistro(registros[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registros])


  /* â”€â”€ Loading / Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--sst-green-700)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error || !actividad) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <p className="text-red-600">{error ?? 'No encontrado'}</p>
      </div>
    )
  }

  const f = actividad.fields
  const catColor = getCategoriaColor(f.categoria)

  /* Stats rápidas */
  const progEjecutadas = programaciones.filter(p => p.fields.estado === 'Ejecutado').length
  const pctProg = calcularPct(progEjecutadas, programaciones.length)
  const totalAsistentes = registros.reduce((s, r) => s + (r.fields.presentes ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* â”€â”€ Header card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        style={{ borderLeft: `4px solid ${catColor}` }}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push('/dashboard/capacitaciones')}
            className="mt-0.5 p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: 'var(--sst-dark-500)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)'; e.currentTarget.style.color = 'var(--sst-dark-900)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--sst-dark-500)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Fila 1: ítem + categoría + certificación */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: catColor }}
              >
                Ítem #{f.item_numero}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: catColor, color: '#fff', opacity: 0.75 }}
              >
                {f.categoria}
              </span>
              {f.requiere_certificacion && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Award className="w-3 h-3" /> Certificación
                </span>
              )}
              <EstadoBadge estado={f.estado_general} size="md" />
            </div>

            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>{f.tema}</h1>
            {f.objetivo && (
              <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--sst-dark-500)' }}>{f.objetivo}</p>
            )}

            {/* Mini stats */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: 'var(--sst-dark-500)' }}>
              {f.proveedor && (
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" style={{ color: 'var(--sst-dark-300)' }} /> {f.proveedor}
                </span>
              )}
              {f.responsable && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--sst-dark-300)' }} /> {f.responsable}
                </span>
              )}
              {totalAsistentes > 0 && (
                <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--sst-cumple)' }}>
                  <ClipboardCheck className="w-3.5 h-3.5" /> {totalAsistentes} asistentes acumulados
                </span>
              )}
            </div>
          </div>

          {/* Botones editar / eliminar */}
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <button
              onClick={abrirEditar}
              className="btn btn-secondary text-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => setConfirmEliminar(true)}
              className="btn btn-danger text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* â”€â”€ Columna principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Información detallada */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--sst-dark-800)' }}>
              <BookOpen className="w-4 h-4" style={{ color: 'var(--phase-planear)' }} /> Información
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Proveedor</span>
                <p className="font-medium mt-0.5" style={{ color: 'var(--sst-dark-700)' }}>{f.proveedor || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Responsable</span>
                <p className="font-medium mt-0.5" style={{ color: 'var(--sst-dark-700)' }}>{f.responsable || '—'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Dirigido a</span>
                <p className="font-medium mt-0.5" style={{ color: 'var(--sst-dark-700)' }}>{f.dirigido_a || '—'}</p>
              </div>
              {f.normativa_aplicable && (
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: 'var(--sst-dark-500)' }}>Normativa</span>
                  <p
                    className="font-medium mt-0.5 text-xs rounded-lg px-2.5 py-1 inline-block"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--phase-planear)' }}
                  >{f.normativa_aplicable}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline de ejecuciones */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-1.5" style={{ color: 'var(--sst-dark-800)' }}>
                <ClipboardCheck className="w-4 h-4" style={{ color: 'var(--sst-cumple)' }} />
                Historial de ejecución
                <span className="ml-1 text-xs" style={{ color: 'var(--sst-dark-500)' }}>({registros.length})</span>
              </h2>
              <button
                onClick={() => setModalRegistro(true)}
                className="btn btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar ejecución
              </button>
            </div>
            <TimelineActividad
              registros={registros}
              onDelete={eliminarRegistro}
              emptyText="Sin registros de ejecución aún. Haz clic en 'Registrar ejecución' para agregar el primero."
            />
          </Card>

          {/* ── Asistencias individuales ─────────────────────────────────── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--sst-dark-800)' }}>
                <PenLine className="w-4 h-4" style={{ color: 'var(--phase-hacer)' }} />
                Asistentes individuales
                {asistencias.length > 0 && (
                  <span className="ml-1 text-xs" style={{ color: 'var(--sst-dark-500)' }}>({asistencias.length})</span>
                )}
              </h2>
              <div className="flex items-center gap-1.5">
                {registros.length > 1 && (
                  <select
                    value={registroSeleccionado ?? ''}
                    onChange={e => seleccionarRegistro(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    style={{ color: 'var(--sst-dark-700)' }}
                  >
                    {registros.map((r, i) => (
                      <option key={r.id} value={r.id}>
                        {r.fields.fecha_ejecucion ?? `Ejecución ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                {registroSeleccionado && (
                  <>
                    <button
                      onClick={generarEnlaceFirma}
                      className="btn btn-secondary text-xs"
                      title="Generar enlace de firma"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Enlace
                    </button>
                    <button
                      onClick={() => setModalNuevaAsistencia(true)}
                      className="btn btn-primary text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Agregar
                    </button>
                    <button
                      onClick={() => {
                        const reg = registros.find(r => r.id === registroSeleccionado)
                        setDatosInicialesPDF({
                          tipo_actividad: 'CAPACITACIÓN',
                          fecha: reg?.fields.fecha_ejecucion ?? '',
                          duracion_horas: String(reg?.fields.duracion_horas ?? ''),
                          lugar: reg?.fields.lugar ?? '',
                          capacitador: reg?.fields.facilitador ?? actividad?.fields.responsable ?? '',
                          num_convocados: String(reg?.fields.convocados ?? asistencias.length),
                          tema_principal: actividad?.fields.tema ?? '',
                          objetivo: actividad?.fields.objetivo ?? '',
                          contenido: reg?.fields.observaciones ?? '',
                          plan_capacitacion: 'SI',
                        })
                        setModalPDF(true)
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-colors btn btn-primary"
                      title="Generar Control de Asistencia en PDF"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </button>
                    <a
                      href={`/dashboard/capacitaciones/${id}/reportes`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--phase-planear)', border: '1px solid rgba(37,99,235,0.2)' }}
                      title="Ver historial de reportes de asistencia"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Historial
                    </a>
                  </>
                )}
              </div>
            </div>

            {registros.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardCheck className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--sst-dark-300)' }} />
                <p className="text-xs" style={{ color: 'var(--sst-dark-500)' }}>Primero registra una ejecución para gestionar asistentes.</p>
              </div>
            ) : cargandoAsistencias ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--phase-hacer)', borderTopColor: 'transparent' }} />
              </div>
            ) : asistencias.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--sst-dark-300)' }} />
                <p className="text-xs" style={{ color: 'var(--sst-dark-500)' }}>Sin asistentes registrados para esta ejecución.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--sst-dark-400)' }}>Usa el enlace de firma o agrega asistentes manualmente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Nombre de asistente</th>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--sst-dark-500)' }}>No. documento</th>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Teléfono</th>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Cargo / Empresa</th>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Correo</th>
                      <th className="text-center py-1.5 px-2 font-semibold" style={{ color: 'var(--sst-dark-500)' }}>Firma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map(a => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-1.5 px-2 font-medium" style={{ color: 'var(--sst-dark-800)' }}>{a.fields.nombre_trabajador}</td>
                        <td className="py-1.5 px-2" style={{ color: 'var(--sst-dark-600)' }}>{a.fields.numero_documento ?? '—'}</td>
                        <td className="py-1.5 px-2" style={{ color: 'var(--sst-dark-600)' }}>{a.fields.telefono ?? '—'}</td>
                        <td className="py-1.5 px-2" style={{ color: 'var(--sst-dark-600)' }}>{a.fields.cargo_empresa ?? '—'}</td>
                        <td className="py-1.5 px-2" style={{ color: 'var(--sst-dark-600)' }}>{a.fields.correo_externo ?? '—'}</td>
                        <td className="py-1.5 px-2 text-center">
                          {a.fields.firma_url
                            ? <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: 'var(--sst-cumple)' }} />
                            : <span style={{ color: 'var(--sst-dark-300)' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* â”€â”€ Columna lateral: programaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--sst-dark-800)' }}>
                <Calendar className="w-4 h-4" style={{ color: 'var(--phase-planear)' }} />
                Programación
                <span className="text-xs" style={{ color: 'var(--sst-dark-500)' }}>({programaciones.length})</span>
              </h2>
              <button
                onClick={() => setModalProg(true)}
                className="btn btn-secondary text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>

            {/* Barra de progreso de programación */}
            {programaciones.length > 0 && (
              <div className="mb-3">
                <BarraMensual value={pctProg} meta={80} height="sm" showLabel showMeta />
                <p className="text-[10px] mt-1" style={{ color: 'var(--sst-dark-500)' }}>{progEjecutadas}/{programaciones.length} sesiones ejecutadas</p>
              </div>
            )}

            {programaciones.length === 0 ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400 mb-2">Sin fechas programadas</p>
                <button
                  onClick={() => setModalProg(true)}
                  className="btn btn-ghost text-xs mt-1"
                >
                  Programar ahora
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {programaciones.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm rounded-xl px-3 py-2 transition-colors"
                    style={{ border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}
                  >
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--sst-dark-800)' }}>{p.fields.mes}</span>
                      <span className="ml-1 text-xs" style={{ color: 'var(--sst-dark-500)' }}>Sem. {p.fields.semana}</span>
                      {p.fields.fecha_programada && (
                        <p className="text-[10px]" style={{ color: 'var(--sst-dark-500)' }}>{p.fields.fecha_programada}</p>
                      )}
                    </div>
                    <EstadoBadge estado={p.fields.estado} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* â”€â”€ Modales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal open={modalRegistro} onClose={() => setModalRegistro(false)} title="Registrar ejecución">
        <RegistroForm
          actividades={actividad ? [actividad] : []}
          programaciones={programaciones}
          actividadPreseleccionada={id}
          onGuardar={guardarRegistro}
          onCancelar={() => setModalRegistro(false)}
        />
      </Modal>

      <Modal open={modalProg} onClose={() => setModalProg(false)} title="Agregar programación">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Mes</label>
              <select
                value={formProg.mes}
                onChange={e => setFormProg(p => ({ ...p, mes: e.target.value }))}
                className="input-field"
              >
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Semana</label>
              <select
                value={formProg.semana}
                onChange={e => setFormProg(p => ({ ...p, semana: e.target.value }))}
                className="input-field"
              >
                {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Semana {s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Fecha programada (opcional)</label>
            <input
              type="date"
              value={formProg.fecha_programada}
              onChange={e => setFormProg(p => ({ ...p, fecha_programada: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setModalProg(false)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button
              onClick={crearProgramacion}
              disabled={guardandoProg}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {guardandoProg ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal editar actividad ─────────────────────────────────────────── */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar actividad" size="md">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Tema *</label>
            <input
              type="text"
              value={formEdit.tema ?? ''}
              onChange={e => setFormEdit(p => ({ ...p, tema: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Objetivo</label>
            <textarea
              rows={2}
              value={formEdit.objetivo ?? ''}
              onChange={e => setFormEdit(p => ({ ...p, objetivo: e.target.value }))}
              className="input-field resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Categoría</label>
              <select
                value={formEdit.categoria ?? ''}
                onChange={e => setFormEdit(p => ({ ...p, categoria: e.target.value as CapCategoria }))}
                className="input-field"
              >
                {(['Alturas y espacios confinados','Seguridad vial y emergencias','Salud y riesgo biológico','Riesgos físicos y químicos','Psicosocial y bienestar','Ergonomía, mecánica y EPI'] as CapCategoria[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Proveedor</label>
              <select
                value={formEdit.proveedor ?? ''}
                onChange={e => setFormEdit(p => ({ ...p, proveedor: e.target.value as CapProveedor }))}
                className="input-field"
              >
                {(['Proveedor externo','ARL SURA','SENA','SST','Enfermería','Bienestar Social'] as CapProveedor[]).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Responsable</label>
              <input
                type="text"
                value={formEdit.responsable ?? ''}
                onChange={e => setFormEdit(p => ({ ...p, responsable: e.target.value }))}
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Dirigido a</label>
              <input
                type="text"
                value={formEdit.dirigido_a ?? ''}
                onChange={e => setFormEdit(p => ({ ...p, dirigido_a: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Normativa aplicable</label>
            <input
              type="text"
              value={formEdit.normativa_aplicable ?? ''}
              onChange={e => setFormEdit(p => ({ ...p, normativa_aplicable: e.target.value }))}
                className="input-field"
              />
          </div>
          <div className="flex items-center gap-2 py-1">
            <input
              id="req-cert"
              type="checkbox"
              checked={formEdit.requiere_certificacion ?? false}
              onChange={e => setFormEdit(p => ({ ...p, requiere_certificacion: e.target.checked }))}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--sst-green-700)' }}
            />
            <label htmlFor="req-cert" className="text-sm text-gray-700">Requiere certificación</label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setModalEditar(false)}
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={guardarEditar}
              disabled={guardandoEdit || !formEdit.tema}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {guardandoEdit ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confirmar eliminar actividad ──────────────────────────────────── */}
      <ConfirmModal
        open={confirmEliminar}
        title="Eliminar actividad"
        description={`¿Seguro que deseas eliminar "${f.tema}"? Esta acción es permanente y no se puede deshacer.`}
        confirmLabel="Sí, eliminar actividad"
        loading={eliminando}
        onCancel={() => setConfirmEliminar(false)}
        onConfirm={confirmarEliminar}
      />

      {/* ── Modal: Agregar asistente manualmente ─────────────────────────── */}
      <Modal open={modalNuevaAsistencia} onClose={() => setModalNuevaAsistencia(false)} title="Agregar asistente">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Número de documento</label>
            <input
              type="text"
              inputMode="numeric"
              value={formAsistencia.numero_documento}
              onChange={e => setFormAsistencia(p => ({ ...p, numero_documento: e.target.value }))}
              placeholder="Ej. 1234567890"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Nombre de asistente *</label>
            <input
              type="text"
              value={formAsistencia.nombre}
              onChange={e => setFormAsistencia(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Juan Carlos Gómez"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Número de teléfono</label>
              <input
                type="tel"
                value={formAsistencia.telefono}
                onChange={e => setFormAsistencia(p => ({ ...p, telefono: e.target.value }))}
                placeholder="Ej. 3001234567"
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Cargo o empresa</label>
              <input
                type="text"
                value={formAsistencia.cargo_empresa}
                onChange={e => setFormAsistencia(p => ({ ...p, cargo_empresa: e.target.value }))}
                placeholder="Operario / Empresa"
                className="input-field"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Correo electrónico <span className="font-normal text-gray-400">(personal externo)</span></label>
            <input
              type="email"
              value={formAsistencia.correo_externo}
              onChange={e => setFormAsistencia(p => ({ ...p, correo_externo: e.target.value }))}
              placeholder="Ej. nombre@empresa.com"
              className="input-field"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setModalNuevaAsistencia(false)} className="btn btn-secondary flex-1">Cancelar</button>
            <button
              onClick={guardarAsistencia}
              disabled={guardandoAsistencia || !formAsistencia.nombre.trim()}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {guardandoAsistencia ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: PDF Control de Asistencia ─────────────────────────────── */}
      {modalPDF && datosInicalesPDF && registroSeleccionado && (
        <ModalGenerarPDF
          isOpen={modalPDF}
          onClose={() => { setModalPDF(false); setDatosInicialesPDF(null) }}
          registroId={registroSeleccionado}
          actividadId={id}
          datosIniciales={datosInicalesPDF}
          totalAsistentes={asistencias.length}
        />
      )}

      {/* ── Modal: Enlace de firma ────────────────────────────────────────── */}
      <Modal open={modalEnlace} onClose={() => { setModalEnlace(false); setCopiado(false) }} title="Enlace de firma">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <Link2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--phase-planear)' }} />
            <p className="text-xs" style={{ color: 'var(--sst-dark-700)' }}>
              Comparte el <strong>código QR</strong> o el enlace con los asistentes. Válido por <strong>72 horas</strong>. No necesitan cuenta para firmar.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="p-4 rounded-2xl" style={{ background: '#fff', border: '1px solid var(--border)' }}>
              <QRCode value={enlaceFirma} size={200} fgColor="#052E16" />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--sst-dark-400)' }}>Escanear con la cámara del celular</p>
          </div>

          {/* URL + botón copiar */}
          <div className="flex gap-2">
            <a
              href={enlaceFirma}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono overflow-hidden transition-colors"
              style={{
                border: '1px solid rgba(37,99,235,0.35)',
                background: 'rgba(37,99,235,0.06)',
                color: 'var(--phase-planear)',
                wordBreak: 'break-all',
              }}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span style={{ wordBreak: 'break-all' }}>{enlaceFirma}</span>
            </a>
            <button
              onClick={copiarEnlace}
              className="btn btn-primary text-xs shrink-0"
              title="Copiar al portapapeles"
            >
              {copiado ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
