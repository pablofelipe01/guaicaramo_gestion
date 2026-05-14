'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Modal } from '@/components/ui/Modal'
import { ToastContainer, useToast } from '@/components/sst/capacitaciones/Toast'
import SeccionAsistentesReportes from '@/components/sst/capacitaciones/SeccionAsistentesReportes'
import {
  BookOpen, Plus, AlertCircle, PlayCircle, Clock, Users, Calendar,
  Check, Lock, Eye, QrCode, FileText, ChevronLeft, AlertTriangle,
  RefreshCw, CheckCircle,
} from 'lucide-react'
import {
  CATEGORIAS_CAP, PROVEEDORES_CAP, calcularPct, derivarEstadoCliente,
  CAP_COLORS, ESTADO_COLOR, ALERTA_COLOR,
} from '@/lib/sst/cap-client'
import type { EstadoActividad, AlertaCobertura } from '@/lib/sst/cap-client'
import type {
  CapActividadFields, CapProgramacionFields, CapRegistroFields,
  CapCategoria, CapProveedor,
} from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { getAuthHeaders } from '@/lib/client/authFetch'
import { SelectorDirigidoA } from '@/components/sst/capacitaciones/SelectorDirigidoA'
import type { UnidadConPersonas } from '@/components/sst/capacitaciones/SelectorDirigidoA'

type Actividad = AirtableRecord<CapActividadFields>
type Prog      = AirtableRecord<CapProgramacionFields>
type Registro  = AirtableRecord<CapRegistroFields>

const FORM_INICIAL = {
  tema: '', objetivo: '', categoria: '', proveedor: 'SST',
  responsable: '', dirigido_a: '', normativa_aplicable: '',
  requiere_certificacion: false,
}

const FORM_REG_INICIAL = {
  fecha: '', lugar: '', convocados: '', presentes: '', capacitador: '', observaciones: '',
}

function capitalize(v: string): string {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v
}

type TabId = 'tablero' | 'cronograma' | 'registros' | 'evaluaciones' | 'indicadores'
const TABS: { id: TabId; label: string }[] = [
  { id: 'tablero',      label: 'Tablero' },
  { id: 'cronograma',   label: 'Cronograma' },
  { id: 'registros',    label: 'Registros' },
  { id: 'evaluaciones', label: 'Evaluaciones' },
  { id: 'indicadores',  label: 'Indicadores' },
]

const SECCIONES = [
  { label: 'Requieren atencion', estados: ['Vencida'] as string[],                   color: CAP_COLORS.rojo,   Icon: AlertCircle },
  { label: 'En progreso',        estados: ['En ejecucion', 'Programado'] as string[], color: CAP_COLORS.azul,   Icon: PlayCircle  },
  { label: 'Sin programar',      estados: ['Sin programar', 'Cancelado'] as string[], color: CAP_COLORS.gris,   Icon: Clock       },
]

// ActivityCard
interface ActivityCardProps {
  tema: string; estado: EstadoActividad; dirigidoA: string
  cobertura: number; alertaCobertura: AlertaCobertura; onClick: () => void
}
function ActivityCard({ tema, estado, dirigidoA, cobertura, alertaCobertura, onClick }: ActivityCardProps) {
  const estadoColor = ESTADO_COLOR[estado] ?? CAP_COLORS.gris
  const alertaColor = ALERTA_COLOR[alertaCobertura]
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group" style={{ borderLeft: `3px solid ${estadoColor}` }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 flex-1 text-left line-clamp-2">{tema}</p>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: estadoColor + '22', color: estadoColor }}>{estado}</span>
      </div>
      {dirigidoA && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2"><Users className="w-3 h-3 shrink-0" />{dirigidoA}</div>
      )}
      {estado === 'Sin programar' ? (
        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border mt-1" style={{ color: CAP_COLORS.verde, borderColor: CAP_COLORS.verde + '66' }}>Programar ahora</span>
      ) : (
        <div className="mt-2"><div className="w-full bg-gray-100 rounded-full" style={{ height: 4 }}><div className="rounded-full transition-all duration-700" style={{ width: `${cobertura}%`, backgroundColor: alertaColor, height: 4 }} /></div></div>
      )}
    </button>
  )
}

