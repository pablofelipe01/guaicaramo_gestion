'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ToastContainer, useToast } from '@/components/sst/capacitaciones/Toast'
import { PanelDerecho } from '@/components/sst/capacitaciones/PanelDerecho'
import { TabProgramacion } from '@/components/sst/capacitaciones/TabProgramacion'
import { TabEjecuciones } from '@/components/sst/capacitaciones/TabEjecuciones'
import { getAuthHeaders } from '@/lib/client/authFetch'
import {
  derivarEstadoCliente,
  CAP_COLORS, ALERTA_COLOR,
} from '@/lib/sst/cap-client'
import type { EstadoActividad, AlertaCobertura } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapProgramacionFields, CapRegistroFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import {
  ChevronLeft, AlertCircle, CheckCircle, AlertTriangle,
  BookOpen, Calendar, PlayCircle,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Actividad = AirtableRecord<CapActividadFields>
type Prog      = AirtableRecord<CapProgramacionFields>
type Registro  = AirtableRecord<CapRegistroFields>

interface FaltanteItem {
  nombre_empleado: string
  descripcion_cargo: string | null
  numero_documento: string
  iniciales: string
}

interface FaltantesData {
  dirigido_a:    string | null
  total_unidad:  number
  asistidos:     number
  pct_cobertura: number
  faltantes:     FaltanteItem[]
  warning?:      string
}

type TabDetalle = 'programacion' | 'ejecuciones'

// ─── Alerta contextual ────────────────────────────────────────────────────────

type AlertBoxType = 'ok' | 'warn' | 'error' | 'info'

function AlertaContextual({
  tipo,
  mensaje,
}: {
  tipo: AlertBoxType
  mensaje: string
}) {
  const bg:     Record<AlertBoxType, string> = {
    ok:    CAP_COLORS.verdeLight,
    warn:  CAP_COLORS.naranjaLight,
    error: CAP_COLORS.rojoLight,
    info:  CAP_COLORS.verdeLight,
  }
  const border: Record<AlertBoxType, string> = {
    ok:    '#b7dfbf',
    warn:  '#ffd6b3',
    error: '#f5c6cb',
    info:  '#b7dfbf',
  }
  const txt: Record<AlertBoxType, string> = {
    ok:    '#155724',
    warn:  '#7a3e00',
    error: '#721c24',
    info:  '#155724',
  }
  const IconMap: Record<AlertBoxType, React.ElementType> = {
    ok:    CheckCircle,
    warn:  AlertTriangle,
    error: AlertCircle,
    info:  BookOpen,
  }
  const Icon = IconMap[tipo]

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 border text-sm"
      style={{ background: bg[tipo], borderColor: border[tipo], color: txt[tipo] }}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      {mensaje}
    </div>
  )
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────

function SkeletonDetalle() {
  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-56" />
      <div className="h-4 bg-gray-100 rounded w-72" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mt-2">
        <div className="flex flex-col gap-4">
          <div className="h-10 bg-gray-200 rounded-xl" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CapacitacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  useAuth()
  const router = useRouter()
  const { toasts, toast, remove } = useToast()

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [actividad,      setActividad]      = useState<Actividad | null>(null)
  const [programaciones, setProgramaciones] = useState<Prog[]>([])
  const [registros,      setRegistros]      = useState<Registro[]>([])
  const [faltantesData,  setFaltantesData]  = useState<FaltantesData | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [loadingFalt,    setLoadingFalt]    = useState(false)
  const [tabActiva,      setTabActiva]      = useState<TabDetalle>('programacion')

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, pRes, rRes] = await Promise.all([
        fetch(`/api/sst/capacitaciones/${id}`,                              { headers: getAuthHeaders() }),
        fetch(`/api/sst/capacitaciones/programacion?actividad_id=${id}`,    { headers: getAuthHeaders() }),
        fetch(`/api/sst/capacitaciones/registros?actividad_id=${id}`,       { headers: getAuthHeaders() }),
      ])
      if (aRes.ok) setActividad((await aRes.json()).record)
      if (pRes.ok) setProgramaciones((await pRes.json()).records ?? [])
      if (rRes.ok) setRegistros((await rRes.json()).records ?? [])
    } catch { /* silencioso */ }
    setLoading(false)
  }, [id])

  const cargarFaltantes = useCallback(async () => {
    setLoadingFalt(true)
    try {
      const res = await fetch(`/api/sst/capacitaciones/${id}/faltantes`, { headers: getAuthHeaders() })
      if (res.ok) setFaltantesData(await res.json())
    } catch { /* silencioso */ }
    setLoadingFalt(false)
  }, [id])

  useEffect(() => {
    cargar()
    cargarFaltantes()
  }, [cargar, cargarFaltantes])

  const refresh = useCallback(async () => {
    await cargar()
    await cargarFaltantes()
  }, [cargar, cargarFaltantes])

  // ── Derivados ──────────────────────────────────────────────────────────────
  if (loading) return <SkeletonDetalle />

  if (!actividad) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Volver al plan
        </button>
        <p className="text-red-600">Actividad no encontrada.</p>
      </div>
    )
  }

  const f              = actividad.fields
  const estadoActividad = derivarEstadoCliente(
    programaciones.map(p => ({ estado: p.fields.estado })),
  ) as EstadoActividad
  const alerta         = (f.alerta_cobertura ?? 'sin_datos') as AlertaCobertura
  const alertaColor    = ALERTA_COLOR[alerta]
  const cobPct         = faltantesData?.pct_cobertura ?? 0
  const tieneRegistros = registros.some(r => (r.fields.presentes ?? 0) > 0)
  const completado     = estadoActividad === 'Completado'

  // Mensaje de alerta contextual
  let alertTipo: AlertBoxType = 'info'
  let alertMsg  = ''
  if (completado) {
    alertTipo = 'ok'
    alertMsg  = 'Actividad completada. Todos los documentos disponibles.'
  } else if (estadoActividad === 'Vencida') {
    alertTipo = 'error'
    alertMsg  = 'Actividad vencida. Fecha límite superada. Reprogramar urgente.'
  } else if (alerta === 'critico') {
    alertTipo = 'error'
    alertMsg  = faltantesData
      ? `${faltantesData.faltantes.length} personas de ${f.dirigido_a ?? 'la unidad'} no han asistido. Meta: 80%.`
      : `Cobertura crítica en ${f.dirigido_a ?? 'la unidad'}. Meta: 80%.`
  } else if (alerta === 'riesgo') {
    alertTipo = 'warn'
    alertMsg  = faltantesData
      ? `${faltantesData.faltantes.length} personas de ${f.dirigido_a ?? 'la unidad'} no han asistido. Meta: 80%.`
      : 'Cobertura en riesgo. Meta: 80%.'
  } else if (alerta === 'ok') {
    alertTipo = 'ok'
    alertMsg  = 'Actividad en buen estado de cobertura.'
  } else {
    alertTipo = 'info'
    alertMsg  = 'Sin datos de asistencia aún. Registra la primera sesión.'
  }

  const TABS_DETALLE: { id: TabDetalle; label: string; Icon: React.ElementType }[] = [
    { id: 'programacion', label: 'Programación', Icon: Calendar    },
    { id: 'ejecuciones',  label: 'Ejecuciones',  Icon: PlayCircle  },
  ]

  void alertaColor

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

