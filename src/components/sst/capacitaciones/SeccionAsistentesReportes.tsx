'use client'
import { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'
import FilaReporte from './FilaReporte'
import { ModalGenerarPDF } from './ModalGenerarPDF'
import { getAuthHeaders } from '@/lib/client/authFetch'
import type { Reporte } from './FilaReporte'
import type { DatosIniciales } from './ModalGenerarPDF'
import type { AirtableRecord } from '@/lib/airtable-client'
import type { CapRegistroFields, CapAsistenciaRegistroFields } from '@/types/sst/cap'

/** La API omite firma_encriptada y añade tiene_firma por seguridad. */
type AsistenciaClienteFields = Omit<CapAsistenciaRegistroFields, 'firma_encriptada'> & { tiene_firma: boolean }

type Registro   = AirtableRecord<CapRegistroFields>
type Asistencia = AirtableRecord<AsistenciaClienteFields>

interface Props {
  registros:      Registro[]
  actividadId:    string
  actividadFields: {
    tema:         string
    objetivo?:    string
    responsable?: string
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all border-b-2 ${
        active
          ? 'text-[#1e7e34] border-[#28A745] bg-[#FAFFF9]'
          : 'text-[#718096] border-transparent hover:text-[#1A202C] hover:bg-[#FAFFF9]'
      }`}
    >
      {children}
    </button>
  )
}

// ── componente principal ──────────────────────────────────────────────────────
export default function SeccionAsistentesReportes({
  registros, actividadId, actividadFields,
}: Props) {
  const [tab,              setTab]              = useState<'asistentes' | 'reportes'>('asistentes')
  const [regId,            setRegId]            = useState<string>(registros[0]?.id ?? '')
  const [asistencias,      setAsistencias]      = useState<Asistencia[]>([])
  const [reportes,         setReportes]         = useState<Reporte[]>([])
  const [cargandoAsis,     setCargandoAsis]     = useState(false)
  const [cargandoRep,      setCargandoRep]      = useState(false)
  const [errorAsis,        setErrorAsis]        = useState<string | null>(null)
  const [errorRep,         setErrorRep]         = useState<string | null>(null)
  // Modales
  const [modalPDF,         setModalPDF]         = useState(false)
  const [modalEnlace,      setModalEnlace]      = useState(false)
  const [enlaceFirma,      setEnlaceFirma]      = useState('')
  const [copiado,          setCopiado]          = useState(false)
  const [modalAgregar,     setModalAgregar]     = useState(false)
  const [formAsistencia,   setFormAsistencia]   = useState({
    nombre: '', numero_documento: '', telefono: '', cargo_empresa: '', correo_externo: '',
  })
  const [guardandoAsis,    setGuardandoAsis]    = useState(false)
  const [errorAgregar,     setErrorAgregar]     = useState<string | null>(null)

  // Actualizar regId cuando cambian los registros externos
  useEffect(() => {
    if (registros.length > 0 && !regId) {
      setRegId(registros[0].id)
    }
  }, [registros, regId])

  const cargarAsistencias = useCallback(async (id: string) => {
    if (!id) return
    setCargandoAsis(true)
    setErrorAsis(null)
    try {
      const res  = await fetch(`/api/sst/capacitaciones/registros/${id}/asistencias`, { headers: getAuthHeaders() })
      const data = await res.json() as { records?: Asistencia[]; message?: string }
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
      setAsistencias(data.records ?? [])
    } catch (e) {
      setErrorAsis(e instanceof Error ? e.message : 'Error al cargar asistentes')
    } finally {
      setCargandoAsis(false)
    }
  }, [])

  const cargarReportes = useCallback(async (id: string) => {
    if (!id) return
    setCargandoRep(true)
    setErrorRep(null)
    try {
      const res  = await fetch(`/api/sst/capacitaciones/reportes?id_registro=${id}`, { headers: getAuthHeaders() })
      const data = await res.json() as { records?: Array<{ id: string; fields: Reporte }>; message?: string }
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
      setReportes(
        (data.records ?? []).map(r => ({ ...r.fields, id: r.id }))
      )
    } catch (e) {
      setErrorRep(e instanceof Error ? e.message : 'Error al cargar reportes')
    } finally {
      setCargandoRep(false)
    }
  }, [])

  // Cargar datos al montar o cambiar de registro
  useEffect(() => {
    if (!regId) return
    cargarAsistencias(regId)
    cargarReportes(regId)
  }, [regId, cargarAsistencias, cargarReportes])

  const cambiarRegistro = (id: string) => {
    setRegId(id)
    setAsistencias([])
    setReportes([])
  }

  const actualizarReporte = useCallback((id: string, cambios: Partial<Reporte>) => {
    setReportes(prev => prev.map(r => r.id === id ? { ...r, ...cambios } : r))
  }, [])

  const onReporteCreado = useCallback(() => {
    cargarReportes(regId)
    setTab('reportes')
    setModalPDF(false)
  }, [cargarReportes, regId])

  // Enlace de firma
  const generarEnlace = async () => {
    if (!regId) return
    try {
      const res  = await fetch(`/api/sst/capacitaciones/registros/${regId}/token`, {
        method: 'POST', headers: getAuthHeaders(),
      })
      const data = await res.json() as { url?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
      setEnlaceFirma(data.url ?? '')
      setModalEnlace(true)
    } catch (e) {
      alert((e instanceof Error ? e.message : 'Error al generar enlace'))
    }
  }

  const copiarEnlace = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(enlaceFirma)
      } else {
        const ta = document.createElement('textarea')
        ta.value = enlaceFirma
        ta.style.position = 'fixed'
        ta.style.opacity  = '0'
        document.body.appendChild(ta)
        ta.focus(); ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch { /* silencioso */ }
  }

  // Agregar asistente
  const guardarAsistencia = async () => {
    if (!regId || !formAsistencia.nombre.trim()) return
    setGuardandoAsis(true)
    setErrorAgregar(null)
    try {
      const res = await fetch(`/api/sst/capacitaciones/registros/${regId}/asistencias`, {
        method:  'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre_trabajador: formAsistencia.nombre.trim(),
          numero_documento:  formAsistencia.numero_documento.trim() || undefined,
          telefono:          formAsistencia.telefono.trim()         || undefined,
          cargo_empresa:     formAsistencia.cargo_empresa.trim()    || undefined,
          correo_externo:    formAsistencia.correo_externo.trim()   || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(d.message ?? `Error ${res.status}`)
      }
      setModalAgregar(false)
      setFormAsistencia({ nombre: '', numero_documento: '', telefono: '', cargo_empresa: '', correo_externo: '' })
      await cargarAsistencias(regId)
    } catch (e) {
      setErrorAgregar(e instanceof Error ? e.message : 'Error al agregar')
    } finally {
      setGuardandoAsis(false)
    }
  }

  // datosIniciales para ModalGenerarPDF
  const reg = registros.find(r => r.id === regId)
  const datosIniciales: DatosIniciales = {
    tipo_actividad: 'CAPACITACIÓN',
    fecha:          reg?.fields.fecha_ejecucion ?? '',
    duracion_horas: String(reg?.fields.duracion_horas ?? ''),
    lugar:          reg?.fields.lugar       ?? '',
    capacitador:    reg?.fields.facilitador ?? actividadFields.responsable ?? '',
    num_convocados: String(reg?.fields.convocados ?? asistencias.length),
    tema_principal: actividadFields.tema ?? '',
    objetivo:       actividadFields.objetivo ?? '',
    contenido:      reg?.fields.observaciones ?? '',
    plan_capacitacion: 'SI',
  }

  const reportesCount = reportes.length

  return (
    <>
      <div className="border border-[#C8E6C9] rounded-xl overflow-hidden bg-white">

        {/* ── Header con tabs + toolbar ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-y-0 border-b border-[#C8E6C9]">
          <div className="flex">
            <TabBtn active={tab === 'asistentes'} onClick={() => setTab('asistentes')}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden xs:inline">Asistentes</span>
              <span>({asistencias.length})</span>
            </TabBtn>
            <TabBtn active={tab === 'reportes'} onClick={() => setTab('reportes')}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden xs:inline">Reportes</span>{reportesCount > 0 ? ` (${reportesCount})` : ''}
            </TabBtn>
          </div>

          {/* Toolbar derecho: selector de registro + acciones contextuales */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-3 py-1">
            {registros.length > 1 && (
              <select
                value={regId}
                onChange={e => cambiarRegistro(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#28A745] text-gray-700 max-w-[120px] sm:max-w-none"
              >
                {registros.map((r, i) => (
                  <option key={r.id} value={r.id}>
                    {r.fields.fecha_ejecucion ?? `Ejecución ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
            {regId && tab === 'asistentes' && (
              <>
                <button
                  onClick={generarEnlace}
                  title="Generar enlace de firma"
                  className="flex items-center gap-1 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#C8E6C9] text-[#718096] hover:bg-[#EBF7EE] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="hidden sm:inline">Enlace</span>
                </button>
                <button
                  onClick={() => setModalAgregar(true)}
                  title="Agregar asistente"
                  className="flex items-center gap-1 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#28A745] text-white hover:bg-[#1e7e34] transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="hidden sm:inline">Agregar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── TAB ASISTENTES ──────────────────────────────────────────────── */}
        {tab === 'asistentes' && (
          <div className="overflow-x-auto">
            {cargandoAsis ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#28A745] border-t-transparent" />
              </div>
            ) : errorAsis ? (
              <div className="p-6 text-center text-sm text-red-600 bg-red-50">{errorAsis}</div>
            ) : asistencias.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#A0AEC0]">No hay asistentes registrados para esta ejecución.</p>
                <p className="text-xs text-[#CBD5E0] mt-1">Usa el enlace de firma o agrega asistentes manualmente.</p>
              </div>
            ) : (
              <>
                {/* Vista móvil: tarjetas */}
                <div className="sm:hidden divide-y divide-[#EBF7EE]">
                  {asistencias.map(a => (
                    <div key={a.id} className="px-4 py-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#1A202C] truncate">{a.fields.nombre_trabajador}</p>
                        <p className="text-xs text-[#718096] mt-0.5">{a.fields.cargo_empresa ?? ''}{a.fields.numero_documento ? ` · ${a.fields.numero_documento}` : ''}</p>
                        {a.fields.telefono && <p className="text-xs text-[#A0AEC0]">{a.fields.telefono}</p>}
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {a.fields.tiene_firma
                          ? <svg className="w-5 h-5 text-[#28A745]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          : <span className="text-xs text-[#D1D5DB]">Sin firma</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
                {/* Vista escritorio: tabla */}
                <table className="hidden sm:table w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#EBF7EE]">
                      {['Nombre de asistente', 'No. documento', 'Teléfono', 'Cargo / Empresa', 'Correo', 'Firma'].map(h => (
                        <th key={h} className="text-left py-2 px-3 font-semibold text-[#718096]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map(a => (
                      <tr key={a.id} className="border-b border-[#EBF7EE] last:border-0 hover:bg-[#FAFFF9]">
                        <td className="py-2 px-3 font-medium text-[#1A202C]">{a.fields.nombre_trabajador}</td>
                        <td className="py-2 px-3 text-[#718096]">{a.fields.numero_documento ?? '—'}</td>
                        <td className="py-2 px-3 text-[#718096]">{a.fields.telefono ?? '—'}</td>
                        <td className="py-2 px-3 text-[#718096]">{a.fields.cargo_empresa ?? '—'}</td>
                        <td className="py-2 px-3 text-[#718096]">{a.fields.correo_externo ?? '—'}</td>
                        <td className="py-2 px-3 text-center">
                          {a.fields.tiene_firma
                            ? <svg className="w-4 h-4 mx-auto text-[#28A745]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            : <span className="text-[#D1D5DB]">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── TAB REPORTES ────────────────────────────────────────────────── */}
        {tab === 'reportes' && (
          <div>
            {cargandoRep ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#28A745] border-t-transparent" />
              </div>
            ) : errorRep ? (
              <div className="p-6 text-center text-sm text-red-600 bg-red-50">{errorRep}</div>
            ) : reportes.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="w-10 h-10 mx-auto text-[#C8E6C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-[#A0AEC0] mt-2">No hay reportes generados aún</p>
                <p className="text-xs text-[#C8E6C9] mt-1">Genera el primer PDF para comenzar el historial</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EBF7EE]">
                {reportes.map(r => (
                  <FilaReporte
                    key={r.id}
                    reporte={r}
                    onActualizar={cambios => actualizarReporte(r.id, cambios)}
                    onEliminar={() => setReportes(prev => prev.filter(x => x.id !== r.id))}
                  />
                ))}
              </div>
            )}

            {/* Footer — generar nuevo reporte */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#EBF7EE] bg-[#FAFFF9]">
              <button
                onClick={() => setModalPDF(true)}
                disabled={!regId}
                className="flex items-center gap-2 text-sm font-semibold text-[#1e7e34] hover:text-[#28A745] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generar nuevo reporte
              </button>
              {reportesCount > 0 && (
                <span className="text-xs text-[#A0AEC0]">
                  {reportes.filter(r => r.estado === 'completo').length} de {reportesCount} completo{reportes.filter(r => r.estado === 'completo').length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: generar PDF ───────────────────────────────────────────── */}
      {modalPDF && regId && (
        <ModalGenerarPDF
          isOpen={modalPDF}
          onClose={() => setModalPDF(false)}
          registroId={regId}
          actividadId={actividadId}
          datosIniciales={datosIniciales}
          totalAsistentes={asistencias.length}
          onSuccess={onReporteCreado}
        />
      )}

      {/* ── Modal: enlace de firma ──────────────────────────────────────── */}
      {modalEnlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setModalEnlace(false); setCopiado(false) }} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1A202C]">Enlace de firma</h3>
              <button onClick={() => { setModalEnlace(false); setCopiado(false) }} className="text-[#A0AEC0] hover:text-[#718096]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-xs text-gray-700">
                Comparte el <strong>código QR</strong> o el enlace. Válido por <strong>72 horas</strong>. No necesitan cuenta para firmar.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="p-4 rounded-2xl bg-white border border-gray-200">
                <QRCode value={enlaceFirma} size={180} fgColor="#052E16" />
              </div>
              <p className="text-[11px] text-gray-400">Escanear con la cámara del celular</p>
            </div>

            <div className="flex gap-2">
              <a
                href={enlaceFirma}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-1 px-2 py-2 rounded-xl text-xs font-mono overflow-hidden text-blue-600"
                style={{ border: '1px solid rgba(37,99,235,0.35)', background: 'rgba(37,99,235,0.06)', wordBreak: 'break-all' }}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span style={{ wordBreak: 'break-all' }}>{enlaceFirma}</span>
              </a>
              <button
                onClick={copiarEnlace}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-[#28A745] text-white hover:bg-[#1e7e34] transition-colors"
              >
                {copiado ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: agregar asistente ─────────────────────────────────────── */}
      {modalAgregar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalAgregar(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#1A202C]">Agregar asistente</h3>
              <button onClick={() => setModalAgregar(false)} className="text-[#A0AEC0] hover:text-[#718096]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Número de documento</label>
              <input type="text" inputMode="numeric" value={formAsistencia.numero_documento} onChange={e => setFormAsistencia(p => ({ ...p, numero_documento: e.target.value }))} placeholder="Ej. 1234567890" className="input-field" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Nombre de asistente *</label>
              <input type="text" value={formAsistencia.nombre} onChange={e => setFormAsistencia(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej. Juan Carlos Gómez" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Teléfono</label>
                <input type="tel" value={formAsistencia.telefono} onChange={e => setFormAsistencia(p => ({ ...p, telefono: e.target.value }))} placeholder="3001234567" className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Cargo / empresa</label>
                <input type="text" value={formAsistencia.cargo_empresa} onChange={e => setFormAsistencia(p => ({ ...p, cargo_empresa: e.target.value }))} placeholder="Operario" className="input-field" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Correo electrónico</label>
              <input type="email" value={formAsistencia.correo_externo} onChange={e => setFormAsistencia(p => ({ ...p, correo_externo: e.target.value }))} placeholder="nombre@empresa.com" className="input-field" />
            </div>
            {errorAgregar && <p className="text-xs text-red-600">{errorAgregar}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModalAgregar(false)} className="btn btn-secondary flex-1">Cancelar</button>
              <button onClick={guardarAsistencia} disabled={guardandoAsis || !formAsistencia.nombre.trim()} className="btn btn-primary flex-1 disabled:opacity-60">
                {guardandoAsis ? 'Guardando…' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
