'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/client/authFetch'
import FirmaVerificacion from '@/components/sst/capacitaciones/FirmaVerificacion'
import type { PDFHeaderData } from '@/lib/pdf/asistencia'

type EstadoReporte = 'pendiente' | 'parcial' | 'completo'

interface ReporteDetalle {
  id: string
  fields: {
    nombre_reporte:       string
    fecha_generacion:     string
    generado_por:         string
    total_asistentes:     number
    estado:               EstadoReporte
    firma_capacitador?:   string
    nombre_firmante_cap?: string
    fecha_firma_cap?:     string
    firma_director?:      string
    nombre_firmante_dir?: string
    fecha_firma_dir?:     string
    datos_encabezado:     string
    datos_encabezado_parsed?: PDFHeaderData
  }
}

const ESTADO_LABELS: Record<EstadoReporte, string>   = { pendiente: 'Sin firmas', parcial: 'Incompleto', completo: 'Completo' }
const ESTADO_COLORS: Record<EstadoReporte, string>   = {
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  parcial:   'bg-green-100 text-green-700 border-green-200',
  completo:  'bg-green-100 text-green-700 border-green-200',
}

function formatFecha(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function CampoInfo({ label, valor }: { label: string; valor?: string }) {
  if (!valor) return null
  return (
    <div>
      <dt className="text-xs text-gray-500 font-medium">{label}</dt>
      <dd className="text-sm text-gray-800 mt-0.5">{valor}</dd>
    </div>
  )
}

export default function ReporteDetallePage() {
  const { id: actividadId, reporteId } = useParams<{ id: string; reporteId: string }>()
  const [reporte,      setReporte]      = useState<ReporteDetalle | null>(null)
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [descargando,  setDescargando]  = useState(false)

  const cargarReporte = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/sst/capacitaciones/reportes/${reporteId}`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error('Error al cargar el reporte')
      const data = await res.json() as ReporteDetalle
      setReporte(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [reporteId])

  useEffect(() => { cargarReporte() }, [cargarReporte])

  async function guardarFirma(rol: 'capacitador' | 'director', firmaB64: string, nombre: string) {
    const body = rol === 'capacitador'
      ? { firma_capacitador: firmaB64, nombre_firmante_cap: nombre }
      : { firma_director: firmaB64,    nombre_firmante_dir: nombre }

    const res = await fetch(
      `/api/sst/capacitaciones/reportes/${reporteId}`,
      {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) throw new Error('Error al guardar la firma')
    // Recargar para mostrar datos actualizados
    await cargarReporte()
  }

  async function descargarPDFFirmado() {
    if (!reporte || reporte.fields.estado !== 'completo') return
    setDescargando(true)
    try {
      const res = await fetch(
        `/api/sst/capacitaciones/reportes/${reporteId}/pdf-firmado`,
        { method: 'POST', headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error('Error al generar PDF firmado')
      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href      = url
      a.download  = `control_asistencia_firmado_${reporteId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al descargar el PDF')
    } finally {
      setDescargando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !reporte) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 text-sm">{error ?? 'Reporte no encontrado'}</p>
        <Link href={`/dashboard/capacitaciones/${actividadId}/reportes`} className="mt-4 inline-block text-sm text-green-600 hover:underline">
          ← Volver al historial
        </Link>
      </div>
    )
  }

  const f    = reporte.fields
  const enc  = f.datos_encabezado_parsed ?? (f.datos_encabezado ? JSON.parse(f.datos_encabezado) as PDFHeaderData : null)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link
          href={`/dashboard/capacitaciones/${actividadId}/reportes`}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors mt-0.5"
          title="Volver al historial"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{f.nombre_reporte}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_COLORS[f.estado]}`}>
              {ESTADO_LABELS[f.estado]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Generado el {formatFecha(f.fecha_generacion)} por <span className="font-medium">{f.generado_por}</span>
            {' '}· {f.total_asistentes} asistente{f.total_asistentes !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Datos del encabezado */}
      {enc && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Datos del Control de Asistencia</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <CampoInfo label="Tema"          valor={enc.tema_principal} />
            <CampoInfo label="Fecha"         valor={enc.fecha} />
            <CampoInfo label="Duración (h)"  valor={enc.duracion_horas} />
            <CampoInfo label="Lugar"         valor={enc.lugar} />
            <CampoInfo label="Capacitador"   valor={enc.capacitador} />
            <CampoInfo label="Convocados"    valor={enc.num_convocados} />
            {enc.objetivo && (
              <div className="col-span-2 sm:col-span-3">
                <CampoInfo label="Objetivo" valor={enc.objetivo} />
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Sección firmas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Firmas de Verificación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FirmaVerificacion
            label="Capacitador u Organizador"
            rol="capacitador"
            firmaExistente={f.firma_capacitador}
            nombreFirmante={f.nombre_firmante_cap}
            fechaFirma={f.fecha_firma_cap}
            onFirmar={(b64, nombre) => guardarFirma('capacitador', b64, nombre)}
          />
          <FirmaVerificacion
            label="Director o Responsable del Área"
            rol="director"
            firmaExistente={f.firma_director}
            nombreFirmante={f.nombre_firmante_dir}
            fechaFirma={f.fecha_firma_dir}
            onFirmar={(b64, nombre) => guardarFirma('director', b64, nombre)}
          />
        </div>
      </div>

      {/* Botón descargar PDF firmado */}
      <div className="flex justify-end">
        <button
          onClick={descargarPDFFirmado}
          disabled={f.estado !== 'completo' || descargando}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          title={f.estado !== 'completo' ? 'Se necesitan ambas firmas para descargar el PDF' : 'Descargar PDF con firmas incrustadas'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {descargando ? 'Generando PDF…' : 'Descargar PDF firmado'}
        </button>
      </div>

      {f.estado !== 'completo' && (
        <p className="text-xs text-gray-400 text-right mt-2">
          Se necesitan las dos firmas para habilitar la descarga del PDF firmado.
        </p>
      )}
    </div>
  )
}