<div className="flex flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto min-h-screen">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          <button
            onClick={() => router.push('/dashboard/capacitaciones')}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity font-medium"
            style={{ color: '#6C757D' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Plan de Capacitaciones
          </button>
          <span className="mx-1 text-gray-400">/</span>
          <span className="font-medium truncate max-w-xs text-gray-900">{f.tema}</span>
        </nav>

        {/* Encabezado de la actividad */}
        <div>
          <h1 className="text-xl leading-tight text-gray-900 font-medium">{f.tema}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: (ALERTA_COLOR[alerta] ?? CAP_COLORS.gris) + '22',
                color:      ALERTA_COLOR[alerta] ?? CAP_COLORS.gris,
              }}
            >
              {estadoActividad}
            </span>
            {f.categoria && (
              <span className="text-xs text-gray-500">{f.categoria}</span>
            )}
            {f.responsable && (
              <span className="text-xs text-gray-400">Responsable: {f.responsable}</span>
            )}
          </div>
        </div>

        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">

          {/* ── Columna izquierda ───────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Alerta contextual */}
            <AlertaContextual tipo={alertTipo} mensaje={alertMsg} />

            {/* Pestañas */}
            <div
              className="flex gap-1 p-1 rounded-xl w-fit"
              style={{ background: 'rgba(22,101,52,0.08)' }}
            >
              {TABS_DETALLE.map(tab => {
                const active = tabActiva === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium transition-all"
                    style={
                      active
                        ? { background: '#FFFFFF', color: CAP_COLORS.verde, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                        : { color: '#6C757D' }
                    }
                  >
                    <tab.Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Contenido del tab activo */}
            {tabActiva === 'programacion' && (
              <TabProgramacion
                actividadId={id}
                programaciones={programaciones}
                onRefresh={refresh}
                toastSuccess={toast.success}
                toastError={toast.error}
              />
            )}

            {tabActiva === 'ejecuciones' && (
              <TabEjecuciones
                actividadId={id}
                actividad={actividad}
                programaciones={programaciones}
                registros={registros}
                onRefresh={refresh}
                toastSuccess={toast.success}
                toastError={toast.error}
              />
            )}
          </div>

          {/* ── Columna derecha: Panel lateral ──────────────────────────── */}
          <PanelDerecho
            actividadId={id}
            estadoActividad={estadoActividad}
            alertaCobertura={alerta}
            pctCobertura={cobPct}
            asistidos={faltantesData?.asistidos ?? 0}
            faltantes={faltantesData?.faltantes ?? []}
            loadingFaltantes={loadingFalt}
            dirigidoA={f.dirigido_a}
            tieneRegistros={tieneRegistros}
          />
        </div>
      </div>
    </>
  )
}
