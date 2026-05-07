'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/client/authFetch'

type EstadoReporte = 'pendiente' | 'parcial' | 'completo'

interface ReporteLista {
  id: string
  fields: {
    nombre_reporte:   string
    fecha_generacion: string
    generado_por:     string
    total_asistentes: number
    estado:           EstadoReporte
    tiene_firma_cap:  boolean
    tiene_firma_dir:  boolean
  }
}

const TAB_LABELS: Record<EstadoReporte | 'todos', string> = {
  todos:     'Todos',
  pendiente: 'Sin firmas',
  parcial:   'Incompletos',
  completo:  'Completos',
}

const ESTADO_STYLES: Record<EstadoReporte, { bg: string; text: string; border: string; dot: string }> = {
  pendiente: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-400'  },
  parcial:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-400'   },
  completo:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', dot: 'bg-green-500'  },
}

const ACENTO: Record<EstadoReporte, string> = {
  pendiente: 'border-l-amber-400',
  parcial:   'border-l-blue-400',
  completo:  'border-l-green-500',
}

function FirmaMiniIndicador({ label, activa }: { label: string; activa: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {activa
        ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
        : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      }
      {label}
    </span>
  )
}

export default function ReportesListPage() {
  const { id: actividadId } = useParams<{ id: string }>()
  const [reportes, setReportes]   = useState<ReporteLista[]>([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [tabActivo, setTabActivo] = useState<EstadoReporte | 'todos'>('todos')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        const res = await fetch(
          `/api/sst/capacitaciones/reportes?id_actividad=${actividadId}`,
          { headers: getAuthHeaders() }
        )
        const data = await res.json() as { records: ReporteLista[]; message?: string }
        if (!res.ok) throw new Error(data.message ?? `Error ${res.status} al cargar reportes`)
        setReportes(data.records)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      } finally {
        setCargando(false)
      }
    }
    if (actividadId) cargar()
  }, [actividadId])

  const reportesFiltrados = tabActivo === 'todos'
    ? reportes
    : reportes.filter(r => r.fields.estado === tabActivo)

  function formatFecha(iso: string) {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard/capacitaciones/${actividadId}`}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Volver a la actividad"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de Asistencia — verificaciones de firma</p>
        </div>
      </div>

      {/* Tabs de filtro */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        {(Object.keys(TAB_LABELS) as Array<EstadoReporte | 'todos'>).map(tab => {
          const count = tab === 'todos' ? reportes.length : reportes.filter(r => r.fields.estado === tab).length
          return (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tabActivo === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tabActivo === tab ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Estados de carga / error */}
      {cargando && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!cargando && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!cargando && !error && reportesFiltrados.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-sm">
            {tabActivo === 'todos' ? 'No hay reportes generados aún.' : `No hay reportes con estado "${TAB_LABELS[tabActivo]}".`}
          </p>
        </div>
      )}

      {/* Lista de reportes */}
      {!cargando && !error && reportesFiltrados.length > 0 && (
        <div className="space-y-3">
          {reportesFiltrados.map(reporte => {
            const s = ESTADO_STYLES[reporte.fields.estado]
            return (
              <Link
                key={reporte.id}
                href={`/dashboard/capacitaciones/${actividadId}/reportes/${reporte.id}`}
                className={`block border-l-4 ${ACENTO[reporte.fields.estado]} border border-gray-200 rounded-xl bg-white p-4 hover:shadow-md transition-all group`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                      {reporte.fields.nombre_reporte}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-xs text-gray-500">
                        {formatFecha(reporte.fields.fecha_generacion)}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">
                        {reporte.fields.total_asistentes} asistente{reporte.fields.total_asistentes !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">
                        por <span className="font-medium">{reporte.fields.generado_por}</span>
                      </span>
                    </div>
                  </div>

                  {/* Badge estado */}
                  <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {TAB_LABELS[reporte.fields.estado]}
                  </span>
                </div>

                {/* Indicadores de firma */}
                <div className="flex gap-2 mt-3">
                  <FirmaMiniIndicador label="Capacitador" activa={reporte.fields.tiene_firma_cap} />
                  <FirmaMiniIndicador label="Director"    activa={reporte.fields.tiene_firma_dir} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