// Pagina principal
export default function CapacitacionesPage() {
  useAuth()
  const router       = useRouter()
  const { toasts, toast, remove } = useToast()

  const [actividades,     setActividades]     = useState<Actividad[]>([])
  const [loading,         setLoading]         = useState(true)
  const [modalNueva,      setModalNueva]      = useState(false)
  const [guardando,       setGuardando]       = useState(false)
  const [formError,       setFormError]       = useState<string | null>(null)
  const [form,            setForm]            = useState<typeof FORM_INICIAL>(FORM_INICIAL)
  const [unidades,        setUnidades]        = useState<UnidadConPersonas[]>([])
  const [loadingUnidades, setLoadingUnidades] = useState(false)
  const [activeTab,       setActiveTab]       = useState<TabId>('tablero')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sst/capacitaciones', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setActividades((await res.json()).records ?? [])
    } catch (e) { toast.error('Error al cargar', e instanceof Error ? e.message : 'Error desconocido') }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cargarUnidades = useCallback(async () => {
    if (unidades.length > 0) return
    setLoadingUnidades(true)
    try {
      const res = await fetch('/api/sst/personal/por-unidad', { headers: getAuthHeaders(), cache: 'no-store' })
      if (res.ok) setUnidades((await res.json()).unidades ?? [])
    } catch { /* silencioso */ }
    setLoadingUnidades(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidades.length])

  const total       = actividades.length
  const completadas = actividades.filter(a => a.fields.estado_general === 'Completado').length
  const conDatos    = actividades.filter(a => a.fields.alerta_cobertura && a.fields.alerta_cobertura !== 'sin_datos')
  const cobOk       = conDatos.filter(a => a.fields.alerta_cobertura === 'ok').length
  const cobertura   = calcularPct(cobOk, conDatos.length || total || 1)
  const vencidas    = actividades.filter(a =>
    (a.fields.estado_general === 'Programado' || a.fields.estado_general === 'En ejecución') &&
    a.fields.alerta_cobertura === 'critico'
  ).length
  const pctCompl = calcularPct(completadas, total)

  const grouped = useMemo(() => {
    return SECCIONES.map(sec => ({
      ...sec,
      items: actividades.filter(a => sec.estados.includes(a.fields.estado_general)),
    })).filter(sec => sec.items.length > 0)
  }, [actividades])

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab === 'cronograma')   router.push('/dashboard/capacitaciones/programacion')
    if (tab === 'registros')    router.push('/dashboard/capacitaciones/registro')
    if (tab === 'evaluaciones') router.push('/dashboard/capacitaciones/evaluaciones')
    if (tab === 'indicadores')  router.push('/dashboard/capacitaciones/indicadores')
  }

  const handleCardClick = (id: string) => {
    router.push(`/dashboard/capacitaciones/${id}`)
  }

  const crearActividad = async () => {
    if (!form.tema || !form.categoria) { setFormError('El tema y la categoria son obligatorios.'); return }
    setGuardando(true); setFormError(null)
    try {
      const res = await fetch('/api/sst/capacitaciones', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, item_numero: Math.max(0, ...actividades.map(a => a.fields.item_numero ?? 0)) + 1, anio: 2026, requiere_certificacion: form.requiere_certificacion }),
      })
      if (!res.ok) {
        let errMsg = `Error ${res.status}`
        try { const err = await res.json(); errMsg = err.message ?? errMsg } catch { /* vacio */ }
        throw new Error(errMsg)
      }
      setModalNueva(false); setForm(FORM_INICIAL)
      toast.success('Actividad creada', `"${form.tema}" agregada al plan.`)
      await cargar()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Error al guardar') }
    setGuardando(false)
  }

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: typeof value === 'string' ? capitalize(value) : value }))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-screen" style={{ background: '#DFE9DC' }}>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap rounded-xl px-5 py-4" style={{ background: '#2B2D42' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}><BookOpen className="w-6 h-6" style={{ color: '#28A745' }} /></div>
            <div><h1 className="text-xl font-medium" style={{ color: '#FFFFFF' }}>Plan de Capacitaciones SST 2026</h1><p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Decreto 1072/2015 · Resolucion 0312/2019</p></div>
          </div>
          <button onClick={() => { setModalNueva(true); cargarUnidades() }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors shrink-0" style={{ background: CAP_COLORS.verde }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1e7e34' }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = CAP_COLORS.verde }}>
            <Plus className="w-4 h-4" />Nueva actividad
          </button>
        </div>
        <nav className="flex items-center gap-1.5 flex-wrap">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className="px-3 py-1.5 text-sm rounded-lg border transition-all"
              style={activeTab === tab.id ? { background: '#28A745', color: '#FFFFFF', fontWeight: 600, border: 'none' } : { background: 'rgba(255,255,255,0.8)', color: '#2B2D42', border: '0.5px solid rgba(0,0,0,0.08)' }}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 h-24" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1" style={{ borderTop: `3px solid ${CAP_COLORS.azul}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Total actividades</span><p className="text-[26px] font-medium text-gray-900 tabular-nums leading-tight">{total}</p><p className="text-[11px] text-gray-400">Plan anual 2026</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1" style={{ borderTop: `3px solid ${CAP_COLORS.naranja}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Cobertura real</span><p className="text-[26px] font-medium text-gray-900 tabular-nums leading-tight">{cobertura}%</p><p className="text-[11px]" style={{ color: cobertura >= 80 ? CAP_COLORS.verde : CAP_COLORS.naranja }}>{cobertura >= 80 ? '✓ Meta cumplida' : `↑ Falta ${80 - cobertura}% para meta`}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1" style={{ borderTop: `3px solid ${CAP_COLORS.verde}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Completadas</span><p className="text-[26px] font-medium text-gray-900 tabular-nums leading-tight">{completadas}</p><p className="text-[11px] text-gray-400">{pctCompl}% del plan completado</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1" style={{ borderTop: `3px solid ${CAP_COLORS.rojo}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Vencidas</span><p className="text-[26px] font-medium text-gray-900 tabular-nums leading-tight">{vencidas}</p><p className="text-[11px]" style={{ color: vencidas > 0 ? CAP_COLORS.rojo : CAP_COLORS.gris }}>{vencidas > 0 ? 'Requieren accion urgente' : 'Sin vencidas'}</p></div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">{[...Array(2)].map((_, i) => (<div key={i} className="flex flex-col gap-3"><div className="h-5 bg-gray-100 rounded w-40 animate-pulse" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(3)].map((_, j) => <div key={j} className="animate-pulse bg-white rounded-xl border border-gray-200 p-4 h-24"><div className="h-3 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/2 mb-3" /><div className="h-1 bg-gray-100 rounded w-full" /></div>)}</div></div>))}</div>
      ) : actividades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BookOpen className="w-12 h-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Sin actividades en el plan</p>
          <p className="text-xs text-gray-400">Crea la primera actividad del plan de capacitaciones 2026.</p>
          <button onClick={() => { setModalNueva(true); cargarUnidades() }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: CAP_COLORS.verde }}><Plus className="w-4 h-4" /> Nueva actividad</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(sec => (
            <div key={sec.label} className="flex flex-col gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.5)' }}>
              <div className="flex items-center gap-2"><sec.Icon className="w-4 h-4" style={{ color: sec.color }} /><h2 className="text-sm font-semibold" style={{ color: sec.color }}>{sec.label}</h2><span className="text-xs text-gray-400">({sec.items.length})</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sec.items.map(a => {
                  const alerta    = (a.fields.alerta_cobertura as AlertaCobertura) ?? 'sin_datos'
                  const cobApprox = alerta === 'ok' ? 85 : alerta === 'riesgo' ? 65 : alerta === 'critico' ? 30 : 0
                  return <ActivityCard key={a.id} tema={a.fields.tema} estado={(a.fields.estado_general as EstadoActividad) ?? 'Sin programar'} dirigidoA={a.fields.dirigido_a ?? ''} cobertura={cobApprox} alertaCobertura={alerta} onClick={() => handleCardClick(a.id)} />
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalNueva} onClose={() => { setModalNueva(false); setFormError(null); setForm(FORM_INICIAL) }} title="Nueva actividad de capacitacion">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Categoria <span className="text-red-500">*</span></label><select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input-field"><option value="">Seleccionar...</option>{CATEGORIAS_CAP.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Tema / Actividad <span className="text-red-500">*</span></label><input type="text" value={form.tema} onChange={e => set('tema', e.target.value)} placeholder="Ej: Uso correcto de EPP para trabajo en alturas" className="input-field" /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Objetivo formativo</label><textarea rows={2} value={form.objetivo} onChange={e => set('objetivo', e.target.value)} className="input-field resize-none" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Proveedor</label><select value={form.proveedor} onChange={e => set('proveedor', e.target.value)} className="input-field">{PROVEEDORES_CAP.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Responsable</label><input type="text" value={form.responsable} onChange={e => set('responsable', e.target.value)} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Dirigido a</label>
              <SelectorDirigidoA
                unidades={unidades}
                loading={loadingUnidades}
                onChange={(label) => setForm(prev => ({ ...prev, dirigido_a: label }))}
              />
            </div>
            <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Normativa aplicable</label><input type="text" value={form.normativa_aplicable} onChange={e => set('normativa_aplicable', e.target.value)} placeholder="Ej: Res. 0312 Art. 11" className="input-field" /></div>
          </div>
          <div className="flex items-center gap-2 py-1">
            <input id="req-cert-nuevo" type="checkbox" checked={form.requiere_certificacion} onChange={e => set('requiere_certificacion', e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: CAP_COLORS.verde }} />
            <label htmlFor="req-cert-nuevo" className="text-sm text-gray-700">Requiere certificacion</label>
          </div>
          {formError && (<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{formError}</div>)}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => { setModalNueva(false); setFormError(null); setForm(FORM_INICIAL) }} className="btn btn-secondary flex-1">Cancelar</button>
            <button onClick={crearActividad} disabled={guardando || !form.tema || !form.categoria} className="btn btn-primary flex-1 disabled:opacity-60">
              {guardando ? (<span className="flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...</span>) : 'Crear actividad'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
