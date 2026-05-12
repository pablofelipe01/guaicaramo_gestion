'use client'
import { useState } from 'react'
import FirmaInline from './FirmaInline'
import ModalFirmar from './ModalFirmar'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { getAuthHeaders } from '@/lib/client/authFetch'

export interface Reporte {
  id: string
  nombre_reporte:      string
  fecha_generacion:    string
  generado_por:        string
  total_asistentes:    number
  estado:              'pendiente' | 'parcial' | 'completo'
  firma_capacitador:   string | null
  nombre_firmante_cap: string | null
  fecha_firma_cap:     string | null
  firma_director:      string | null
  nombre_firmante_dir: string | null
  fecha_firma_dir:     string | null
}

interface Props {
  reporte:      Reporte
  onActualizar: (cambios: Partial<Reporte>) => void
  onEliminar:   () => void
}

const ESTADO_UI = {
  pendiente: {
    label:     'Sin firmas',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot:       'bg-amber-400',
  },
  parcial: {
    label:     '1 de 2 firmas',
    className: 'bg-green-50 text-green-700 border border-green-200',
    dot:       'bg-green-400',
  },
  completo: {
    label:     'Completo',
    className: 'bg-[#EBF7EE] text-[#1e7e34] border border-[#C8E6C9]',
    dot:       'bg-[#28A745]',
  },
} as const

export default function FilaReporte({ reporte: r, onActualizar, onEliminar }: Props) {
  const [descargando,  setDescargando]  = useState(false)
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null)
  const [modalRol,     setModalRol]     = useState<'capacitador' | 'director' | null>(null)
  const [confirmando,  setConfirmando]  = useState(false)
  const [eliminando,   setEliminando]   = useState(false)
  const ui = ESTADO_UI[r.estado]

  const eliminarReporte = async () => {
    setEliminando(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/sst/capacitaciones/reportes/${r.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(d.message ?? `Error ${res.status}`)
      }
      onEliminar()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al eliminar')
      setConfirmando(false)
    } finally {
      setEliminando(false)
    }
  }

  const guardarFirma = async (
    rol: 'capacitador' | 'director',
    firmaB64: string,
    nombre: string
  ) => {
    setErrorMsg(null)
    const body = rol === 'capacitador'
      ? { firma_capacitador: firmaB64, nombre_firmante_cap: nombre }
      : { firma_director:    firmaB64, nombre_firmante_dir: nombre }

    const res = await fetch(`/api/sst/capacitaciones/reportes/${r.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body:    JSON.stringify(body),
    })
    const data = await res.json() as { record?: { fields: Partial<Reporte> }; message?: string }
    if (!res.ok || !data.record) {
      throw new Error(data.message ?? `Error ${res.status} al guardar firma`)
    }
    const f = data.record.fields
    onActualizar({
      estado:              f.estado              ?? r.estado,
      firma_capacitador:   f.firma_capacitador   ?? r.firma_capacitador,
      nombre_firmante_cap: f.nombre_firmante_cap ?? r.nombre_firmante_cap,
      fecha_firma_cap:     f.fecha_firma_cap     ?? r.fecha_firma_cap,
      firma_director:      f.firma_director      ?? r.firma_director,
      nombre_firmante_dir: f.nombre_firmante_dir ?? r.nombre_firmante_dir,
      fecha_firma_dir:     f.fecha_firma_dir     ?? r.fecha_firma_dir,
    })
  }

  const descargar = async () => {
    setDescargando(true)
    setErrorMsg(null)
    try {
      const res = await fetch(
        `/api/sst/capacitaciones/reportes/${r.id}/pdf-firmado`,
        { method: 'POST', headers: getAuthHeaders() }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(d.message ?? `Error ${res.status}`)
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `control_asistencia_firmado_${r.fecha_generacion.replace(/\//g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al descargar')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 hover:bg-[#FAFFF9] transition-colors">
      {/* ── Columna izquierda: metadata ─────────────────────────────────── */}
      <div className="px-5 py-4 border-b md:border-b-0 md:border-r border-[#EBF7EE]">
        <div className="flex items-start gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ui.dot}`} />
          <div>
            <p className="text-sm font-semibold text-[#1A202C] leading-snug">{r.nombre_reporte}</p>
            <div className="flex flex-wrap gap-3 mt-1.5">
              <span className="text-xs text-[#718096] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {r.fecha_generacion}
              </span>
              <span className="text-xs text-[#718096] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {r.total_asistentes} asistentes
              </span>
              <span className="text-xs text-[#718096] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {r.generado_por}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ui.className}`}>
            {ui.label}
          </span>
          {r.estado === 'completo' ? (
            <button
              onClick={descargar}
              disabled={descargando}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-[#28A745] text-white hover:bg-[#1e7e34] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {descargando ? 'Generando…' : 'PDF firmado'}
            </button>
          ) : (
            <span className="text-xs text-[#A0AEC0]">
              PDF disponible cuando ambas firmas estén completas
            </span>
          )}

          {/* Botón eliminar */}
          <button
            onClick={() => setConfirmando(true)}
            title="Eliminar reporte"
            className="ml-auto flex items-center gap-1 text-xs text-[#A0AEC0] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-600 mt-2">{errorMsg}</p>
        )}
      </div>

      {/* ── Columna derecha: firmas ──────────────────────────────────────── */}
      <div className="px-4 py-4 flex gap-3">
        <FirmaInline
          label="Capacitador"
          firmaExistente={r.firma_capacitador}
          nombreFirmante={r.nombre_firmante_cap}
          fechaFirma={r.fecha_firma_cap}
          onAbrir={() => setModalRol('capacitador')}
        />
        <FirmaInline
          label="Director o Jefe de Área"
          firmaExistente={r.firma_director}
          nombreFirmante={r.nombre_firmante_dir}
          fechaFirma={r.fecha_firma_dir}
          onAbrir={() => setModalRol('director')}
        />
      </div>
    </div>

    {/* ── Modal de firma ────────────────────────────────────────────────── */}
    {modalRol && (
      <ModalFirmar
        isOpen
        onClose={() => setModalRol(null)}
        label={modalRol === 'capacitador' ? 'Capacitador' : 'Director o Jefe de Área'}
        onFirmar={(b64, nombre) => guardarFirma(modalRol, b64, nombre)}
      />
    )}

    {/* ── Modal de confirmación de eliminación ─────────────────────────── */}
    <ConfirmModal
      open={confirmando}
      title="Eliminar reporte"
      description={`¿Seguro que deseas eliminar el reporte "${r.nombre_reporte}"? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      loading={eliminando}
      variant="danger"
      onConfirm={eliminarReporte}
      onCancel={() => setConfirmando(false)}
    />
    </>
  )
}
